// Local benchmark only. Runs unchanged app handlers against memory, never live mutations.
const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto'),assert=require('assert/strict'),{execFileSync}=require('child_process'),{stripTypeScriptTypes}=require('node:module');
const root=path.resolve(__dirname,'..'),out=path.join(root,'scripts/model-comparison');fs.mkdirSync(out,{recursive:true});
const ts=file=>stripTypeScriptTypes(fs.readFileSync(path.join(root,file),'utf8')).replace(/^import .*;\s*$/gm,'').replace(/export const (\w+) =/g,'exports.$1 =').replace(/export function /g,'function ');
const rates={'gpt-4.1':{input:2,cached:0.5,output:8},'gpt-6-astra':{input:10,cached:1,write:12.5,output:50},'gpt-4.1-mini':{input:0.4,cached:0.1,output:1.6}};
const cost=(usage,model)=>{const r=rates[model],cached=usage.input_tokens_details?.cached_tokens||0,writes=usage.input_tokens_details?.cache_write_tokens||0;return ((usage.input_tokens-cached-writes)*r.input+cached*r.cached+writes*(r.write||r.input)+usage.output_tokens*r.output)/1e6;};
const digest=x=>crypto.createHash('sha256').update(x).digest('hex');
(async()=>{
 const key=execFileSync(process.execPath,['node_modules/convex/bin/main.js','env','get','OPENAI_API_KEY','--prod'],{cwd:root,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
 const available=await(await fetch('https://api.openai.com/v1/models',{headers:{Authorization:'Bearer '+key}})).json();assert(available.data.some(m=>m.id==='gpt-6-astra'));
 const cases=[{id:'detached-polo',file:'TEST-detached-Polo.jpg',car:'Volkswagen Polo GT TSI',variant:'GT TSI',size:'small'}];
 if(process.argv.includes('--three'))cases.push({id:'polo-side',file:'IMG-20260202-WA0012.jpg',car:'Volkswagen Polo GT TSI',variant:'GT TSI',size:'small'},{id:'polo-front-angle',file:'IMG-20260202-WA0014.jpg',car:'Volkswagen Polo GT TSI',variant:'GT TSI',size:'small'});
 const sourceFiles=['convex/panels.ts','convex/repairPlan.ts','convex/priceEstimates.ts','index.html','quick-entry.js'];const before=Object.fromEntries(sourceFiles.map(f=>[f,digest(fs.readFileSync(path.join(root,f)))]));
 for(const c of cases){const bytes=fs.readFileSync(path.join(root,'test-photos',c.file));let instructionHash;
  for(const model of ['gpt-4.1','gpt-6-astra']){
   const resultFile=path.join(out,c.id+'-'+model+'.json');if(fs.existsSync(resultFile)){console.log('Existing completed result: '+c.id+' '+model);continue;}
   const calls=[],memory=new Map(),v=new Proxy({}, {get:()=>()=>null}),internal={inspections:{get:'get',save:'save'},bills:{consumeHourlyCall:'limit'},priceEstimates:{estimateAll:'price'}};
   const sandbox={exports:{},v,internal,action:x=>x,internalAction:x=>x,crypto:globalThis.crypto,TextEncoder,process:{env:{OPENAI_API_KEY:key}},console:{error:()=>{}},fetch:async(url,options)=>{
    const body=JSON.parse(options.body),originalModel=body.model;
    if(originalModel==='gpt-4.1'){body.model=model;if(model==='gpt-6-astra'){delete body.temperature;body.reasoning={effort:'medium'};}
     const hash=digest(body.input[0].content[0].text);if(instructionHash)assert.equal(hash,instructionHash);else instructionHash=hash;
    }
    body.store=false;body.service_tier='default';const started=Date.now();const response=await fetch(url,{...options,body:JSON.stringify(body),signal:AbortSignal.timeout(240000)});const payload=await response.json();
    if(!response.ok)throw Error('OpenAI '+body.model+' HTTP '+response.status+': '+(payload.error?.message||'Request failed'));
    if(payload.status==='incomplete')throw Error('Incomplete '+body.model+' answer: '+JSON.stringify(payload.incomplete_details));
    const text=payload.output?.flatMap(item=>item.content||[]).find(item=>item.type==='output_text')?.text;calls.push({model:body.model,responseModel:payload.model,status:payload.status,settings:{temperature:body.temperature,reasoning:body.reasoning,max_output_tokens:body.max_output_tokens,imageDetail:body.input[0].content.find(item=>item.type==='input_image')?.detail,format:body.text.format.type},instructionSha256:digest(body.input[0].content[0].text),usage:payload.usage,costUsd:cost(payload.usage,body.model),elapsedMs:Date.now()-started,answer:JSON.parse(text)});
    return {ok:true,json:async()=>payload};
   }};
   vm.createContext(sandbox);vm.runInContext(ts('convex/repairPlan.ts')+'\nObject.assign(globalThis,{normalizeFinding,mergeFindings,pricingItemsFor});',sandbox);Object.assign(sandbox,sandbox.exports);vm.runInContext(ts('convex/priceEstimates.ts'),sandbox);const pricing=sandbox.exports.estimateAll;vm.runInContext(ts('convex/panels.ts'),sandbox);const inspection=sandbox.exports.analyzeDamage;
   const ctx={storage:{get:async()=>new Blob([bytes],{type:'image/jpeg'}),getUrl:async()=> 'data:image/jpeg;base64,'+bytes.toString('base64'),delete:async()=>{}},runQuery:async(_ref,args)=>memory.get(args.cacheKey)||null,runMutation:async(ref,args)=>{if(ref==='limit')return true;if(ref==='save'){memory.set(args.cacheKey,args.result);return args.result;}throw Error('Unexpected mutation blocked');},runAction:async(ref,args)=>{assert.equal(ref,'price');return pricing.handler({},args);}};
   console.log('Running '+c.id+' '+model+' with unchanged inspection/pricing instructions.');
   const result=await inspection.handler(ctx,{storageIds:['TEST-local-only'],mimeTypes:['image/jpeg'],sizes:[bytes.length],dimensions:[{width:1600,height:1200}],selectedModel:c.car,variant:c.variant,city:'Pune',carSize:c.size});
   const priced=result.panels.map(p=>{const price=result.estimates.find(e=>e.panel===p.panel&&e.repairType===p.repairType);return {panel:p.panel,repairType:p.repairType,cheapestFix:p.cheapestFix,reason:p.reason,low:price?.low,high:price?.high,replacementCondition:p.replacementCondition};});
   const report={case:c.id,file:c.file,photoSha256:digest(bytes),model,car:c.car,city:'Pune',calls,result,parts:priced,totalLow:priced.reduce((n,p)=>n+(p.low||0),0),totalHigh:priced.reduce((n,p)=>n+(p.high||0),0),totalCostUsd:calls.reduce((n,r)=>n+r.costUsd,0)};
   fs.writeFileSync(resultFile,JSON.stringify(report,null,2));console.log(JSON.stringify({case:c.id,model,parts:priced,total:[report.totalLow,report.totalHigh],costs:calls.map(r=>({model:r.model,cost:r.costUsd,usage:r.usage})),totalCostUsd:report.totalCostUsd}));
  }
 }
 for(const f of sourceFiles)assert.equal(digest(fs.readFileSync(path.join(root,f))),before[f],f+' changed');console.log('PASS: app source unchanged; no live database writes, uploads or deployment.');
})().catch(e=>{console.error(e.message);process.exitCode=1});
