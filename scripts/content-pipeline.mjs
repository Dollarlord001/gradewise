import { createHash } from "node:crypto";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { dedupeQuestions } from "../lib/cbt/core.mjs";
import { ALOCQuestionSource, QuestionSourceAdapter, SdashQuestionSource } from "../lib/content-sources.mjs";
export { ALOCQuestionSource, QuestionSourceAdapter, SdashQuestionSource };

const args = Object.fromEntries(process.argv.slice(2).flatMap((part, i, all) => part.startsWith("--") ? [[part.slice(2), all[i + 1]?.startsWith("--") ? "true" : all[i + 1]]] : []));
const command = process.argv[2] && !process.argv[2].startsWith("--") ? process.argv[2] : "validate";
const aliases = new Map([["english", "Use of English"], ["english language", "Use of English"], ["use of english", "Use of English"], ["math", "Mathematics"], ["mathematics", "Mathematics"], ["principle of accounts", "Principle of Accounts"], ["principles of accounts", "Principle of Accounts"], ["accounting", "Principle of Accounts"], ["literature-in-english", "Literature in English"], ["literature in english", "Literature in English"], ["physical and health education", "Physical Health Education"], ["physical health education", "Physical Health Education"]]);
const canonicalSubject = (s) => aliases.get(String(s ?? "").trim().toLowerCase()) ?? String(s ?? "").trim().replace(/\b\w/g, (c) => c.toUpperCase());
const clean = (v) => typeof v === "string" ? v.trim() : v;
const promptKey = (v) => String(v ?? "").normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
function stableUuid(value) { const bytes = createHash("sha256").update(value).digest().subarray(0, 16); bytes[6] = (bytes[6] & 0x0f) | 0x50; bytes[8] = (bytes[8] & 0x3f) | 0x80; const hex = bytes.toString("hex"); return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`; }

function parseCsv(text) {
  const rows = []; let row = [], field = "", quoted = false;
  for (let i = 0; i < text.length; i++) { const c = text[i]; if (quoted && c === '"' && text[i + 1] === '"') { field += '"'; i++; } else if (c === '"') quoted = !quoted; else if (c === "," && !quoted) { row.push(field); field = ""; } else if ((c === "\n" || c === "\r") && !quoted) { if (c === "\r" && text[i + 1] === "\n") i++; row.push(field); if (row.some(Boolean)) rows.push(row); row = []; field = ""; } else field += c; }
  row.push(field); if (row.some(Boolean)) rows.push(row); const [headers, ...data] = rows; return data.map((r) => Object.fromEntries(headers.map((h, i) => [h.trim(), r[i] ?? ""])));
}
async function loadInput(path) {
  const text = await readFile(path, "utf8"); const ext = path.toLowerCase().split(".").pop();
  if (ext === "json") { const parsed = JSON.parse(text); return Array.isArray(parsed) ? parsed : parsed.data ?? parsed.questions ?? [parsed]; }
  if (ext === "jsonl" || ext === "ndjson") return text.split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line));
  if (ext === "csv") return parseCsv(text).map((r) => ({ ...r, options: typeof r.options === "string" ? JSON.parse(r.options) : r.options }));
  throw new Error("Input must be JSON, JSONL, NDJSON or CSV.");
}

if (command === "publish") {
  if (!args.source || !args["source-id"] || !args.exam || !args.subject || !args["reviewer-id"] || !args["rights-status"] || !args["rights-evidence"] || args["answer-verified"] !== "true") throw new Error("Publish requires --source, --source-id, --exam, --subject, --reviewer-id, --answer-verified true, --rights-status and --rights-evidence. --topic-id is optional for subject-only availability.");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL; const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Publishing unavailable: configure the Supabase URL and server-only SUPABASE_SERVICE_ROLE_KEY.");
  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error } = await supabase.rpc("publish_cbt_question", { p_source: args.source.toUpperCase(), p_source_id: args["source-id"], p_exam: args.exam.toUpperCase(), p_subject: canonicalSubject(args.subject), p_reviewer: args["reviewer-id"], p_rights_status: args["rights-status"], p_rights_evidence: args["rights-evidence"], p_topic_id: args["topic-id"] ?? null });
  if (error) throw new Error(`Publish failed: ${error.message}`);
  console.log("Published one reviewed question. The JAMB content version was incremented so devices refresh their cached question content silently."); process.exit(0);
}

function normalize(raw) {
  const source = String(raw.source ?? args.provider ?? "FILE").toUpperCase(); const sourceName = raw.sourceName ?? (source === "SDASH" ? "SdashAPI" : source === "ALOC" ? "ALOC" : "Local source");
  const sourceId = String(raw.sourceId ?? raw.source_id ?? raw.id ?? "").trim(); const prompt = String(raw.prompt ?? raw.text ?? raw.question ?? "").trim();
  let options = raw.options ?? raw.option; if (typeof options === "string") { try { options = JSON.parse(options); } catch { options = null; } }
  if (Array.isArray(options)) options = Object.fromEntries(options.map((o, index) => [String.fromCharCode(97 + index), typeof o === "string" ? o : o.text]));
  if (options && typeof options === "object") options = Object.fromEntries(Object.entries(options).map(([key, value]) => [key.toLowerCase(), value]));
  const answer = String(raw.correctAnswer ?? raw.correct_answer ?? raw.answer ?? "").trim().toLowerCase();
  const yearValue = raw.year ?? raw.examYear ?? raw.examyear ?? args.year; const year = yearValue == null || yearValue === "" ? null : Number(yearValue);
  const questionNumberValue = raw.questionNumber ?? raw.question_number; const questionNumber = questionNumberValue == null || questionNumberValue === "" ? null : Number(questionNumberValue);
  const sourceMetadata = raw.sourceMetadata ?? raw.source_metadata ?? {};
  const sourceAnswerExists = Boolean(sourceMetadata?.originalFields?.answer ?? sourceMetadata?.answer);
  const verificationStatus = raw.verificationStatus ?? (args["source-answer-verified"] === "true" && sourceAnswerExists ? "verified" : "pending");
  const rightsStatus = String(raw.rightsStatus ?? args["rights-status"] ?? "unknown");
  const rightsEvidence = clean(raw.rightsEvidence ?? args["rights-evidence"]) || null;
  return { id: stableUuid(`${source}:${sourceId}`), source, sourceName, sourceId, sourceUrl: clean(raw.sourceUrl ?? raw.source_url) ?? null, exam: String(raw.exam ?? args.exam ?? "JAMB").toUpperCase(), year, subject: canonicalSubject(raw.subject ?? args.subject), paper: raw.paper ?? null, questionNumber, prompt, options: options && typeof options === "object" ? options : {}, correctAnswer: answer, explanation: clean(raw.explanation ?? raw.solution) || null, questionType: raw.questionType ?? "multiple_choice", topic: clean(raw.topic) || null, subtopic: clean(raw.subtopic) || null, syllabusObjective: clean(raw.syllabusObjective) || null, difficulty: Number(raw.difficulty) || null, images: raw.images ?? (raw.image ? [raw.image] : []), passage: raw.passage ?? null, sourceMetadata, verificationStatus, verificationEvidence: verificationStatus === "verified" ? "Source answer key retained and checked for a matching option by the import validator; semantic correctness was not independently re-reviewed." : null, rightsStatus, rightsEvidence, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
}
function validate(rows) {
  const rejected = [], duplicates = [], accepted = [], ids = new Map(), prompts = new Map();
  for (const [i, q] of rows.entries()) {
    const issues = []; if (!q.prompt) issues.push("missing prompt"); const opts = Object.entries(q.options); if (opts.length < 2 || opts.some(([, text]) => !String(text).trim())) issues.push("missing/invalid options"); if (!q.correctAnswer || !Object.hasOwn(q.options, q.correctAnswer)) issues.push("answer does not match an option"); if (!q.subject) issues.push("missing subject"); if (!q.exam) issues.push("missing exam"); if (q.year != null && (!Number.isInteger(q.year) || q.year < 1900 || q.year > new Date().getFullYear() + 1)) issues.push("invalid year"); if (!q.sourceId) issues.push("missing stable source ID"); if (q.questionNumber != null && (!Number.isInteger(q.questionNumber) || q.questionNumber < 1 || q.questionNumber > 32767)) issues.push("invalid question number");
    const key = `${q.source}:${q.sourceId}`; const normalized = promptKey(q.prompt);
    if (issues.length) { rejected.push({ ...q, importRow: i + 1, issues }); continue; }
    const duplicateOf = ids.get(key) ?? prompts.get(`${q.exam}|${q.subject}|${q.year}|${normalized}`);
    if (duplicateOf) { duplicates.push({ ...q, importRow: i + 1, duplicateOf, duplicateReason: ids.has(key) ? "duplicate provider ID" : "exact duplicate prompt" }); continue; }
    if (normalized) { const words = new Set(normalized.split(" ").filter((word) => word.length > 2)); let nearDuplicateOf = null; for (let j = 0; j < accepted.length && !nearDuplicateOf; j++) { const previous = accepted[j]; if (q.exam !== previous.exam || q.subject !== previous.subject || q.year !== previous.year) continue; const other = new Set(promptKey(previous.prompt).split(" ").filter((word) => word.length > 2)); const overlap = [...words].filter((word) => other.has(word)).length; if (words.size > 5 && overlap / Math.max(1, new Set([...words, ...other]).size) >= 0.92) nearDuplicateOf = previous.sourceId; } if (nearDuplicateOf) { duplicates.push({ ...q, importRow: i + 1, duplicateOf: nearDuplicateOf, duplicateReason: "near-duplicate prompt" }); continue; } }
    ids.set(key, q.sourceId); prompts.set(`${q.exam}|${q.subject}|${q.year}|${normalized}`, q.sourceId); accepted.push(q);
  }
  return { accepted, rejected, duplicates };
}
const staging = resolve(args.output ?? "content/staging/normalized.jsonl");
let rows;
if (args.file) rows = await loadInput(resolve(args.file));
else if (["import", "build"].includes(command)) {
  if (!args.provider) throw new Error("Choose --provider aloc or sdash, or supply --file.");
  const adapter = args.provider.toLowerCase() === "aloc" ? new ALOCQuestionSource() : args.provider.toLowerCase() === "sdash" ? new SdashQuestionSource() : null;
  if (!adapter) throw new Error("Supported providers: aloc, sdash.");
  rows = await adapter.fetchQuestions({ subject: args.subject, exam: args.exam, year: args.year, limit: args.limit });
} else throw new Error("Supply --file or use import/build with a provider and filters.");

const canonical = rows.map(normalize); const { accepted, rejected, duplicates } = validate(canonical);
const deduped = dedupeQuestions(accepted); const acceptedById = new Map(accepted.map((q) => [q.id, q]));
const dedupeDuplicates = deduped.duplicates.map((item) => ({ ...(acceptedById.get(item.duplicateId) ?? {}), sourceId: item.sourceId, duplicateOf: item.canonicalId, duplicateReason: item.duplicateReason }));
const duplicateRows = [...duplicates, ...dedupeDuplicates];
console.log(JSON.stringify({ fetched: canonical.length, validated: accepted.length, accepted: deduped.canonical.length, duplicates: duplicateRows.length, rejected: rejected.length, duplicateDetails: duplicateRows.slice(0, 12).map(({ sourceId, duplicateOf, duplicateReason }) => ({ sourceId, duplicateOf, duplicateReason })), rejectionDetails: rejected.slice(0, 30).map(({ sourceId, issues }) => ({ sourceId, issues })) }, null, 2));
if (command === "validate") process.exit(rejected.length ? 1 : 0);
await mkdir(dirname(staging), { recursive: true }); await writeFile(staging, deduped.canonical.map((q) => JSON.stringify(q)).join("\n") + (deduped.canonical.length ? "\n" : ""));
await writeFile(staging.replace(/\.(jsonl|ndjson|json)$/i, ".rejected.jsonl"), rejected.map((q) => JSON.stringify(q)).join("\n") + (rejected.length ? "\n" : ""));
await writeFile(staging.replace(/\.(jsonl|ndjson|json)$/i, ".duplicates.jsonl"), duplicateRows.map((q) => JSON.stringify(q)).join("\n") + (duplicateRows.length ? "\n" : ""));
console.log(`Canonical staging written to ${staging}; ${duplicateRows.length} duplicate rows and ${rejected.length} invalid rows were written to review sidecars.`);
if (command === "build") process.exit(0);

const url = process.env.NEXT_PUBLIC_SUPABASE_URL; const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("Supabase storage unavailable: set NEXT_PUBLIC_SUPABASE_URL and server-only SUPABASE_SERVICE_ROLE_KEY. Provider records were staged but not imported.");
const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const databaseAccepted = []; const crossProviderDuplicates = [];
const contentGroups = new Map();
for (const q of deduped.canonical) { const key = `${q.exam}|${q.year}|${q.subject}`; const group = contentGroups.get(key) ?? []; group.push(q); contentGroups.set(key, group); }
for (const group of contentGroups.values()) {
  const first = group[0]; const candidates = [];
  for (let offset = 0; offset < 10000; offset += 1000) { const { data, error } = await supabase.from("questions").select("source,source_id,prompt").eq("exam", first.exam).eq("year", first.year).eq("subject", first.subject).range(offset, offset + 999); if (error) throw new Error(`Duplicate lookup failed: ${error.message}`); candidates.push(...(data ?? [])); if ((data ?? []).length < 1000) break; }
  for (const q of group) {
    const incoming = promptKey(q.prompt); const words = new Set(incoming.split(" ").filter((word) => word.length > 2));
    const duplicate = candidates.find((row) => !(row.source === q.source && row.source_id === q.sourceId) && (promptKey(row.prompt) === incoming || (() => { const other = new Set(promptKey(row.prompt).split(" ").filter((word) => word.length > 2)); const overlap = [...words].filter((word) => other.has(word)).length; return words.size > 5 && overlap / Math.max(1, new Set([...words, ...other]).size) >= 0.92; })()));
    if (duplicate) crossProviderDuplicates.push({ sourceId: q.sourceId, duplicateSource: duplicate.source }); else databaseAccepted.push(q);
  }
}
console.log(`Database duplicate check: ${crossProviderDuplicates.length} records matched existing prompts and were rejected.`);
const dbRows = databaseAccepted.map((q) => ({ id: q.id, exam: q.exam, year: q.year, subject: q.subject, paper: q.paper, question_number: q.questionNumber, prompt: q.prompt, question_type: q.questionType, difficulty: q.difficulty, options: q.options, correct_answer: q.correctAnswer, explanation: q.explanation, source_name: q.sourceName, source_url: q.sourceUrl, source: q.source, source_id: q.sourceId, provenance: { source: q.source, sourceId: q.sourceId, questionNumber: q.questionNumber, rightsStatus: q.rightsStatus, rightsEvidence: q.rightsEvidence, sourceMetadata: q.sourceMetadata, verificationEvidence: q.verificationEvidence }, rights_status: q.rightsStatus === "USER_PROVIDED_AUTHORIZED" ? "permission_granted" : q.rightsStatus.toLowerCase(), verification_status: q.verificationStatus, subtopic: q.subtopic, syllabus_objective: q.syllabusObjective, images: q.images, passage: q.passage, rights_evidence: q.rightsEvidence }));
for (let i = 0; i < dbRows.length; i += 500) { const { error } = await supabase.from("questions").upsert(dbRows.slice(i, i + 500), { onConflict: "source,source_id" }); if (error) throw new Error(`Database import failed: ${error.message}`); }
console.log(`Stored ${dbRows.length} canonical records. Rights status is ${[...new Set(databaseAccepted.map((q) => q.rightsStatus))].join(', ') || 'not set'}; verification statuses: ${JSON.stringify(Object.fromEntries([...new Set(databaseAccepted.map((q) => q.verificationStatus))].map((status) => [status, databaseAccepted.filter((q) => q.verificationStatus === status).length])))}.`);
