import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { dirname, extname, resolve, basename } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { dedupeQuestions, isRightsEligible } from '../lib/cbt/core.mjs';

const args = process.argv.slice(3);
const flags = Object.fromEntries(args.flatMap((item, i) => item.startsWith('--') ? [[item.slice(2), args[i + 1]?.startsWith('--') ? true : args[i + 1]]] : []));
const cmd = process.argv[2] ?? 'report';
const manifestPath = resolve('content/source-inventory.json');
function parseCsv(text) { const rows = []; let row = []; let value = ''; let quoted = false; for (let i = 0; i < text.length; i++) { const c = text[i]; if (quoted && c === '"' && text[i + 1] === '"') { value += '"'; i++; } else if (c === '"') quoted = !quoted; else if (c === ',' && !quoted) { row.push(value); value = ''; } else if ((c === '\n' || c === '\r') && !quoted) { if (c === '\r' && text[i + 1] === '\n') i++; row.push(value); if (row.some(Boolean)) rows.push(row); row = []; value = ''; } else value += c; } row.push(value); if (row.some(Boolean)) rows.push(row); const [headers = [], ...body] = rows; return body.map((items) => Object.fromEntries(headers.map((header, i) => [header.trim(), items[i] ?? '']))); }
const readRows = async (file) => { const text = await readFile(file, 'utf8'); const ext = extname(file).toLowerCase(); if (ext === '.json') { const data = JSON.parse(text); return Array.isArray(data) ? data : data.questions ?? data.data ?? [data]; } if (['.jsonl', '.ndjson'].includes(ext)) return text.split(/\r?\n/).filter(Boolean).map(JSON.parse); if (ext === '.csv') return parseCsv(text).map((row) => ({ ...row, options: typeof row.options === 'string' ? JSON.parse(row.options) : row.options })); throw new Error(`Unsupported input ${ext}; expected JSON, JSONL, NDJSON or CSV.`); };
const files = async (directory) => (await readdir(directory, { withFileTypes: true }).catch(() => [])).flatMap((entry) => entry.isDirectory() ? [] : [resolve(directory, entry.name)]);

