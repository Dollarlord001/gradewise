import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const [inputArg, outputArg = 'content/acquired/aloc-2020-08-20.jsonl'] = process.argv.slice(2);
if (!inputArg) throw new Error('Usage: node scripts/aloc-dump-extract.mjs <mysql-dump.sql> [output.jsonl]');
const input = resolve(inputArg); const output = resolve(outputArg); const sql = await readFile(input, 'utf8');
const subjectNames = {
  english: 'Use of English', mathematics: 'Mathematics', biology: 'Biology', chemistry: 'Chemistry', physics: 'Physics',
  economics: 'Economics', government: 'Government', geography: 'Geography', commerce: 'Commerce', accounting: 'Accounting',
  englishlit: 'Literature in English', crk: 'CRK', irk: 'IRK', civiledu: 'Civic Education', history: 'History',
  insurance: 'Insurance', socialstudies: 'Social Studies', health: 'Health Education', computerstudies: 'Computer Studies',
  agric: 'Agricultural Science', agriculture: 'Agricultural Science', animalhusbandry: 'Animal Husbandry',
  fisheries: 'Fisheries', foodnutrition: 'Food and Nutrition', homeeconomics: 'Home Economics', fineart: 'Fine Arts',
};
const examNames = new Map([['utme', 'JAMB'], ['jamb', 'JAMB'], ['waec', 'WAEC'], ['wassce', 'WAEC'], ['neco', 'NECO']]);
function decodeSqlString(value) {
  return value.replace(/\\([\\'"nrt0Z])/g, (_, char) => ({ '\\': '\\', "'": "'", '"': '"', n: '\n', r: '\r', t: '\t', 0: '\0', Z: '\x1a' })[char]);
}
function parseValues(text, start) {
  const rows = []; let i = start;
  while (i < text.length) {
    while (/\s/.test(text[i] ?? '')) i++;
    if (text[i] !== '(') break;
    i++; const row = []; let done = false;
    while (i < text.length && !done) {
      while (/\s/.test(text[i] ?? '')) i++;
      if (text[i] === "'") {
        i++; let value = '';
        while (i < text.length) {
          const char = text[i++];
          if (char === '\\' && i < text.length) { value += `\\${text[i++]}`; continue; }
          if (char === "'") { if (text[i] === "'") { value += "'"; i++; continue; } break; }
          value += char;
        }
        row.push(decodeSqlString(value));
      } else {
        const begin = i; while (i < text.length && text[i] !== ',' && text[i] !== ')') i++;
        const value = text.slice(begin, i).trim(); row.push(value === 'NULL' ? null : value === '1' ? 1 : value === '0' ? 0 : /^-?\d+$/.test(value) ? Number(value) : value);
      }
      while (/\s/.test(text[i] ?? '')) i++;
      if (text[i] === ',') { i++; continue; }
      if (text[i] === ')') { i++; done = true; }
      else throw new Error(`Malformed SQL row near byte ${i} in ${input}`);
    }
    rows.push(row);
    while (/\s/.test(text[i] ?? '')) i++;
    if (text[i] === ',') { i++; continue; }
    break;
  }
  return { rows, end: i };
}
function schemaFor(table, beforeOffset) {
  const start = sql.lastIndexOf(`CREATE TABLE \`${table}\``, beforeOffset);
  if (start < 0) return [];
  const end = sql.indexOf(') ENGINE=', start); if (end < 0) return [];
  return [...sql.slice(start, end).matchAll(/^\s+`([^`]+)`\s+/gm)].map((match) => match[1]);
}
const sourceRows = [];
const insertPattern = /INSERT INTO `([^`]+)` VALUES\s+/g;
let match;
while ((match = insertPattern.exec(sql))) {
  const table = match[1]; const columns = schemaFor(table, match.index);
  if (!columns.includes('question') || !columns.includes('optionA') || !columns.includes('optionB') || !columns.includes('optionC') || !columns.includes('optionD') || !columns.includes('examtype')) continue;
  const subject = subjectNames[table]; if (!subject) continue;
  const parsed = parseValues(sql, insertPattern.lastIndex);
  const rows = parsed.rows;
  for (const values of rows) {
    const original = Object.fromEntries(columns.map((column, index) => [column, values[index] ?? null]));
    const exam = examNames.get(String(original.examtype ?? '').trim().toLowerCase());
    if (!exam || typeof original.question !== 'string' || !original.question.trim()) continue;
    const options = Object.fromEntries(['A', 'B', 'C', 'D', 'E'].filter((letter) => original[`option${letter}`] != null && String(original[`option${letter}`]).trim()).map((letter) => [letter.toLowerCase(), original[`option${letter}`]]));
    const originalId = String(original.id ?? '');
    sourceRows.push({
      source: 'ALOC', sourceName: 'ALOC question database', sourceId: `${table}:${originalId}`, sourceUrl: `https://github.com/Seunope/aloc-endpoints/blob/master/storage/backups/${input.split('/').at(-1)}`,
      exam, year: original.examyear, subject, questionNumber: original.questionNub == null || original.questionNub === '' ? null : Number(original.questionNub),
      prompt: original.question, options, correctAnswer: String(original.answer ?? ''), explanation: original.solution || null,
      images: original.image ? [original.image] : [], passage: original.section || null,
      sourceMetadata: { originalTable: table, originalId: original.id, originalExamType: original.examtype, originalExamYear: original.examyear, originalFields: original },
    });
  }
  insertPattern.lastIndex = sql[parsed.end] === ';' ? parsed.end + 1 : parsed.end;
}
await mkdir(dirname(output), { recursive: true });
await writeFile(output, sourceRows.map((row) => JSON.stringify(row)).join('\n') + (sourceRows.length ? '\n' : ''));
const byExam = {}; const bySubject = {}; const byYear = {};
for (const row of sourceRows) { byExam[row.exam] = (byExam[row.exam] ?? 0) + 1; bySubject[row.subject] = (bySubject[row.subject] ?? 0) + 1; const key = String(row.year ?? 'UNKNOWN'); byYear[key] = (byYear[key] ?? 0) + 1; }
console.log(JSON.stringify({ input, output, extracted: sourceRows.length, byExam, bySubject, byYear }, null, 2));
