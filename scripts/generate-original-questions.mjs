import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { createInterface } from 'node:readline';
import { join, resolve } from 'node:path';

// Bounded, resumable generation of explicitly original TUTOR-ME practice items.
// Generated records remain pending review; they are never described as past questions.
const root = resolve('.');
const outDir = join(root, 'content/acquired');
const checkpointDir = join(root, 'output/checkpoints/generation');
const args = Object.fromEntries(process.argv.slice(2).flatMap((v, i, a) => v.startsWith('--') ? [[v.slice(2), a[i + 1] && !a[i + 1].startsWith('--') ? a[i + 1] : true]] : []));
const floors = [
  ['English Language',1500],['Mathematics',1500],['Biology',1200],['Chemistry',1200],['Physics',1500],['Agricultural Science',1000],['Economics',1200],['Government',1200],['Geography',1000],['Literature in English',1000],['Commerce',1000],['CRK',1000],['Accounting',1200],['Further Mathematics',1000],['Computer Science',1000],['Civic Education',1000],['Animal Husbandry',1000],['IRK',1000],['Arabic',1000],['History',1000],['Home Economics',1000],['Insurance',800],['Current Affairs',500],['Fine Art',500],['Music',500],['Hausa',1000],['Igbo',1000],['Yoruba',1000],
];
const hash = s => createHash('sha256').update(s).digest('hex');
const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const take = Math.min(20, Math.max(1, Number(args['per-batch'] ?? 8) || 8));
const maxBatches = Math.min(100, Math.max(1, Number(args['max-batches'] ?? 1) || 1));
const goal = Math.max(200000, Number(args.goal ?? 200000) || 200000);
const exam = String(args.exam ?? 'JAMB').toUpperCase();
const levels = { JAMB:'Senior Secondary School (SS1–SS3); Nigerian UTME/JAMB subject scope', WAEC:'Senior Secondary School (SS1–SS3); Nigerian WAEC subject scope', NECO:'Senior Secondary School (SS1–SS3); Nigerian NECO subject scope' };
const floorTotal=floors.reduce((n,[,f])=>n+f,0);
const targets=Object.fromEntries(floors.map(([s,f])=>[s,f+Math.floor(Math.max(0,goal-floorTotal)/floors.length)]));

function providers() {
  const all = [
    {name:'gemini', key:process.env.GEMINI_API_KEY, model:process.env.GEMINI_MODEL || 'gemini-2.5-flash'},
    {name:'groq', key:process.env.GROQ_API_KEY, model:process.env.GROQ_MODEL || 'llama-3.3-70b-versatile'},
    {name:'nvidia', key:process.env.NVIDIA_API_KEY, model:process.env.NVIDIA_MODEL || 'meta/llama-3.3-70b-instruct'},
    {name:'openrouter', key:process.env.OPENROUTER_API_KEY, model:process.env.OPENROUTER_MODEL || process.env.GROQ_MODEL || 'openai/gpt-4o-mini'},
  ];
  const preferred = String(process.env.AI_PROVIDER || '').toLowerCase();
  return all.filter(p => p.key).sort((a,b) => Number(b.name === preferred) - Number(a.name === preferred));
}

