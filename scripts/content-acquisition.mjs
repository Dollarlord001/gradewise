import { createReadStream } from 'node:fs';
import { appendFile, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { createInterface } from 'node:readline';
import { createHash } from 'node:crypto';
import { dirname, join, resolve } from 'node:path';
import { ALOCQuestionSource, SdashQuestionSource } from '../lib/content-sources.mjs';

// Deterministic, restart-safe offline normalization and reporting. No source text is
// written to a student-facing directory until rights and structure gates pass.
const root = resolve('.');
const out = join(root, 'output');
const cli=Object.fromEntries(process.argv.slice(2).flatMap((item,i,list)=>item.startsWith('--')?[[item.slice(2),list[i+1]&&!list[i+1].startsWith('--')?list[i+1]:true]]:[]));
const subjects = [
  ['English Language',1500],['Mathematics',1500],['Biology',1200],['Chemistry',1200],['Physics',1500],['Agricultural Science',1000],['Economics',1200],['Government',1200],['Geography',1000],['Literature in English',1000],['Commerce',1000],['CRK',1000],['Accounting',1200],['Further Mathematics',1000],['Computer Science',1000],['Civic Education',1000],['Animal Husbandry',1000],['IRK',1000],['Arabic',1000],['History',1000],['Home Economics',1000],['Insurance',800],['Current Affairs',500],['Fine Art',500],['Music',500],['Hausa',1000],['Igbo',1000],['Yoruba',1000],
];
const aliasMap = new Map();
for (const [canonical, aliases] of [
  ['English Language',['english','use of english','english studies']],['Mathematics',['math','maths','mathematics']],['Agricultural Science',['agric','agriculture','agricultural science']],['Accounting',['accounting','financial accounting','principle of accounts','principles of accounts']],['Literature in English',['literature','literature in english']],['CRK',['crs','crk','christian religious studies']],['IRK',['irs','irk','islamic religious studies']],['Computer Science',['computer','computer studies','computer science']],['Civic Education',['civic','civic education']],['Further Mathematics',['further maths','further mathematics']],['Fine Art',['fine art','fine arts']],
]) for (const alias of aliases) aliasMap.set(alias, canonical);
const cleanText = value => String(value ?? '').normalize('NFKC').replace(/<[^>]*>/g, ' ').replace(/&nbsp;|&#160;/gi,' ').replace(/&amp;/gi,'&').replace(/&quot;|&#34;/gi,'"').replace(/&#39;|&apos;/gi,"'").replace(/&lt;/gi,'<').replace(/&gt;/gi,'>').replace(/\s+/g,' ').trim();
const norm = value => cleanText(value).toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
const hash = value => createHash('sha256').update(value).digest('hex');
const safe = value => String(value || 'unknown').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'') || 'unknown';
const canonicalSubject = value => { const raw=cleanText(value); return aliasMap.get(norm(raw)) ?? raw.replace(/\b\p{L}/gu,c=>c.toLocaleUpperCase()); };
const now = new Date().toISOString();
const curatedLibrary = [
  ...[7,8,9,10,11,12].map(level=>({id:`siyavula-mathematics-grade-${level}`,title:`Mathematics Grade ${level}`,author:null,publisher:null,subject:'Mathematics',subjects:['Mathematics'],level:`Grade ${level}`,examRelevance:null,resourceType:'open_textbook',year:null,source:'Siyavula',sourceUrl:'https://www.siyavula.com/read',rightsStatus:'OPEN_LICENSE',license:'CC BY-ND 3.0 branded PDF; official reader page states CC BY for textbook content. Check version-specific attribution before reuse.',accessType:'official_external_reader',readerAvailable:true,readerUrl:`https://www.siyavula.com/read/za/mathematics/grade-${level}`,downloadAllowed:true,cover:null,description:null,language:'English'})),
  ...[10,11,12].map(level=>({id:`siyavula-physical-sciences-grade-${level}`,title:`Physical Sciences Grade ${level}`,author:null,publisher:null,subject:'Physics and Chemistry',subjects:['Physics','Chemistry'],level:`Grade ${level}`,examRelevance:null,resourceType:'open_textbook',year:null,source:'Siyavula',sourceUrl:'https://www.siyavula.com/read',rightsStatus:'OPEN_LICENSE',license:'CC BY-ND 3.0 branded PDF; official reader page states CC BY for textbook content. Check version-specific attribution before reuse.',accessType:'official_external_reader',readerAvailable:true,readerUrl:`https://www.siyavula.com/read/za/physical-sciences/grade-${level}`,downloadAllowed:true,cover:null,description:null,language:'English'})),
  {id:'siyavula-life-sciences-grade-10',title:'Life Sciences Grade 10',author:null,publisher:null,subject:'Biology',subjects:['Biology'],level:'Grade 10',examRelevance:null,resourceType:'open_textbook',year:null,source:'Siyavula',sourceUrl:'https://www.siyavula.com/read',rightsStatus:'OPEN_LICENSE',license:'CC BY-ND 3.0 branded PDF; official reader page states CC BY for textbook content. Check version-specific attribution before reuse.',accessType:'official_external_reader',readerAvailable:true,readerUrl:'https://www.siyavula.com/read/za/life-sciences/grade-10',downloadAllowed:true,cover:null,description:null,language:'English'},
  ...[
    {id:'openstax-biology-2e',title:'Biology 2e',author:'Mary Ann Clark, Matthew Douglas, Jung Choi',subject:'Biology',level:'College / introductory biology',year:2018,readerUrl:'https://openstax.org/books/biology-2e/pages/1-introduction',sourceUrl:'https://openstax.org/books/biology-2e/pages/preface'},
    {id:'openstax-chemistry-2e',title:'Chemistry 2e',author:'Paul Flowers, Klaus Theopold, Richard Langley, William R. Robinson',subject:'Chemistry',level:'College / introductory chemistry',year:2019,readerUrl:'https://openstax.org/books/chemistry-2e/pages/1-introduction',sourceUrl:'https://openstax.org/books/chemistry-2e/pages/preface'},
    {id:'openstax-college-physics-2e',title:'College Physics 2e',author:'Paul Peter Urone, Roger Hinrichs',subject:'Physics',level:'College / introductory physics',year:2022,readerUrl:'https://openstax.org/books/college-physics-2e/pages/1-introduction-to-science-and-the-realm-of-physics-physical-quantities-and-units',sourceUrl:'https://openstax.org/books/college-physics-2e/pages/preface'},
    {id:'openstax-algebra-and-trigonometry-2e',title:'Algebra and Trigonometry 2e',author:'Jay Abramson',subject:'Mathematics',level:'College / introductory mathematics',year:2021,readerUrl:'https://openstax.org/books/algebra-and-trigonometry-2e/pages/1-introduction-to-prerequisites',sourceUrl:'https://openstax.org/books/algebra-and-trigonometry-2e/pages/preface'},
  ].map(book=>({...book,publisher:'OpenStax',source:'OpenStax',subjects:[book.subject],examRelevance:null,resourceType:'open_textbook',rightsStatus:'OPEN_LICENSE',license:'CC BY-NC-SA 4.0; TUTOR-ME links to the official reader only. Reuse requires attribution and share-alike for noncommercial purposes; commercial reuse requires permission.',accessType:'official_external_reader',readerAvailable:true,downloadAllowed:false,cover:null,description:null,language:'English',attributionRequired:true})),
].map(resource=>({...resource,provenance:{catalogUrl:resource.sourceUrl,licenseEvidence:resource.source==='OpenStax'?'Official individual book preface states CC BY-NC-SA 4.0 and provides attribution citation details.':'Official catalog and individual reader pages identify open textbook content and license; embedded third-party media may have separate rights.',rightsStatus:'OPEN_LICENSE'},createdAt:'2026-10-03T00:00:00.000Z',updatedAt:'2026-10-03T00:00:00.000Z'}));
const countBy = (rows, getter) => { const counts={}; for (const row of rows) { const key=String(getter(row) ?? 'Unknown'); counts[key]=(counts[key]??0)+1; } return Object.fromEntries(Object.entries(counts).sort(([a],[b])=>a.localeCompare(b))); };
async function readJsonl(path, fn) {
  const stream=createReadStream(path,{encoding:'utf8'}); const lines=createInterface({input:stream,crlfDelay:Infinity}); let index=0;
  for await (const line of lines) { if (!line.trim()) continue; index++; try { await fn(JSON.parse(line),index); } catch(error) { if (error instanceof SyntaxError) await fn({__parseError:error.message,__rawLine:line},index); else throw error; } }
}
async function harvestOne(provider,subject) {
  const endpoint=provider==='sdash'?'https://sdashapi.com/api/v1/q':'https://dev.aloc.com.ng/api/v1/questions';
  const credential=provider==='sdash'?(process.env.SDASH_ACCESS_TOKEN||process.env.SDASH_API_KEY):process.env.ALOC_API_KEY;
  if(!credential) return {provider,subject,status:'skipped',reason:'credential not configured',records:0};
  const batchSize=provider==='sdash'?50:15;const adapter=provider==='sdash'?new SdashQuestionSource():new ALOCQuestionSource();
  const checkpointFile=join(out,'checkpoints',`${provider}-${safe(subject)}-jamb.json`); const batchFile=join(root,'content/acquired',`${provider}-${safe(subject)}-jamb-batch-001.jsonl`);
  let prior=null;try{prior=JSON.parse(await readFile(checkpointFile,'utf8'));}catch{}
  if(prior?.status==='complete')return {provider,subject,status:'already-complete',records:prior.recordsAcquired,checkpoint:checkpointFile};
  if(prior?.status==='permanent_error')return {provider,subject,status:'already-stopped',reason:prior.errorState,records:prior.recordsAcquired??0,checkpoint:checkpointFile};
  const startedAt=new Date().toISOString();
  await mkdir(dirname(checkpointFile),{recursive:true}); await mkdir(dirname(batchFile),{recursive:true});
  const maxBatches=Math.min(3,Math.max(1,Number(cli['max-batches']??1)||1));
  const checkpoint={...(prior??{}),source:provider==='sdash'?'SdashAPI':'ALOC Station',endpointOrFilter:`${endpoint}?subject=${encodeURIComponent(subject.toLowerCase())}&examType=jamb&limit=${batchSize}`,pageOrCursor:prior?.nextCursor??null,lastSuccessfulBatch:prior?.lastSuccessfulBatch??0,timestamp:startedAt,recordsAcquired:prior?.recordsAcquired??0,recordsAccepted:prior?.recordsAccepted??0,recordsRejected:prior?.recordsRejected??0,recordsDuplicated:prior?.recordsDuplicated??0,apiCreditUsage:prior?.apiCreditUsage??0,errorState:null,status:'in_progress',batchFiles:prior?.batchFiles??[]};
  await writeFile(checkpointFile,JSON.stringify(checkpoint,null,2)+'\n');
  try {
    for(let page=0;page<maxBatches;page++) {
      if(provider==='sdash'&&checkpoint.lastSuccessfulBatch>0)break; // v1 is random batch retrieval, not cursor pagination.
      const page=provider==='sdash'?await adapter.fetchBatch({subject,exam:'utme',limit:batchSize}):await adapter.fetchPage({subject,exam:'jamb',limit:batchSize,cursor:checkpoint.nextCursor});
      const records=page.questions;
      const batchPath=join(root,'content/acquired',`${provider}-${safe(subject)}-jamb-batch-${String(checkpoint.lastSuccessfulBatch+1).padStart(3,'0')}.jsonl`);
      await writeFile(batchPath,records.map(JSON.stringify).join('\n')+(records.length?'\n':''));checkpoint.batchFiles.push(batchPath);checkpoint.lastSuccessfulBatch++;checkpoint.recordsAcquired+=records.length;
      checkpoint.apiCreditUsage+=Number(page.creditsUsed)||1;checkpoint.creditsRemaining=page.creditsRemaining??checkpoint.creditsRemaining??null;checkpoint.rateLimitRemaining=page.rateLimitRemaining??null;
      if(provider==='aloc'){checkpoint.nextCursor=page.nextCursor??null;checkpoint.hasMore=Boolean(page.hasMore);if(!checkpoint.hasMore)break;await new Promise(r=>setTimeout(r,2100));}
      else break;
      checkpoint.timestamp=new Date().toISOString();checkpoint.pageOrCursor=checkpoint.nextCursor;await writeFile(checkpointFile,JSON.stringify(checkpoint,null,2)+'\n');
    }
    checkpoint.recordsAccepted=checkpoint.recordsAcquired;checkpoint.timestamp=new Date().toISOString();checkpoint.status=provider==='aloc'&&checkpoint.hasMore?'partial':'complete';checkpoint.errorState=null;
    await writeFile(checkpointFile,JSON.stringify(checkpoint,null,2)+'\n');return {provider,subject,status:checkpoint.status,records:checkpoint.recordsAcquired,batchFiles:checkpoint.batchFiles,checkpoint:checkpointFile,apiCreditUsage:checkpoint.apiCreditUsage};
  } catch(error) {
    checkpoint.timestamp=new Date().toISOString();checkpoint.errorState=String(error.message).slice(0,240);checkpoint.status=/HTTP (401|403|404|405|406|422)/.test(checkpoint.errorState)?'permanent_error':'error';await writeFile(checkpointFile,JSON.stringify(checkpoint,null,2)+'\n');return {provider,subject,status:checkpoint.status,reason:checkpoint.errorState,records:0,checkpoint:checkpointFile,apiCreditUsage:checkpoint.apiCreditUsage};
  }
}
function normalize(raw) {
  const source=String(raw.source??'FILE').toUpperCase(); const sourceId=String(raw.sourceId??raw.source_id??raw.id??'').trim();
  const prompt=cleanText(raw.prompt??raw.question??raw.text??raw.questionHtml); const rawOptions=raw.options??raw.option;
  let opts=rawOptions; if (typeof opts==='string') { try { opts=JSON.parse(opts); } catch { opts=null; } }
  if (Array.isArray(opts)) opts=Object.fromEntries(opts.map((v,i)=>[String.fromCharCode(97+i),typeof v==='object'?cleanText(v?.text??v?.value):cleanText(v)]));
  if (opts&&typeof opts==='object') opts=Object.fromEntries(Object.entries(opts).map(([k,v])=>[String(k).toLowerCase().replace(/^option\s*/,'').replace(/[.)]/g,''),cleanText(typeof v==='object'?v?.text??v?.value:v)]).filter(([,v])=>v)); else opts={};
  const keys=Object.keys(opts); const rawAnswer=String(raw.correctAnswer??raw.correct_answer??raw.answer??'').trim().toLowerCase();
  let answer=rawAnswer.replace(/^(option|answer)\s*/, '').replace(/[.)]/g,'');
  if (/^\d+$/.test(answer)&&!Object.hasOwn(opts,answer)) answer=keys[Number(answer)]??answer;
  const byValue=keys.find(key=>norm(opts[key])===norm(rawAnswer)); if (!Object.hasOwn(opts,answer)&&byValue) answer=byValue;
  const yearRaw=raw.year??raw.examYear??raw.examyear; const year=yearRaw==null||yearRaw===''?null:Number(yearRaw);
  const examRaw=cleanText(raw.exam??raw.examType??raw.examtype); const exam=({UTME:'JAMB',WASSCE:'WAEC'})[examRaw.toUpperCase()]??(examRaw.toUpperCase()||null);
  const subject=canonicalSubject(raw.subject); const rights=raw.rightsStatus??(source==='ALOC'?'USER_PROVIDED_AUTHORIZED':'UNKNOWN');
  const provenance=Array.isArray(raw.provenanceRecords)?raw.provenanceRecords:raw.provenance?Array.isArray(raw.provenance)?raw.provenance:[raw.provenance]:[{source,sourceName:raw.sourceName??null,sourceId:sourceId||null,sourceUrl:raw.sourceUrl??null,rightsStatus:rights,rightsEvidence:raw.rightsEvidence??null}];
  const id=raw.id??hash(`${source}:${sourceId||hash(norm(prompt))}`).slice(0,32);
  const sourceFields=raw.sourceMetadata?.originalFields??raw.source_metadata?.originalFields??{};
  const q={id,question:prompt,prompt,options:opts,correctAnswer:answer,explanation:cleanText(raw.explanation??raw.solution)||null,subject,normalizedSubject:subject,topic:cleanText(raw.topic)||null,subtopic:cleanText(raw.subtopic)||null,exam,examType:exam,examYear:Number.isInteger(year)?year:null,difficulty:raw.difficulty??raw.difficultyLevel??null,estimatedTime:raw.estimatedTime??null,source,sourceName:raw.sourceName??null,sourceUrl:raw.sourceUrl??null,sourceMetadata:raw.sourceMetadata??raw.source_metadata??null,provenance,rightsStatus:rights,rightsEvidence:raw.rightsEvidence??provenance.find(p=>p?.rightsEvidence)?.rightsEvidence??null,verificationStatus:'pending',contentType:raw.contentType??'multiple_choice',reviewedBy:raw.reviewedBy??null,lastReviewedAt:raw.lastReviewedAt??null,publishedAt:raw.publishedAt??null,createdAt:raw.createdAt??sourceFields.created_at??null,updatedAt:raw.updatedAt??sourceFields.updated_at??null,sourceId};
  const issues=[];
  if(raw.__parseError) issues.push('malformed JSONL record');
  if(!sourceId) issues.push('missing stable source ID');
  if(prompt.length<3) issues.push('missing or too-short question text');
  if(!subject) issues.push('missing subject');
  if(keys.length<2||keys.length!==new Set(keys).size||keys.some(k=>!opts[k])) issues.push('invalid options');
  if(new Set(keys.map(k=>norm(opts[k]))).size!==keys.length) issues.push('duplicate option values');
  if(!answer||!Object.hasOwn(opts,answer)) issues.push('answer does not point to an existing option');
  if(year!=null&&(!Number.isInteger(year)||year<1900||year>new Date().getFullYear()+1)) issues.push('invalid exam year');
  if(!exam) issues.push('missing exam');
  if(!Array.isArray(provenance)||!provenance.some(p=>p?.source||p?.sourceName)) issues.push('missing provenance');
  if(!['USER_PROVIDED_AUTHORIZED','PUBLIC_DOMAIN','OPEN_LICENSE','PUBLISHER_AUTHORIZED','GOVERNMENT_PUBLIC','API_AUTHORIZED'].includes(String(rights).toUpperCase())) issues.push('rights status not cleared');
  return {q,issues};
}