if (cmd === 'discover') {
  const inventory = JSON.parse(await readFile(manifestPath, 'utf8'));
  console.log(JSON.stringify({ checkedAt: inventory.checkedAt, discoveredSources: inventory.sources.length, sources: inventory.sources.map(({ sourceName, url, examTypes, rightsStatus, ingestionStatus }) => ({ sourceName, url, examTypes, rightsStatus, ingestionStatus })) }, null, 2));
} else if (cmd === 'download') {
  const url = String(flags.url ?? '');
  const inventory = JSON.parse(await readFile(manifestPath, 'utf8'));
  const entry = inventory.sources.find((source) => source.url === url);
  if (!entry) throw new Error('URL must exist in the internal source inventory.');
  if (!['AUTHORIZED', 'OPEN_LICENSE', 'TUTOR_ME_OWNED', 'USER_PROVIDED_AUTHORIZED'].includes(entry.rightsStatus) || !entry.permissionEvidence) throw new Error(`Download blocked: ${entry.sourceName} has no documented acquisition permission.`);
  const response = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(20000), headers: { 'User-Agent': 'TUTOR-ME content acquisition (+rights-reviewed)' } });
  if (!response.ok) throw new Error(`Download failed with HTTP ${response.status}.`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length > 20_000_000) throw new Error('Download exceeds the 20 MB content acquisition limit.');
  const path = resolve('content/acquired', `${createHash('sha256').update(url).digest('hex').slice(0,16)}${extname(new URL(url).pathname) || '.html'}`);
  await mkdir(dirname(path), { recursive: true }); await writeFile(path, bytes, { flag: 'wx' }).catch(async (error) => { if (error.code !== 'EEXIST') throw error; });
  console.log(JSON.stringify({ sourceName: entry.sourceName, path, bytes: bytes.length }, null, 2));
} else if (cmd === 'extract') {
  const input = resolve(String(flags.file ?? ''));
  const ext = extname(input).toLowerCase(); let rows;
  if (['.json', '.jsonl', '.ndjson', '.csv'].includes(ext)) rows = await readRows(input);
  else if (ext === '.html' || ext === '.htm') {
    const html = await readFile(input, 'utf8');
    const encoded = [...html.matchAll(/data-question\s*=\s*(["'])(.*?)\1/gs)].map((match) => match[2].replaceAll('&quot;', '"').replaceAll('&amp;', '&').replaceAll('&#39;', "'").replaceAll('&lt;', '<').replaceAll('&gt;', '>'));
    const scripts = [...html.matchAll(/<script[^>]*type=["']application\/json["'][^>]*>([\s\S]*?)<\/script>/gi)].map((match) => match[1]);
    rows = encoded.map(JSON.parse); for (const block of scripts) { const parsed = JSON.parse(block); rows.push(...(Array.isArray(parsed) ? parsed : parsed.questions ?? parsed.data ?? [])); }
  } else if (ext === '.pdf') {
    const result = spawnSync('pdftotext', ['-layout', input, '-'], { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 });
    if (result.error || result.status !== 0) throw new Error('PDF text extraction requires pdftotext. Layout text is preserved; question segmentation and answer verification remain reviewer tasks.');
    const path = resolve('content/extracted', `${basename(input)}.txt`); await mkdir(dirname(path), { recursive: true }); await writeFile(path, result.stdout); console.log(JSON.stringify({ extractedText: path, bytes: Buffer.byteLength(result.stdout), records: 0 })); process.exit(0);
  } else throw new Error('Supported extraction formats: HTML, PDF, JSON, CSV, JSONL.');
  console.log(JSON.stringify({ records: rows.length, recordsWithPrompt: rows.filter((row) => row.prompt || row.question || row.text).length }, null, 2));
} else if (cmd === 'normalize' || cmd === 'dedupe' || cmd === 'validate') {
  const input = resolve(String(flags.file ?? ''));
  const rows = await readRows(input);
  const normalized = rows.map((raw, index) => {
    const optionsRaw = raw.options ?? raw.option ?? {};
    const options = Array.isArray(optionsRaw) ? Object.fromEntries(optionsRaw.map((value, i) => [String.fromCharCode(97 + i), typeof value === 'string' ? value : value.text])) : typeof optionsRaw === 'string' ? JSON.parse(optionsRaw) : optionsRaw;
    return { ...raw, id: raw.id ?? createHash('sha256').update(`${raw.source ?? 'FILE'}:${raw.sourceId ?? raw.source_id ?? index}`).digest('hex').slice(0, 32), exam: String(raw.exam ?? '').toUpperCase(), examYear: Number(raw.examYear ?? raw.year), subject: String(raw.subject ?? '').trim(), questionNumber: Number(raw.questionNumber ?? raw.question_number ?? index + 1), prompt: String(raw.prompt ?? raw.question ?? raw.text ?? '').trim(), options, correctAnswer: String(raw.correctAnswer ?? raw.correct_answer ?? raw.answer ?? '').trim().toLowerCase(), topic: raw.topic ?? null, subtopic: raw.subtopic ?? null, provenance: raw.provenance ?? [], rightsStatus: raw.rightsStatus ?? 'UNKNOWN', verificationStatus: raw.verificationStatus ?? 'pending' };
  });
  const valid = []; const rejected = [];
  for (const [index, q] of normalized.entries()) {
    const problems = [];
    if (!q.prompt) problems.push('missing prompt');
    if (!['JAMB', 'WAEC', 'NECO', 'BECE', 'NCEE'].includes(q.exam)) problems.push('unsupported exam');
    if (!Number.isInteger(q.examYear) || q.examYear < 1900 || q.examYear > new Date().getFullYear() + 1) problems.push('invalid year');
    if (Object.keys(q.options ?? {}).length < 2 || Object.values(q.options ?? {}).some((value) => !String(value).trim())) problems.push('invalid options');
    if (!q.correctAnswer || !Object.hasOwn(q.options ?? {}, q.correctAnswer)) problems.push('answer does not match an option');
    if (!q.subject) problems.push('missing subject');
    if (problems.length) rejected.push({ row: index + 1, id: q.id, problems }); else valid.push(q);
  }
  const { canonical, duplicates } = dedupeQuestions(valid);
  const output = resolve(flags.output ?? `content/staging/${cmd}.jsonl`); await mkdir(dirname(output), { recursive: true });
  const result = cmd === 'validate' ? valid : cmd === 'dedupe' ? canonical : normalized;
  await writeFile(output, result.map((row) => JSON.stringify(row)).join('\n') + (result.length ? '\n' : ''));
  console.log(JSON.stringify({ input: rows.length, normalized: normalized.length, valid: valid.length, rejected: rejected.length, deduplicated: duplicates.length, output, rejectedRows: rejected.slice(0, 100), duplicateRows: duplicates.slice(0, 100) }, null, 2));
  if (cmd === 'validate' && rejected.length) process.exitCode = 1;
} else if (cmd === 'report') {
  const directory = resolve(flags.directory ?? 'content/staging'); const names = await files(directory); const all = [];
  for (const file of names.filter((name) => ['.jsonl','.ndjson','.json'].includes(extname(name)))) all.push(...await readRows(file));
  const issuesFor = (q) => {
    const issues = [];
    if (!String(q.prompt ?? '').trim()) issues.push('missing prompt');
    if (!['JAMB', 'WAEC', 'NECO', 'BECE', 'NCEE'].includes(String(q.exam ?? '').toUpperCase())) issues.push('unsupported exam');
    const year = Number(q.examYear ?? q.year);
    if (!Number.isInteger(year) || year < 1900 || year > new Date().getFullYear() + 1) issues.push('invalid year');
    if (!String(q.subject ?? '').trim()) issues.push('missing subject');
    const options = q.options && typeof q.options === 'object' ? q.options : {};
    if (Object.keys(options).length < 2 || Object.values(options).some((value) => !String(value ?? '').trim())) issues.push('invalid options');
    const answer = String(q.correctAnswer ?? q.correct_answer ?? '').trim().toLowerCase();
    if (!answer || !Object.hasOwn(options, answer)) issues.push('answer does not match an option');
    return issues;
  };
  const rejectedRows = all.map((q, index) => ({ q, index, issues: issuesFor(q) })).filter(({ issues }) => issues.length);
  const validRows = all.filter((q) => issuesFor(q).length === 0);
  const { canonical, duplicates } = dedupeQuestions(validRows);
  const countBy = (rows, field) => Object.fromEntries([...new Set(rows.map((q) => q[field] ?? 'Unmapped'))].sort().map((key) => [key, rows.filter((q) => (q[field] ?? 'Unmapped') === key).length]));
  const byExamSubjectYear = {};
  for (const q of canonical) {
    const exam = String(q.exam ?? 'Unmapped').toUpperCase(); const subject = String(q.subject ?? 'Unmapped'); const year = String(q.examYear ?? q.year ?? 'Unmapped');
    byExamSubjectYear[exam] ??= {}; byExamSubjectYear[exam][subject] ??= {}; byExamSubjectYear[exam][subject][year] = (byExamSubjectYear[exam][subject][year] ?? 0) + 1;
  }
  const byTopic = countBy(canonical, 'topic');
  const mapped = canonical.filter((q) => Boolean(String(q.topic ?? '').trim())).length;
  const byYear = Object.fromEntries([...new Set(canonical.map((q) => String(q.examYear ?? q.year ?? 'Unmapped')))].sort().map((year) => [year, canonical.filter((q) => String(q.examYear ?? q.year ?? 'Unmapped') === year).length]));
  const report = { totalQuestions: all.length, canonicalQuestions: canonical.length, byExam: countBy(canonical, 'exam'), bySubject: countBy(canonical, 'subject'), byYear, byExamSubjectYear, byTopic, topicMapped: mapped, topicUnmapped: canonical.length - mapped, mapping: { mapped, unmapped: canonical.length - mapped }, duplicatesRemoved: duplicates.length, rejected: rejectedRows.length, rejectedRows: rejectedRows.map(({ q, index, issues }) => ({ row: index + 1, id: q.id ?? q.sourceId ?? null, issues })).slice(0, 100), quarantinedRightsReview: canonical.filter((q) => !isRightsEligible(q)).length, usableQuestions: canonical.filter(isRightsEligible).length, usableFullJambPools: {}, usablePracticePools: {}, note: 'Counts are based only on supplied staging files; source inventory entries are not imports.' };
  for (const exam of ['JAMB','WAEC','NECO']) for (const subject of [...new Set(canonical.filter((q) => q.exam === exam).map((q) => q.subject))]) { const n = canonical.filter((q) => isRightsEligible(q) && q.exam === exam && q.subject === subject).length; report.usablePracticePools[`${exam}:${subject}`] = n; if (exam === 'JAMB') report.usableFullJambPools[subject] = { required: subject === 'Use of English' ? 60 : 40, available: n, sufficient: n >= (subject === 'Use of English' ? 60 : 40) }; }
  const out = resolve(flags.output ?? 'content/reports/question-bank-report.json'); await mkdir(dirname(out), { recursive: true }); await writeFile(out, `${JSON.stringify(report, null, 2)}\n`); console.log(JSON.stringify(report, null, 2));
} else throw new Error('Commands: discover, download, extract, normalize, dedupe, validate, report. Publishing stays in content-pipeline.mjs.');
