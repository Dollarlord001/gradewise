import { createReadStream } from 'node:fs';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { createInterface } from 'node:readline';

const out=resolve('output'); const manifest=JSON.parse(await readFile(join(out,'manifests/content-manifest.json'),'utf8'));
const errors=[];const checks={acquisition:false,normalization:false,deduplication:false,rights:false,questionSchema:false,librarySchema:false,subjectFloorAudit:false,provenanceAudit:false,checkpointResumeTest:false};
const ids=new Set();const subjectCounts={};let questionCount=0;
async function eachJsonl(path,fn){const lines=createInterface({input:createReadStream(path,{encoding:'utf8'}),crlfDelay:Infinity});for await(const line of lines){if(line.trim())await fn(JSON.parse(line));}}
const questionFiles=(await readdir(join(out,'questions'))).filter(n=>n.endsWith('.jsonl')).sort();
for(const file of questionFiles)await eachJsonl(join(out,'questions',file),q=>{
  questionCount++;subjectCounts[q.normalizedSubject]=(subjectCounts[q.normalizedSubject]??0)+1;
  for(const key of ['id','question','prompt','options','correctAnswer','subject','normalizedSubject','exam','examType','difficulty','estimatedTime','source','sourceName','sourceId','sourceUrl','sourceMetadata','provenance','rightsStatus','rightsEvidence','verificationStatus','contentType','reviewedBy','lastReviewedAt','publishedAt','createdAt','updatedAt'])if(!(key in q))errors.push(`question missing ${key}: ${file}`);
  if(!q.id||ids.has(q.id))errors.push(`empty or duplicate production ID: ${q.id??'null'}`);ids.add(q.id);
  if(!q.prompt?.trim()||Object.keys(q.options??{}).length<2||!Object.hasOwn(q.options??{},q.correctAnswer))errors.push(`question structure invalid: ${q.id}`);
  if(!['JAMB','WAEC','NECO','BECE','NCEE','POST-UTME'].includes(q.exam))errors.push(`unsupported exam: ${q.exam}`);
  if(q.examYear!=null&&(!Number.isInteger(q.examYear)||q.examYear<1900||q.examYear>new Date().getFullYear()+1))errors.push(`bad year: ${q.id}`);
  if(!['USER_PROVIDED_AUTHORIZED','PUBLIC_DOMAIN','OPEN_LICENSE','PUBLISHER_AUTHORIZED','GOVERNMENT_PUBLIC','API_AUTHORIZED'].includes(q.rightsStatus))errors.push(`unacceptable rights: ${q.id}`);
  if(q.verificationStatus==='verified')errors.push(`structural-only question mislabeled verified: ${q.id}`);
  if(!Array.isArray(q.provenance)||!q.provenance.some(p=>p?.source&&p?.sourceId))errors.push(`provenance absent: ${q.id}`);
});
checks.acquisition=manifest.questionBank.acquired>=questionCount;
checks.normalization=questionCount===manifest.questionBank.structurallyValid;
checks.deduplication=questionCount===manifest.questionBank.unique&&manifest.questionBank.duplicates>=0;
checks.rights=manifest.questionBank.byRightsStatus&&Object.keys(manifest.questionBank.byRightsStatus).every(k=>['USER_PROVIDED_AUTHORIZED','PUBLIC_DOMAIN','OPEN_LICENSE','PUBLISHER_AUTHORIZED','GOVERNMENT_PUBLIC','API_AUTHORIZED'].includes(k));
checks.questionSchema=errors.length===0;

const resources=[];await eachJsonl(join(out,'library/resources.jsonl'),r=>resources.push(r));
for(const r of resources){for(const key of ['id','title','author','publisher','subject','level','examRelevance','resourceType','year','source','sourceUrl','rightsStatus','license','accessType','readerAvailable','downloadAllowed','cover','description','language','createdAt','updatedAt'])if(!(key in r))errors.push(`resource missing ${key}: ${r.id??'unknown'}`);if(!r.id||!r.title||r.rightsStatus!=='OPEN_LICENSE'||!r.readerAvailable||!/^https:\/\//.test(r.readerUrl??''))errors.push(`library resource not production-ready: ${r.id??'unknown'}`);}
checks.librarySchema=resources.length===manifest.library.totalResources&&errors.length===0;
checks.subjectFloorAudit=Object.entries(manifest.questionBank.subjectFloors).every(([s,f])=>f.available===(subjectCounts[s]??0)&&f.shortfall===Math.max(0,f.required-f.available)&&f.met===(f.available>=f.required));
checks.provenanceAudit=errors.every(e=>!e.startsWith('provenance absent'));
const resume=JSON.parse(await readFile(join(out,'reports/resume-test.json'),'utf8'));
checks.checkpointResumeTest=resume.aloc.lastSuccessfulBatch>=1&&resume.aloc.batchesCached>=1&&resume.aloc.checkpointRetained&&resume.sdash.lastSuccessfulBatch>=1&&resume.sdash.repeatSuppressed;
const duplicateLines=[];await eachJsonl(join(out,'reports/duplicates.jsonl'),r=>duplicateLines.push(r));
let rejectCount=0;await eachJsonl(join(out,'quarantine/rejected.jsonl'),()=>rejectCount++);let quarantineCount=0;await eachJsonl(join(out,'quarantine/questions.jsonl'),()=>quarantineCount++);
if(duplicateLines.length!==manifest.questionBank.duplicates)errors.push('duplicate report count differs from manifest');
if(rejectCount!==manifest.questionBank.rejected)errors.push('rejected output count differs from manifest');
if(quarantineCount!==manifest.questionBank.quarantined)errors.push('quarantined output count differs from manifest');
if(manifest.questionBank.productionReady!==questionCount)errors.push('production-ready count differs from partition total');
const checkpointNames=await readdir(join(out,'checkpoints'));for(const name of checkpointNames.filter(n=>n.endsWith('.json'))){const text=await readFile(join(out,'checkpoints',name),'utf8');if(/aloc_(?:live_)?[A-Za-z0-9]{20,}|sdash_[A-Za-z0-9_-]{20,}/i.test(text))errors.push(`possible credential in checkpoint: ${name}`);}
const result={passed:Object.values(checks).filter(Boolean).length,checks,questionCount,libraryCount:resources.length,duplicateCount:duplicateLines.length,rejectedCount:rejectCount,quarantinedCount:quarantineCount,errors:[...new Set(errors)].slice(0,100)};
await mkdir(join(out,'reports'),{recursive:true});await writeFile(join(out,'reports/acquisition-validation.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));if(result.errors.length||Object.values(checks).some(v=>!v))process.exitCode=1;