async function request(p, subject, count, seed) {
  const prompt = `Create exactly ${count} ORIGINAL TUTOR-ME practice multiple-choice questions for ${subject}. Curriculum context: ${levels[exam] ?? levels.JAMB}. These must be newly written teaching/practice items, never copied or represented as official past examination questions. Batch seed: ${seed}. Cover varied subtopics, include a concise correct explanation, and avoid repetition. Return JSON only as {"questions":[{"prompt":"...","options":{"a":"...","b":"...","c":"...","d":"..."},"correctAnswer":"a","explanation":"...","topic":"...","difficulty":1}]}. Difficulty must be integer 1-5. Exactly one option must be correct.`;
  let url, headers, body;
  if (p.name === 'gemini') {
    url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(p.model)}:generateContent?key=${encodeURIComponent(p.key)}`;
    headers = {'content-type':'application/json'};
    body = {contents:[{parts:[{text:prompt}]}],generationConfig:{temperature:0.45,responseMimeType:'application/json'}};
  } else {
    url = p.name === 'groq' ? 'https://api.groq.com/openai/v1/chat/completions' : p.name === 'nvidia' ? 'https://integrate.api.nvidia.com/v1/chat/completions' : 'https://openrouter.ai/api/v1/chat/completions';
    headers = {authorization:`Bearer ${p.key}`,'content-type':'application/json'};
    if (p.name === 'openrouter') { headers['HTTP-Referer']='https://tutor-me.app'; headers['X-Title']='TUTOR-ME original practice generation'; }
    body = {model:p.model,messages:[{role:'system',content:'You write original educational practice questions. Never claim questions are authentic past exam questions.'},{role:'user',content:prompt}],temperature:0.45,response_format:{type:'json_object'}};
  }
  const response = await fetch(url,{method:'POST',headers,body:JSON.stringify(body),signal:AbortSignal.timeout(60000)});
  if (!response.ok) throw new Error(`${p.name} HTTP ${response.status}`);
  const data = await response.json();
  const text = p.name === 'gemini' ? data.candidates?.[0]?.content?.parts?.map(x=>x.text??'').join('') : data.choices?.[0]?.message?.content;
  if (!text) throw new Error(`${p.name} returned no generated content`);
  let parsed; try { parsed=JSON.parse(text); } catch { throw new Error(`${p.name} returned malformed JSON`); }
  return parsed.questions;
}

async function readProgress() {
  const counts = Object.fromEntries(floors.map(([s])=>[s,{authentic:0,generated:0}]));
  // Count canonical records line by line. Use the checkpoint as a fallback before
  // generated batches are folded into the canonical output by content:acquire.
  for (const file of await readdir(join(root,'output/questions')).catch(()=>[])) {
    if (!file.endsWith('.jsonl')) continue;
    const lines=createInterface({input:createReadStream(join(root,'output/questions',file),{encoding:'utf8'}),crlfDelay:Infinity});
    for await (const line of lines) if(line) { try { const q=JSON.parse(line); const subject=q.normalizedSubject??q.subject; if(Object.hasOwn(counts,subject)) counts[subject][q.source==='TUTOR_ME_ORIGINAL'?'generated':'authentic']++; } catch {} }
  }
  for(const [subject] of floors){let cp={};try{cp=JSON.parse(await readFile(join(checkpointDir,`${slug(subject)}-${exam.toLowerCase()}.json`),'utf8'));}catch{}counts[subject].generated=Math.max(counts[subject].generated,Number(cp.accepted)||0);}
  for(const [subject] of floors)counts[subject]=counts[subject].authentic+counts[subject].generated;
  return counts;
}

const available = providers();
if (!available.length) throw new Error('No configured generation provider key was found.');
const selected = String(args.subjects ?? '').split(',').map(s=>s.trim()).filter(Boolean);
const current = await readProgress();
const subjects = (selected.length ? floors.filter(([s])=>selected.includes(s)) : [...floors].sort((a,b)=>(current[a[0]]/a[1])-(current[b[0]]/b[1])));
await mkdir(outDir,{recursive:true}); await mkdir(checkpointDir,{recursive:true});
const outcomes=[];
for (const [subject,floor] of subjects) {
  const checkpointPath=join(checkpointDir,`${slug(subject)}-${exam.toLowerCase()}.json`);
  let cp={subject,exam,provider:null,batches:0,generated:0,accepted:0,rejected:0,status:'in_progress'};
  try { cp={...cp,...JSON.parse(await readFile(checkpointPath,'utf8'))}; } catch {}
  const target=Number(args.target ?? targets[subject] ?? floor);
  const output=join(outDir,`tutorme-original-${slug(subject)}-${exam.toLowerCase()}.jsonl`);
  for(let batch=0;batch<maxBatches && current[subject]<target;batch++) {
    const amount=Math.min(take,target-current[subject]);
    let generated, used;
    const usable=available.filter(p=>{
      const error=cp.providerErrors?.[p.name]??'';
      const retryAt=cp.providerRetryAfter?.[p.name] ?? (/HTTP 429/.test(error) && cp.updatedAt ? new Date(Date.parse(cp.updatedAt)+15*60*1000).toISOString() : '');
      const retryAfter=Date.parse(retryAt);
      const rateLimited=/HTTP 429/.test(error) && Number.isFinite(retryAfter) && retryAfter>Date.now();
      return !rateLimited && !/(?:HTTP (?:400|401|402|403|404|410)|authentication failed|billing)/i.test(error);
    });
    if(!usable.length){cp.status='provider_unavailable';cp.updatedAt=new Date().toISOString();await writeFile(checkpointPath,JSON.stringify(cp,null,2)+'\n');break;}
    const start=(cp.batches||0)%usable.length;
    let last;
    for(let i=0;i<usable.length;i++) { used=usable[(start+i)%usable.length]; try { generated=await request(used,subject,amount,`${subject}:${exam}:${cp.batches+1}`); break; } catch(e) { last=e; cp.providerErrors={...(cp.providerErrors??{}),[used.name]:String(e.message)}; if(/HTTP 429/.test(e.message))cp.providerRetryAfter={...(cp.providerRetryAfter??{}),[used.name]:new Date(Date.now()+15*60*1000).toISOString()}; } }
    if(!generated) { cp.status='provider_unavailable'; cp.lastError=String(last?.message??'no provider succeeded'); await writeFile(checkpointPath,JSON.stringify(cp,null,2)+'\n'); break; }
    const seen=new Set(); const rows=[]; let rejected=0;
    for(const q of Array.isArray(generated)?generated:[]) {
      const options=q?.options && typeof q.options==='object' ? Object.fromEntries(Object.entries(q.options).map(([k,v])=>[k.toLowerCase(),String(v??'').trim()])) : {};
      const answer=String(q?.correctAnswer??'').toLowerCase(); const prompt=String(q?.prompt??'').trim();
      const sig=hash(`${subject}|${prompt.toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ')}`);
      if(prompt.length<20 || Object.keys(options).length<4 || Object.values(options).some(x=>!x) || new Set(Object.values(options).map(x=>x.toLowerCase())).size!==Object.keys(options).length || !Object.hasOwn(options,answer) || !String(q?.topic??'').trim() || !String(q?.explanation??'').trim() || !Number.isInteger(q?.difficulty) || q.difficulty<1 || q.difficulty>5 || seen.has(sig)) { rejected++; continue; }
      seen.add(sig);
      const sourceId=`${used.name}:${sig}`;
      rows.push({id:sig.slice(0,32),source:'TUTOR_ME_ORIGINAL',sourceName:'TUTOR-ME Original AI-generated practice',sourceId,sourceUrl:null,prompt,question:prompt,options,correctAnswer:answer,explanation:q.explanation,subject,normalizedSubject:subject,exam,examType:exam,examYear:null,year:null,difficulty:q.difficulty,topic:q.topic,subtopic:q.subtopic??null,estimatedTime:null,contentType:'ORIGINAL_TUTOR_ME_GENERATED',rightsStatus:'TUTOR_ME_OWNED',rightsEvidence:'Original TUTOR-ME practice content generated for this product; pending human review.',verificationStatus:'pending',provenance:[{source:'TUTOR_ME_ORIGINAL',sourceName:'TUTOR-ME Original AI-generated practice',sourceId,provider:used.name,model:used.model,rightsStatus:'TUTOR_ME_OWNED',rightsEvidence:'Original generated practice content; not an official examination past question.'}],sourceMetadata:{generated:true,provider:used.name,model:used.model,originalFields:{topic:q.topic}},createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()});
    }
    if(rows.length) await writeFile(output,rows.map(JSON.stringify).join('\n')+'\n',{flag:'a'});
    cp.provider=used.name; cp.model=used.model; cp.batches++; cp.generated+=Array.isArray(generated)?generated.length:0; cp.accepted+=rows.length; cp.rejected+=rejected; current[subject]+=rows.length; cp.status=current[subject]>=target?'target_reached':'partial'; cp.updatedAt=new Date().toISOString();
    await writeFile(checkpointPath,JSON.stringify(cp,null,2)+'\n');
    if(rows.length===0) break;
  }
  outcomes.push({subject,status:cp.status,accepted:cp.accepted,rejected:cp.rejected,provider:cp.provider,checkpoint:checkpointPath});
}
console.log(JSON.stringify({exam,subjects:outcomes,checkpointDir},null,2));
