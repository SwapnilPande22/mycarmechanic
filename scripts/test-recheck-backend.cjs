const assert=require('assert/strict'),fs=require('fs'),vm=require('vm'),{stripTypeScriptTypes}=require('node:module');
const source=stripTypeScriptTypes(fs.readFileSync('convex/panels.ts','utf8')).replace(/^import .*;\s*$/gm,'').replace(/export const (\w+) =/g,'exports.$1 =');
const internal={inspections:{get:'get',save:'save',recordChoice:'choice'},bills:{consumeHourlyCall:'limit'},priceEstimates:{estimateAll:'prices'}};
const validators=new Proxy({}, {get:()=>()=>null});
const exported={};let calls=0;const prompts=[];const records=new Map();
const sandbox={exports:exported,action:value=>value,v:validators,internal,crypto:globalThis.crypto,TextEncoder,process:{env:{OPENAI_API_KEY:'unused-in-mocked-fetch'}},console:{error:()=>{}},fetch:async(_url,options)=>{
  calls++;const body=JSON.parse(options.body),text=body.input[0].content[0].text;prompts.push(text);
  return {ok:true,json:async()=>({output:[{content:[{type:'output_text',text:JSON.stringify({isCarPhoto:true,modelConfidence:'high',modelMatchesSelected:'same',detectedModel:'Volkswagen Polo',checklist:[{panel:'front_bumper',status:'damaged',confidence:'high',reason:calls===1?'Original visible damage':'Reassessed visible damage',repairType:'denting_painting'}]})}]}]})};
}};
vm.runInNewContext(source,sandbox);
const photo=fs.readFileSync('test-photos/IMG-20260202-WA0010.jpg');
const ctx={storage:{get:async()=>new Blob([photo],{type:'image/jpeg'}),getUrl:async()=> 'https://example.invalid/photo',delete:async()=>{}},runQuery:async(_ref,{cacheKey})=>records.get(cacheKey)||null,runMutation:async(ref,args)=>{if(ref==='limit')return true;if(ref==='save'){if(!records.has(args.cacheKey))records.set(args.cacheKey,args.result);return records.get(args.cacheKey);}},runAction:async(_ref,args)=>({estimates:args.items.map(item=>({...item,low:3000,high:5000}))})};
const args={storageIds:['temporary'],mimeTypes:['image/jpeg'],sizes:[photo.length],dimensions:[{width:1600,height:1200}],selectedModel:'Volkswagen Polo GT TSI',variant:'GT TSI',city:'Pune',carSize:'small'};
(async()=>{
 const original=await exported.analyzeDamage.handler(ctx,args);assert.equal(calls,1);
 assert.equal(await exported.analyzeDamage.handler(ctx,args),original);assert.equal(calls,1);
 const concern="I don't think this part is damaged";
 const revised=await exported.analyzeDamage.handler(ctx,{...args,recheckConcern:concern});assert.equal(calls,2);assert.equal(revised.isRecheck,true);assert.equal(revised.recheckConcern,concern);assert.equal(revised.photoHash,original.photoHash);assert.notEqual(revised,original);assert(prompts[1].includes(JSON.stringify(concern)));assert(!prompts[0].includes('This is a recheck'));
 assert.equal(await exported.analyzeDamage.handler(ctx,{...args,recheckConcern:concern}),revised);assert.equal(calls,2);
 await exported.analyzeDamage.handler(ctx,{...args,recheckConcern:'Please re-examine the scratches on the front bumper.'});assert.equal(calls,3);
 assert.equal(await exported.analyzeDamage.handler(ctx,args),original);assert.equal(calls,3);
 assert.equal(Array.from(records.keys()).filter(key=>JSON.parse(key)[0]==='inspection-v2').length,1);
 assert.equal(Array.from(records.keys()).filter(key=>JSON.parse(key)[0]==='inspection-recheck-v1').length,2);
 await assert.rejects(()=>exported.analyzeDamage.handler(ctx,{...args,recheckConcern:' '}));
 console.log('PASS: ordinary photo cache unchanged; fresh concern reaches vision prompt; separate concern-specific rechecks; cached rechecks isolated; blank concern rejected.');
})().catch(()=>{console.error('Backend recheck test failed; private output suppressed.');process.exitCode=1;});
