import { createHash } from 'node:crypto';

export const RIGHTS_ALLOWED = new Set(['AUTHORIZED', 'OPEN_LICENSE', 'TUTOR_ME_OWNED', 'USER_PROVIDED_AUTHORIZED']);

export function normalizeText(value = '') {
  return String(value).normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim().replace(/\s+/g, ' ');
}

export function contentHash(question) {
  const options = Object.entries(question.options ?? {}).sort(([a], [b]) => a.localeCompare(b)).map(([key, value]) => `${key}:${normalizeText(value)}`).join('|');
  return createHash('sha256').update(`${normalizeText(question.prompt)}\n${options}`).digest('hex');
}

export function jaccardSimilarity(left, right) {
  const a = new Set(normalizeText(left).split(' ').filter(Boolean));
  const b = new Set(normalizeText(right).split(' ').filter(Boolean));
  const intersection = [...a].filter((word) => b.has(word)).length;
  return intersection / Math.max(1, new Set([...a, ...b]).size);
}

export function dedupeQuestions(rows, threshold = 0.75) {
  const canonical = []; const duplicates = []; const exactMatches = new Map(); const similarityGroups = new Map();
  const wordsFor = (value) => new Set(normalizeText(value).split(' ').filter(Boolean));
  const similarity = (left, right) => { const intersection = [...left].filter((word) => right.has(word)).length; return intersection / Math.max(1, new Set([...left, ...right]).size); };
  for (const row of rows) {
    const hash = contentHash(row);
    const groupKey = `${row.exam ?? ''}|${row.subject ?? ''}`;
    const group = similarityGroups.get(groupKey) ?? [];
    const words = wordsFor(row.prompt);
    const exactMatch = exactMatches.get(hash); const nearMatch = exactMatch ? null : group.find((entry) => similarity(entry.words, words) >= threshold)?.question;
    const match = exactMatch ?? nearMatch;
    if (match) {
      const provenance = { source: row.source, sourceName: row.sourceName, sourceId: row.sourceId, sourceUrl: row.sourceUrl, rightsStatus: row.rightsStatus ?? 'UNKNOWN', rightsEvidence: row.rightsEvidence ?? null, sourceMetadata: row.sourceMetadata ?? null };
      const records = match.provenanceRecords ?? [];
      if (!records.some((item) => item.source === provenance.source && item.sourceId === provenance.sourceId)) records.push(provenance);
      match.provenanceRecords = records;
      duplicates.push({ duplicateId: row.id, canonicalId: match.id, source: row.source, sourceId: row.sourceId, duplicateReason: exactMatch ? 'exact content duplicate' : 'near-duplicate prompt' }); continue;
    }
    const retained = { ...row, contentHash: hash, duplicateGroupId: row.duplicateGroupId ?? null, provenanceRecords: row.provenanceRecords ?? [{ source: row.source, sourceName: row.sourceName, sourceId: row.sourceId, sourceUrl: row.sourceUrl, rightsStatus: row.rightsStatus ?? 'UNKNOWN', rightsEvidence: row.rightsEvidence ?? null, sourceMetadata: row.sourceMetadata ?? null }] };
    canonical.push(retained); exactMatches.set(hash, retained); group.push({ question: retained, words }); similarityGroups.set(groupKey, group);
  }
  return { canonical, duplicates };
}

export function isRightsEligible(question) {
  return RIGHTS_ALLOWED.has(String(question.rightsStatus ?? '').toUpperCase()) && question.verificationStatus === 'verified';
}

export function mulberry32(seed) {
  let value = typeof seed === 'number' ? seed >>> 0 : createHash('sha256').update(String(seed)).digest().readUInt32LE(0);
  return () => { value |= 0; value = value + 0x6D2B79F5 | 0; let t = Math.imul(value ^ value >>> 15, 1 | value); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}

export function seededShuffle(rows, seed) {
  const result = [...rows]; const random = mulberry32(seed);
  for (let i = result.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [result[i], result[j]] = [result[j], result[i]]; }
  return result;
}

export function buildFullForm(pools, subjects, seed) {
  if (!Array.isArray(subjects) || subjects.length !== 4 || subjects[0] !== 'Use of English') throw new Error('Select Use of English and three other subjects.');
  const form = [];
  for (const subject of subjects) {
    const count = subject === 'Use of English' ? 60 : 40;
    const available = (pools[subject] ?? []).filter(isRightsEligible);
    if (available.length < count) throw new Error(`${subject} pool is insufficient: ${available.length}/${count}`);
    form.push(...seededShuffle(available, `${seed}:${subject}`).slice(0, count));
  }
  if (new Set(form.map((question) => question.id)).size !== 180) throw new Error('Question IDs must be unique across all four subjects.');
  return form;
}

export function optionOrder(options, seed, questionId) {
  return seededShuffle(options, `${seed}:${questionId}`);
}

export function score(questions, answers) {
  const correct = questions.filter((q) => answers[q.id] === q.correctAnswer).length;
  const answered = questions.filter((q) => answers[q.id] != null && answers[q.id] !== '').length;
  return { correct, incorrect: answered - correct, unanswered: questions.length - answered, score: correct };
}

export function remainingSeconds({ startedAt, durationSeconds, status }, now = Date.now()) {
  return status === 'submitted' ? 0 : Math.max(0, Math.ceil((startedAt + durationSeconds * 1000 - now) / 1000));
}
