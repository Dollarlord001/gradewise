import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { buildFullForm, contentHash, dedupeQuestions, isRightsEligible, optionOrder, remainingSeconds, score, seededShuffle } from '../../lib/cbt/core.mjs';

const q = (id, subject = 'Biology', extra = {}) => ({ id, exam: 'JAMB', examYear: 2024, subject, prompt: `Question ${id}: choose the correct biological process`, options: { a: 'One', b: 'Two', c: 'Three', d: 'Four' }, correctAnswer: 'b', verificationStatus: 'verified', rightsStatus: 'AUTHORIZED', source: 'OWNED', sourceId: id, ...extra });

test('exact hash and normalized question plus options identify duplicates while preserving provenance', () => {
  const first = q('a'); const second = { ...q('b'), prompt: ' QUESTION a: choose the correct biological process! ' };
  assert.equal(contentHash(first), contentHash(second));
  const { canonical, duplicates } = dedupeQuestions([first, second]);
  assert.equal(canonical.length, 1); assert.equal(duplicates.length, 1); assert.equal(duplicates[0].canonicalId, 'a'); assert.equal(canonical[0].provenanceRecords.length, 2);
});

test('near duplicates are consolidated by normalized prompt similarity', () => {
  const first = q('a', 'Biology', { prompt: 'Explain how the transport system carries useful substances around an organism' });
  const second = q('b', 'Biology', { prompt: 'Explain how a transport system carries useful substances around the organism' });
  assert.equal(dedupeQuestions([first, second]).canonical.length, 1);
});

test('rights filtering requires both verified status and allowed rights', () => {
  assert.equal(isRightsEligible(q('ok')), true);
  assert.equal(isRightsEligible(q('unknown', 'Biology', { rightsStatus: 'UNKNOWN' })), false);
  assert.equal(isRightsEligible(q('pending', 'Biology', { verificationStatus: 'pending' })), false);
});

test('seeded shuffle and option order are deterministic and seed-sensitive', () => {
  assert.deepEqual(seededShuffle([1, 2, 3, 4, 5], 'seed-a'), seededShuffle([1, 2, 3, 4, 5], 'seed-a'));
  assert.notDeepEqual(seededShuffle([1, 2, 3, 4, 5], 'seed-a'), seededShuffle([1, 2, 3, 4, 5], 'seed-b'));
  assert.deepEqual(optionOrder(['a', 'b', 'c', 'd'], 'same', 'q1'), optionOrder(['a', 'b', 'c', 'd'], 'same', 'q1'));
});

test('full JAMB form selects exact 60+40+40+40 unique eligible IDs', () => {
  const subjects = ['Use of English', 'Biology', 'Chemistry', 'Physics'];
  const pools = Object.fromEntries(subjects.map((subject) => [subject, Array.from({ length: 65 }, (_, i) => q(`${subject}-${i}`, subject))]));
  pools.Physics[0].rightsStatus = 'UNKNOWN';
  const form = buildFullForm(pools, subjects, 'fixed-seed');
  assert.equal(form.length, 180); assert.equal(new Set(form.map((item) => item.id)).size, 180);
  for (const [subject, count] of [['Use of English', 60], ['Biology', 40], ['Chemistry', 40], ['Physics', 40]]) assert.equal(form.filter((item) => item.subject === subject).length, count);
});

test('full form rejects insufficient pools and cross-subject duplicate IDs', () => {
  const subjects = ['Use of English', 'Biology', 'Chemistry', 'Physics'];
  const pools = Object.fromEntries(subjects.map((subject) => [subject, Array.from({ length: subject === 'Use of English' ? 60 : 40 }, (_, i) => q(`${subject}-${i}`, subject))]));
  pools.Biology.pop(); assert.throws(() => buildFullForm(pools, subjects, 'seed'), /insufficient/);
  pools.Biology.push(q('Physics-0', 'Biology')); assert.throws(() => buildFullForm(pools, subjects, 'seed'), /unique/);
});

test('timer uses fixed timestamps, expires at zero and submitted attempts stay closed', () => {
  const attempt = { startedAt: 1_000, durationSeconds: 60, status: 'active' };
  assert.equal(remainingSeconds(attempt, 1_000), 60);
  assert.equal(remainingSeconds(attempt, 61_000), 0);
  assert.equal(remainingSeconds({ ...attempt, status: 'submitted' }, 1_500), 0);
});

test('scoring computes correct, incorrect and unanswered without inventing answers', () => {
  const result = score([q('a'), q('b')], { a: 'b', b: 'a' });
  assert.deepEqual(result, { correct: 1, incorrect: 1, unanswered: 0, score: 1 });
  assert.deepEqual(score([q('a')], {}), { correct: 0, incorrect: 0, unanswered: 1, score: 0 });
});

test('acquired ALOC bank creates a deterministic 180-question JAMB form from real staged rows', async () => {
  const text = await readFile('content/staging/aloc-normalized.jsonl', 'utf8');
  const bank = text.trim().split(/\r?\n/).map((line) => JSON.parse(line));
  const subjects = ['Use of English', 'Biology', 'Chemistry', 'CRK'];
  const pools = Object.fromEntries(subjects.map((subject) => [subject, bank.filter((row) => row.exam === 'JAMB' && row.subject === subject)]));
  const first = buildFullForm(pools, subjects, 'aloc-bank-regression-seed');
  const second = buildFullForm(pools, subjects, 'aloc-bank-regression-seed');
  assert.equal(first.length, 180);
  assert.deepEqual(first.map((row) => row.id), second.map((row) => row.id));
  assert.equal(new Set(first.map((row) => row.id)).size, 180);
  assert.deepEqual(subjects.map((subject) => first.filter((row) => row.subject === subject).length), [60, 40, 40, 40]);
  assert.ok(first.every((row) => row.rightsStatus === 'USER_PROVIDED_AUTHORIZED' && row.verificationStatus === 'verified'));
  assert.ok(first.every((row) => row.sourceMetadata.originalId != null && row.sourceId === `${row.sourceMetadata.originalTable}:${row.sourceMetadata.originalId}`));
  assert.ok(first.some((row) => row.questionNumber === null), 'absent source question numbers remain absent');
});
