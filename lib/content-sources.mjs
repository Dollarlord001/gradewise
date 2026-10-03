async function getJson(url,headers,label) {
  for(let attempt=0;attempt<3;attempt++) {
    try {
      const response=await fetch(url,{headers,signal:AbortSignal.timeout(20000)});
      if(response.ok)return {response,body:await response.json()};
      if([400,401,403,404,405,406,422].includes(response.status))throw new Error(`${label} rejected the request (HTTP ${response.status}); review filters, credentials, and access rights.`);
      if(response.status!==429&&response.status<500)throw new Error(`${label} failed (HTTP ${response.status}).`);
      if(attempt===2)throw new Error(`${label} transient failure after bounded retries (HTTP ${response.status}).`);
      const retryAfter=Number(response.headers.get('retry-after'));
      await new Promise(resolve=>setTimeout(resolve,Number.isFinite(retryAfter)&&retryAfter>0?Math.min(30000,retryAfter*1000):1000*2**attempt));
    } catch(error) {
      if(/rejected the request|failed \(HTTP|after bounded retries/.test(error.message)||attempt===2)throw error;
      await new Promise(resolve=>setTimeout(resolve,1000*2**attempt));
    }
  }
}

export class QuestionSourceAdapter {
  async fetchQuestions() { throw new Error('QuestionSourceAdapter.fetchQuestions must be implemented'); }
}

export class ALOCQuestionSource extends QuestionSourceAdapter {
  async fetchPage({subject,exam='jamb',year,limit=15,cursor}) {
    const key=process.env.ALOC_API_KEY;
    if(!key)throw new Error('ALOC_API_KEY is not configured.');
    if(!subject&&!year&&!exam)throw new Error('ALOC Station import requires at least one filter.');
    const url=new URL('https://dev.aloc.com.ng/api/v1/questions');
    if(subject)url.searchParams.set('subject',subject.toLowerCase());
    if(exam)url.searchParams.set('examType',String(exam).toLowerCase()==='utme'?'jamb':String(exam).toLowerCase());
    if(year)url.searchParams.set('year',String(year));
    url.searchParams.set('country','NG');url.searchParams.set('limit',String(Math.min(15,Math.max(1,Number(limit)||15))));
    if(cursor)url.searchParams.set('cursor',String(cursor));
    const {response,body}=await getJson(url,{ 'X-API-Key':key,Accept:'application/json' },'ALOC Station API');
    const payload=Array.isArray(body.data)?body.data:body.data?[body.data]:[];
    const questions=payload.map(q=>({source:'ALOC',sourceName:'ALOC Station',sourceUrl:url.origin+url.pathname,sourceId:String(q.id??''),exam:({utme:'JAMB',jamb:'JAMB',waec:'WAEC',wassce:'WAEC',neco:'NECO'})[String(q.examType??exam).toLowerCase()]??String(q.examType??exam).toUpperCase(),year:q.year??null,subject:q.subject??subject,prompt:q.text??q.question??q.questionHtml,correctAnswer:q.correctAnswer??q.answer,explanation:q.explanation??null,options:q.options,passage:q.section??null,sourceMetadata:q,rightsStatus:'USER_PROVIDED_AUTHORIZED',rightsEvidence:'User-provided authorization in the TUTOR-ME acquisition instructions.'}));
    return {questions,nextCursor:body.pagination?.nextCursor??null,hasMore:Boolean(body.pagination?.hasMore),creditsUsed:Number(response.headers.get('x-credits-used'))||Number(body.meta?.creditsUsed)||1,creditsRemaining:Number(response.headers.get('x-credits-remaining'))||null,rateLimitRemaining:Number(response.headers.get('x-ratelimit-remaining'))||null};
  }
  async fetchQuestions(options) { return (await this.fetchPage(options)).questions; }
}

export class SdashQuestionSource extends QuestionSourceAdapter {
  async fetchBatch({subject,exam='utme',year,limit=50}) {
    const key=process.env.SDASH_ACCESS_TOKEN||process.env.SDASH_API_KEY;
    if(!key)throw new Error('Set SDASH_ACCESS_TOKEN or SDASH_API_KEY.');
    const url=new URL('https://sdashapi.com/api/v1/q');url.searchParams.set('type',String(exam).toLowerCase());url.searchParams.set('limit',String(Math.min(50,Math.max(1,Number(limit)||50))));
    if(subject)url.searchParams.set('subject',subject.toLowerCase());if(year)url.searchParams.set('year',String(year));
    const {response,body}=await getJson(url,{AccessToken:key,Accept:'application/json'},'SdashAPI');
    const payload=Array.isArray(body.data)?body.data:body.data?[body.data]:[];
    const questions=payload.map(q=>({source:'SDASH',sourceName:'SdashAPI',sourceUrl:url.origin+url.pathname,sourceId:q.id==null?'':String(q.id),exam:({utme:'JAMB',jamb:'JAMB',wassce:'WAEC',waec:'WAEC',neco:'NECO'})[String(q.examtype??exam).toLowerCase()]??String(q.examtype??exam).toUpperCase(),year:q.examyear??q.year??year??null,subject:q.subject??subject,questionNumber:q.questionNumber??null,prompt:q.question,correctAnswer:q.answer,explanation:q.solution??null,topic:q.metadata?.topic??null,subtopic:q.metadata?.subtopic??null,options:q.option,passage:q.section??q.metadata?.passage??null,images:q.image?[q.image]:[],sourceMetadata:q,rightsStatus:'USER_PROVIDED_AUTHORIZED',rightsEvidence:'User-provided authorization in the TUTOR-ME acquisition instructions.'}));
    return {questions,creditsUsed:Number(response.headers.get('x-credits-used'))||1,rateLimitRemaining:Number(response.headers.get('x-ratelimit-remaining'))||null,paginationSupported:false};
  }
  async fetchQuestions(options) { return (await this.fetchBatch(options)).questions; }
}
