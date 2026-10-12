const fs=require('fs'),assert=require('assert/strict'),vm=require('vm'),{execFileSync}=require('child_process');
(async()=>{
 const h=fs.readFileSync('index.html','utf8'),before=execFileSync('git',['show','e697de5:index.html'],{cwd:process.cwd(),encoding:'utf8'});
 assert.equal(execFileSync('git',['diff','--name-only','--','convex'],{cwd:process.cwd(),encoding:'utf8'}).trim(),'');
 const start=h.indexOf('// Explicit, anonymous PostHog'),source=h.slice(start,h.indexOf('</script>',start));const requests=[];let active=0,maxActive=0;
 const context={window:{},location:{pathname:'/',host:'private-test',origin:'private-test'},sessionStorage:{getItem:()=>null,setItem:()=>{}},crypto:{randomUUID:()=> 'b68bdd6d-e9b7-4d19-bfa9-022734e17b13'},document:{addEventListener:()=>{}},console,fetch:async(url,options)=>{active++;maxActive=Math.max(maxActive,active);await new Promise(resolve=>setTimeout(resolve,1));requests.push({url,...options});active--;return {ok:true};},Date,Promise,Set};
 vm.runInNewContext(source,context);context.window.trackAnalytics('chat_name_given');context.window.trackAnalytics('quote_submitted');context.window.trackAnalytics('not_allowed');for(let attempt=0;attempt<100&&requests.length<5;attempt++)await new Promise(resolve=>setTimeout(resolve,10));
 assert.equal(maxActive,1);assert.deepEqual(requests.map(request=>JSON.parse(request.body).event),['$pageview','page_view','landing_opened','chat_name_given','quote_submitted']);let last=0;
 for(const request of requests){const body=JSON.parse(request.body);assert.deepEqual(Object.keys(body).sort(),['distinct_id','event','timestamp','token']);assert.equal(body.distinct_id,'b68bdd6d-e9b7-4d19-bfa9-022734e17b13');assert(Date.parse(body.timestamp)>last);last=Date.parse(body.timestamp);assert.equal(request.referrerPolicy,'no-referrer');assert.equal(request.credentials,'omit');assert(!request.body.includes('private-test'));}
 const quotePayload=text=>text.slice(text.indexOf('const created = await convex.action("quoteRequests:create"'),text.indexOf('            if (created.paused)'));
 assert.equal(quotePayload(h),quotePayload(before));
 for(const script of h.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))new Function(script[0].includes('type="module"')?script[1].replace(/^\s*import .*;$/gm,''):script[1]);
 assert(h.indexOf('window.trackAnalytics("quote_submitted")')>h.indexOf('if (created.paused)'));assert(h.indexOf('window.trackAnalytics("recheck_requested")')>h.indexOf('if(!inspectedFiles.length)'));assert(h.indexOf('window.trackAnalytics("chat_phone_given")')>h.indexOf('if (send.disabled) return;'));
 console.log('PASS: four-field payload only, anonymous tab ID, ordered delivery and timestamps, invalid events ignored, protected backend and quote payload unchanged, hooks follow validation, scripts parse.');
})().catch(error=>{console.error(error.stack);process.exitCode=1;});