if(cli['harvest-live']) {
  const providers=String(cli.providers??'aloc,sdash').split(',').map(x=>x.trim().toLowerCase()).filter(x=>['aloc','sdash'].includes(x));
  const subjectList=String(cli.subjects??cli.subject??'biology').split(',').map(x=>x.trim()).filter(Boolean); const outcomes=[];
  for(const subject of subjectList) for(const provider of providers) {
    if(outcomes.length) await new Promise(resolve=>setTimeout(resolve,2100));
    outcomes.push(await harvestOne(provider,subject));
  }
  await writeFile(join(out,'reports','live-harvest.json'),JSON.stringify({generatedAt:new Date().toISOString(),subjects:subjectList,boundedBatches:outcomes.length,outcomes},null,2)+'\n');
  console.log(JSON.stringify({liveHarvest:outcomes},null,2));
}
const acquiredDir=join(root,'content/acquired'); const files=(await readdir(acquiredDir).catch(()=>[])).filter(f=>/\.(jsonl|ndjson)$/i.test(f)).sort();
for (const dir of ['questions','library','manifests','reports','checkpoints','quarantine']) await mkdir(join(out,dir),{recursive:true});
const acquiredCount={}; const seenId=new Map(); const seenPrompt=new Map(); const nearBuckets=new Map(); const sources=[];
const counts={acquired:0,unique:0,productionReady:0,quarantined:0,rejected:0,duplicates:0};
const buckets={subject:{},exam:{},year:{},source:{},rights:{},verification:{},topic:{},subtopic:{}};
const fileStats={}; const outputBuffer=new Map(); const initialized=new Set();
const inc=(bucket,key)=>{key=String(key??'Unknown');bucket[key]=(bucket[key]??0)+1;};
async function queueLine(path,row){let lines=outputBuffer.get(path)??[];lines.push(JSON.stringify(row));if(lines.length>=300){await appendFile(path,lines.join('\n')+'\n');lines=[];}outputBuffer.set(path,lines);}
async function flushBuffers(){for(const [path,lines] of outputBuffer)if(lines.length)await appendFile(path,lines.join('\n')+'\n');}
for(const dir of ['questions','quarantine'])await mkdir(join(out,dir),{recursive:true});
await writeFile(join(out,'quarantine','questions.jsonl'),'');await writeFile(join(out,'quarantine','rejected.jsonl'),'');await writeFile(join(out,'reports','duplicates.jsonl'),'');
for (const file of files) {
  const sourcePath=join(acquiredDir,file); const checkpointPath=join(out,'checkpoints',`${safe(file)}.json`);
  const checkpoint={source:file,endpointOrFilter:'local file (JSONL/NDJSON)',pageOrCursor:null,lastSuccessfulBatch:0,timestamp:new Date().toISOString(),recordsAcquired:0,recordsAccepted:0,recordsRejected:0,recordsDuplicated:0,apiCreditUsage:null,errorState:null};
  const stats={accepted:0,rejected:0,quarantined:0,duplicates:0};
  await readJsonl(sourcePath,async(raw)=>{
    checkpoint.recordsAcquired++;counts.acquired++; const {q,issues}=normalize(raw); const rec={...q,contentHash:hash(norm(q.prompt)),acquiredAt:now};
    if(issues.length){const status=issues.includes('rights status not cleared')?'quarantined':'rejected';await queueLine(join(out,'quarantine',status==='quarantined'?'questions.jsonl':'rejected.jsonl'),{...rec,issues,sourceRecord:raw});stats[status]++;checkpoint.recordsRejected++;return;}
    const previousId=seenId.get(q.id); const promptKey=`${norm(q.prompt)}`; const previousPrompt=seenPrompt.get(promptKey);
    if(previousId||previousPrompt){const existing=previousId??previousPrompt;await queueLine(join(out,'reports','duplicates.jsonl'),{...rec,duplicateOf:existing.id,duplicateReason:previousId?'duplicate canonical ID':'exact normalized prompt duplicate',provenance:q.provenance});stats.duplicates++;checkpoint.recordsDuplicated++;return;}
    // Bounded approximate candidate detection. Near matches are quarantined for review.
    const words=[...new Set(norm(q.prompt).split(' ').filter(w=>w.length>3))]; const signature=words.slice(0,8).sort().slice(0,4).join('|');
    const candidates=nearBuckets.get(signature)??[]; let near=null;
    for(const old of candidates.slice(-24)){const a=new Set(words),b=new Set(old.words);const common=[...a].filter(w=>b.has(w)).length; if(a.size>6&&b.size>6&&common/Math.max(a.size,b.size)>=0.9){near=old;break;}}
    if(near){await queueLine(join(out,'quarantine','questions.jsonl'),{...rec,issues:['possible near-duplicate prompt'],duplicateCandidate:near.id,sourceRecord:raw});stats.quarantined++;checkpoint.recordsRejected++;return;}
    const bucket=nearBuckets.get(signature)??[]; bucket.push({id:q.id,words}); nearBuckets.set(signature,bucket);
    seenId.set(q.id,{id:q.id}); seenPrompt.set(promptKey,{id:q.id}); counts.unique++;counts.productionReady++;stats.accepted++;checkpoint.recordsAccepted++;
    inc(buckets.subject,q.normalizedSubject);inc(buckets.exam,q.exam);inc(buckets.year,q.examYear??'Unknown');inc(buckets.source,q.sourceName??q.source);inc(buckets.rights,q.rightsStatus);inc(buckets.verification,q.verificationStatus);inc(buckets.topic,q.topic??'Unknown');inc(buckets.subtopic,q.subtopic??'Unknown');
    const path=join(out,'questions',`${safe(q.normalizedSubject)}.jsonl`);if(!initialized.has(path)){await writeFile(path,'');initialized.add(path);}await queueLine(path,rec);
  });
  fileStats[file]=stats;
  checkpoint.lastSuccessfulBatch=1; checkpoint.timestamp=new Date().toISOString();
  await writeFile(checkpointPath,JSON.stringify(checkpoint,null,2)+'\n'); acquiredCount[file]=checkpoint.recordsAcquired; sources.push({source:file,records:checkpoint.recordsAcquired,accepted:stats.accepted,rejected:stats.rejected+stats.quarantined,quarantined:stats.quarantined,duplicates:stats.duplicates});
}
await flushBuffers();counts.quarantined=Object.values(fileStats).reduce((a,s)=>a+s.quarantined,0);counts.rejected=Object.values(fileStats).reduce((a,s)=>a+s.rejected,0);counts.duplicates=Object.values(fileStats).reduce((a,s)=>a+s.duplicates,0);
const checkpointNames=await readdir(join(out,'checkpoints')).catch(()=>[]);
for(const provider of ['aloc','sdash'])for(const name of checkpointNames.filter(n=>n.startsWith(`${provider}-`)&&n.endsWith('.json'))){const path=join(out,'checkpoints',name);let cp;try{cp=JSON.parse(await readFile(path,'utf8'));}catch{continue;}if(!Array.isArray(cp.batchFiles))cp.batchFiles=files.filter(f=>f.startsWith(`${provider}-`)&&f.includes('-jamb-batch-')).map(f=>join(acquiredDir,f));const stats=cp.batchFiles.map(p=>fileStats[p.split('/').at(-1)]).filter(Boolean);if(stats.length){cp.recordsAccepted=stats.reduce((n,s)=>n+s.accepted,0);cp.recordsRejected=stats.reduce((n,s)=>n+s.rejected+s.quarantined,0);cp.recordsDuplicated=stats.reduce((n,s)=>n+s.duplicates,0);cp.normalizedAt=new Date().toISOString();await writeFile(path,JSON.stringify(cp,null,2)+'\n');}}

