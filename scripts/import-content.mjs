import { createReadStream } from 'node:fs';
import { readdir } from 'node:fs/promises';
import { createInterface } from 'node:readline';
import { createHash } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error('Content import requires NEXT_PUBLIC_SUPABASE_URL and server-only SUPABASE_SERVICE_ROLE_KEY.');
const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const batchSize = Math.min(500, Math.max(25, Number(process.env.CONTENT_IMPORT_BATCH_SIZE) || 250));
const stableUuid = (s) => { const b = createHash('sha256').update(s).digest().subarray(0,16); b[6]=(b[6]&15)|80; b[8]=(b[8]&63)|128; const h=b.toString('hex'); return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`; };
const fingerprint = (q) => createHash('sha256').update(`${String(q.question).normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim()}|${Object.values(q.options??{}).map(v=>String(v).normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim()).sort().join('|')}`).digest('hex');
const importId = stableUuid('tutorme-content-questions-v1');
const { error: batchError } = await supabase.from('content_import_batches').upsert({ id: importId, content_kind:'questions', source_manifest:'output/questions/*.jsonl', status:'in_progress', updated_at:new Date().toISOString() });
if (batchError) throw new Error(`Import ledger unavailable (apply 202610040001 migration first): ${batchError.message}`);
let imported=0, seen=0, failed=0, offset=0;
const files=(await readdir('output/questions')).filter(f=>f.endsWith('.jsonl')).sort();
for (const file of files) {
  const pending=[];
  const reader=createInterface({input:createReadStream(`output/questions/${file}`,{encoding:'utf8'}),crlfDelay:Infinity});
  for await (const line of reader) {
    if (!line.trim()) continue; seen++;
    let q; try { q=JSON.parse(line); } catch { failed++; continue; }
    pending.push(q);
    if (pending.length>=batchSize) { const result=await importBatch(pending); imported+=result; offset+=pending.length; pending.length=0; await saveProgress(); }
  }
  if(pending.length){const result=await importBatch(pending);imported+=result;offset+=pending.length;await saveProgress();}
}
await supabase.from('content_import_batches').update({status:'complete',records_seen:seen,records_imported:imported,records_failed:failed,last_offset:offset,completed_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq('id',importId);
const {count,error:countError}=await supabase.from('questions').select('id',{count:'exact',head:true});
if(countError) throw new Error(`Question count verification failed: ${countError.message}`);
const resourceResult=await importResources();
console.log(JSON.stringify({importId,seen,imported,failed,databaseQuestionCount:count,resources:resourceResult,batchSize},null,2));

async function saveProgress(){const {error}=await supabase.from('content_import_batches').update({records_seen:seen,records_imported:imported,records_failed:failed,last_offset:offset,updated_at:new Date().toISOString()}).eq('id',importId);if(error)throw new Error(`Checkpoint update failed: ${error.message}`);}
async function importBatch(group) {
  const now=new Date().toISOString();
  const subjects=[...new Set(group.map(q=>String(q.normalizedSubject??q.subject??'').trim()).filter(Boolean))].map(name=>({name,normalized_name:name.toLocaleLowerCase()}));
  if(subjects.length){const {error}=await supabase.from('subjects').upsert(subjects,{onConflict:'normalized_name'});if(error)throw new Error(`Subject upsert failed: ${error.message}`);}
  const {data:subjectRows,error:subjectError}=await supabase.from('subjects').select('id,name,normalized_name').in('normalized_name',subjects.map(s=>s.normalized_name));if(subjectError)throw new Error(subjectError.message);
  const subjectIds=new Map(subjectRows.map(s=>[s.normalized_name,s.id]));
  const exams=[...new Set(group.map(q=>q.examType??q.exam).filter(Boolean))].map(name=>({name:String(name).toUpperCase()}));
  if(exams.length){const {error}=await supabase.from('exams').upsert(exams,{onConflict:'name'});if(error)throw new Error(`Exam upsert failed: ${error.message}`);}
  const sources=[...new Map(group.map(q=>[String(q.source??'UNKNOWN'),{source_key:String(q.source??'UNKNOWN'),source_name:String(q.sourceName??q.source??'Unknown'),source_url:q.sourceUrl??null}])).values()];
  if(sources.length){const {error}=await supabase.from('question_sources').upsert(sources,{onConflict:'source_key'});if(error)throw new Error(`Source upsert failed: ${error.message}`);}
  const {data:sourceRows,error:sourceError}=await supabase.from('question_sources').select('id,source_key').in('source_key',sources.map(s=>s.source_key));if(sourceError)throw new Error(sourceError.message);
  const sourceIds=new Map(sourceRows.map(s=>[s.source_key,s.id]));
  const rows=group.map(q=>{
    const source=String(q.source??'UNKNOWN'), sid=String(q.sourceId??q.id), subject=String(q.normalizedSubject??q.subject??'Unknown');
    return { q, id:stableUuid(`${source}:${sid||fingerprint(q)}`), source, sid, subject, fp:q.contentHash??fingerprint(q), rights:String(q.rightsStatus??'unknown').toLowerCase()==='user_provided_authorized'?'permission_granted':String(q.rightsStatus??'unknown').toLowerCase() };
  });
  const dbRows=rows.map(({q,id,subject,source,sid,fp,rights})=>({id,exam:String(q.examType??q.exam??'OTHER').toUpperCase(),exam_type:String(q.examType??q.exam??'OTHER').toUpperCase(),year:q.examYear??null,subject,normalized_subject:subject.toLocaleLowerCase(),paper:q.paper??null,question_number:q.questionNumber??null,prompt:q.question,question_type:q.questionType??'multiple_choice',difficulty:Number.isInteger(q.difficulty)?q.difficulty:null,options:q.options??{},correct_answer:q.correctAnswer==null?null:JSON.stringify(q.correctAnswer),explanation:q.explanation??null,source_name:q.sourceName??source,source_url:q.sourceUrl??null,source,source_id:sid,provenance:{records:q.provenance??[],rightsEvidence:q.rightsEvidence??null},rights_status:rights,rights_evidence:q.rightsEvidence??null,verification_status:q.verificationStatus??'pending',subtopic:q.subtopic??null,images:[],passage:null,content_type:q.contentType??(source==='ALOC'||source==='SDASH'?'AUTHENTIC_AUTHORIZED':'OTHER_AUTHORIZED'),estimated_time:q.estimatedTime??null,content_fingerprint:fp,created_at:q.createdAt??now,updated_at:q.updatedAt??now}));
  const {error}=await supabase.from('questions').upsert(dbRows,{onConflict:'id'});if(error)throw new Error(`Question upsert failed: ${error.message}`);
  const optionRows=[], topicRows=[], provenanceRows=[], verificationRows=[];
  for(const {q,id,source,sid,subject} of rows){
    for(const [index,[k,v]] of Object.entries(q.options??{}).entries()) optionRows.push({question_id:id,option_key:String(k).toLowerCase(),option_text:String(v),sort_order:index});
    if(q.topic&&subjectIds.has(subject.toLocaleLowerCase()))topicRows.push({question_id:id,subject_id:subjectIds.get(subject.toLocaleLowerCase()),topic:q.topic,subtopic:q.subtopic??null});
    provenanceRows.push({question_id:id,source_id:sourceIds.get(source),source_record_id:sid||null,provenance:{records:q.provenance??[]},rights_status:q.rightsStatus??'unknown',rights_evidence:q.rightsEvidence??null});
    verificationRows.push({question_id:id,status:q.verificationStatus??'pending',reviewed_by:q.reviewedBy??null,reviewed_at:q.lastReviewedAt??null,updated_at:now});
  }
  for(const [table,items,conflict] of [['question_options',optionRows,'question_id,option_key'],['question_topics',topicRows,'question_id,topic'],['question_provenance',provenanceRows,'question_id,source_id,source_record_id'],['question_verification',verificationRows,'question_id']])if(items.length){const {error:e}=await supabase.from(table).upsert(items,{onConflict:conflict});if(e)throw new Error(`${table} upsert failed: ${e.message}`);}
  return rows.length;
}

async function importResources(){
  const resourceId=stableUuid('tutorme-content-resources-v1');
  const {error:ledgerError}=await supabase.from('content_import_batches').upsert({id:resourceId,content_kind:'resources',source_manifest:'output/library/resources.jsonl',status:'in_progress',updated_at:new Date().toISOString()});
  if(ledgerError)throw new Error(`Resource import ledger failed: ${ledgerError.message}`);
  let total=0,at=0;
  const reader=createInterface({input:createReadStream('output/library/resources.jsonl',{encoding:'utf8'}),crlfDelay:Infinity});
  let batch=[];
  for await(const line of reader){if(!line.trim())continue;try{batch.push(JSON.parse(line));}catch{continue;}if(batch.length>=batchSize){total+=await importResourceBatch(batch);at+=batch.length;batch=[];await saveResource();}}
  if(batch.length){total+=await importResourceBatch(batch);at+=batch.length;await saveResource();}
  const {error}=await supabase.from('content_import_batches').update({status:'complete',records_seen:at,records_imported:total,last_offset:at,completed_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq('id',resourceId);
  if(error)throw new Error(`Resource completion checkpoint failed: ${error.message}`);
  const {count,error:countError}=await supabase.from('learning_resources').select('id',{count:'exact',head:true});
  if(countError)throw new Error(`Resource count verification failed: ${countError.message}`);
  return {seen:at,imported:total,databaseResourceCount:count};
  async function saveResource(){const {error}=await supabase.from('content_import_batches').update({records_seen:at,records_imported:total,last_offset:at,updated_at:new Date().toISOString()}).eq('id',resourceId);if(error)throw new Error(`Resource checkpoint failed: ${error.message}`);}
}
async function importResourceBatch(group){
  const names=[...new Set(group.flatMap(r=>r.subjects??(r.subject?[r.subject]:[])).filter(Boolean))];
  const subjects=names.map(name=>({name,normalized_name:String(name).toLocaleLowerCase()}));
  if(subjects.length){const {error}=await supabase.from('subjects').upsert(subjects,{onConflict:'normalized_name'});if(error)throw new Error(`Resource subject upsert failed: ${error.message}`);}
  const {data:subjectRows,error:subjectError}=await supabase.from('subjects').select('id,normalized_name').in('normalized_name',subjects.map(s=>s.normalized_name));if(subjectError)throw new Error(subjectError.message);
  const subjectIds=new Map(subjectRows.map(s=>[s.normalized_name,s.id]));
  const resources=group.map(r=>({id:String(r.id),title:String(r.title),author:r.author??null,publisher:r.publisher??null,exam_relevance:r.examRelevance??null,resource_type:String(r.resourceType??'reference'),publication_year:r.year??null,source:String(r.source??'unknown'),source_url:String(r.sourceUrl??r.readerUrl??''),reader_url:r.readerUrl??null,rights_status:String(r.rightsStatus??'unknown'),license:r.license??null,access_type:String(r.accessType??'official_external_reader'),reader_available:Boolean(r.readerAvailable),download_allowed:Boolean(r.downloadAllowed),cover_url:r.cover??null,description:r.description??null,language:r.language??null,updated_at:r.updatedAt??new Date().toISOString()}));
  const {error}=await supabase.from('learning_resources').upsert(resources,{onConflict:'id'});if(error)throw new Error(`Resource upsert failed: ${error.message}`);
  const relations=[],levels=[],rights=[];
  for(const r of group){for(const name of r.subjects??(r.subject?[r.subject]:[])){const subjectId=subjectIds.get(String(name).toLocaleLowerCase());if(subjectId)relations.push({resource_id:String(r.id),subject_id:subjectId});}if(r.level)levels.push({resource_id:String(r.id),level:String(r.level)});rights.push({resource_id:String(r.id),rights_status:String(r.rightsStatus??'unknown'),license:r.license??null,evidence:r.provenance??{},download_allowed:Boolean(r.downloadAllowed),updated_at:r.updatedAt??new Date().toISOString()});}
  for(const [table,rows,conflict] of [['resource_subjects',relations,'resource_id,subject_id'],['resource_levels',levels,'resource_id,level'],['resource_rights',rights,'resource_id']])if(rows.length){const {error:e}=await supabase.from(table).upsert(rows,{onConflict:conflict});if(e)throw new Error(`${table} upsert failed: ${e.message}`);}
  return group.length;
}