const floors=Object.fromEntries(subjects.map(([subject,floor])=>{const count=buckets.subject[subject]??0;return [subject,{required:floor,available:count,shortfall:Math.max(0,floor-count),met:count>=floor}]}));
const liveHarvest=await readFile(join(out,'reports','live-harvest.json'),'utf8').then(JSON.parse).catch(()=>null);
const librarySubjects={};for(const resource of curatedLibrary)for(const subject of resource.subjects)librarySubjects[subject]=(librarySubjects[subject]??0)+1;
const library={totalResources:curatedLibrary.length,productionReady:curatedLibrary.filter(r=>['OPEN_LICENSE','PUBLIC_DOMAIN','PUBLISHER_AUTHORIZED','GOVERNMENT_PUBLIC','USER_PROVIDED_AUTHORIZED','API_AUTHORIZED'].includes(r.rightsStatus)&&r.readerAvailable).length,bySubject:librarySubjects,byLevel:countBy(curatedLibrary,r=>r.level),byType:countBy(curatedLibrary,r=>r.resourceType),byRightsStatus:countBy(curatedLibrary,r=>r.rightsStatus),withReaderAccess:curatedLibrary.filter(r=>r.readerAvailable).length,downloadPermitted:curatedLibrary.filter(r=>r.downloadAllowed).length,missingSubjectLevelCoverage:subjects.map(([subject])=>({subject,levels:['JSS','SS1','SS2','SS3'],available:librarySubjects[subject]??0,requestedPerLevel:5,status:librarySubjects[subject]?'partial':'missing'}))};
await writeFile(join(out,'library','resources.jsonl'),curatedLibrary.map(JSON.stringify).join('\n')+'\n');
const checkpointRows=[];for(const name of checkpointNames.filter(n=>n.endsWith('.json')))try{checkpointRows.push(JSON.parse(await readFile(join(out,'checkpoints',name),'utf8')))}catch{}
const credits=checkpointRows.reduce((sum,cp)=>sum+(Number(cp.apiCreditUsage)||0),0);
const alocCheckpoint=checkpointRows.filter(cp=>cp.source==='ALOC Station').sort((a,b)=>(b.lastSuccessfulBatch??0)-(a.lastSuccessfulBatch??0))[0];const sdashCheckpoint=checkpointRows.find(cp=>cp.source==='SdashAPI'&&cp.status==='complete')??checkpointRows.find(cp=>cp.source==='SdashAPI');
const resumeTest={generatedAt:now,aloc:{lastSuccessfulBatch:alocCheckpoint?.lastSuccessfulBatch??0,status:alocCheckpoint?.status??'not-started',checkpointRetained:!!alocCheckpoint?.nextCursor||Boolean(alocCheckpoint?.hasMore),batchesCached:alocCheckpoint?.batchFiles?.length??0},sdash:{lastSuccessfulBatch:sdashCheckpoint?.lastSuccessfulBatch??0,status:sdashCheckpoint?.status??'not-started',repeatSuppressed:sdashCheckpoint?.status==='complete'&&sdashCheckpoint?.lastSuccessfulBatch===1,batchesCached:sdashCheckpoint?.batchFiles?.length??0}};
await writeFile(join(out,'reports','resume-test.json'),JSON.stringify(resumeTest,null,2)+'\n');
const expectedExams=['JAMB','WAEC','NECO'];
const coverage={generatedAt:now,acquisition:{acquired:counts.acquired,files:sources,liveHarvest,apiCreditUsage:credits},questionBank:{acquired:counts.acquired,normalized:counts.acquired,deduplicated:counts.acquired-counts.duplicates,unique:counts.unique,structurallyValid:counts.unique,productionReady:counts.productionReady,quarantined:counts.quarantined,rejected:counts.rejected,duplicates:counts.duplicates,stages:{acquired:counts.acquired,normalized:counts.acquired,deduplicated:counts.acquired-counts.duplicates,structurallyValid:counts.unique,productionReady:counts.productionReady,quarantined:counts.quarantined,rejected:counts.rejected,duplicates:counts.duplicates},bySubject:buckets.subject,byExam:buckets.exam,byYear:buckets.year,bySource:buckets.source,byRightsStatus:buckets.rights,byVerificationStatus:buckets.verification,byTopic:buckets.topic,bySubtopic:buckets.subtopic,subjectFloors:floors,missingSubjectFloors:Object.entries(floors).filter(([,v])=>!v.met).map(([s,v])=>({subject:s,...v})),semanticVerification:'pending; structural validity is not semantic verification',examCoverage:Object.keys(buckets.exam),missingExamCoverage:expectedExams.filter(exam=>!buckets.exam[exam])},library,targets:{minimumUniqueQuestions:200000,questionTargetMet:false,minimumLegalResourcesPerSubjectAndLevel:5,libraryTargetMet:false},limitations:['Only repository-local and bounded live-provider batch files were processed.','Sdash v1 uses randomized batch retrieval without stable server pagination; a completed batch is cached to prevent accidental repeat calls.','ALOC uses bounded cursor pagination and records next cursor for continuation.','The requested external acquisition pack path was not present.','Library coverage is limited to officially catalogued Siyavula mathematics and science titles; it is not at five resources per subject and level.']};
await writeFile(join(out,'manifests','library.json'),JSON.stringify(library,null,2)+'\n');
await writeFile(join(out,'manifests','question-bank.json'),JSON.stringify(coverage.questionBank,null,2)+'\n');
await writeFile(join(out,'manifests','library.json'),JSON.stringify(coverage.library,null,2)+'\n');
await writeFile(join(out,'manifests','content-manifest.json'),JSON.stringify(coverage,null,2)+'\n');
await writeFile(join(out,'reports','coverage.json'),JSON.stringify(coverage,null,2)+'\n');
console.log(JSON.stringify({output:out,acquired:coverage.questionBank.acquired,unique:coverage.questionBank.unique,structurallyValid:coverage.questionBank.structurallyValid,productionReady:coverage.questionBank.productionReady,quarantined:coverage.questionBank.quarantined,rejected:coverage.questionBank.rejected,duplicates:coverage.questionBank.duplicates,subjects:coverage.questionBank.bySubject,libraryResources:curatedLibrary.length,shortSubjects:coverage.questionBank.missingSubjectFloors.length,apiCreditUsage:credits},null,2));
