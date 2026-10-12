const {chromium}=require('C:/Users/purna/tools/pw-runtime/node_modules/playwright-core');
const fs=require('fs'),assert=require('assert/strict'),{execFileSync}=require('child_process');
const origin='https://earnest-rhinoceros-454.convex.site',preview=process.argv.includes('--preview');
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 try{
  const context=await browser.newContext();if(preview)await context.route(origin+'/**',route=>route.request().isNavigationRequest()?route.fulfill({contentType:'text/html',body:fs.readFileSync('index.html','utf8')}):route.continue());
  const page=await context.newPage(),requests=[],deliveries=[],failures=[];
  page.on('requestfailed',request=>{if(/posthog/.test(request.url()))failures.push(request.failure());});
  page.on('response',async response=>{
   const request=response.request();if(!/\.i\.posthog\.com/.test(request.url())||request.method()!=='POST')return;
   const body=request.postDataJSON();const properties=Object.keys(body.properties);assert(properties.every(key=>['distinct_id','$session_id','$process_person_profile','$geoip_disable','$host','$pathname','$current_url','flow_step','action'].includes(key)));
   assert.equal(request.url(),'https://us.i.posthog.com/i/v0/e/');assert.equal(body.properties.$process_person_profile,false);assert.equal(body.properties.$geoip_disable,true);assert(!request.headers().referer);assert(!JSON.stringify(body).includes('private-test'));
   requests.push({method:request.method(),url:request.url(),headers:await request.allHeaders(),body:request.postData(),status:response.status(),response:await response.text()});deliveries.push(body.event);
  });
  const response=await page.goto(origin+'/?private=private-test');const html=await response.text();assert(html.includes('const host = "https://us.i.posthog.com"'));assert(html.includes('phc_skRFPynyYytWpf4nBDLdzs9VDPPYa4vqo6FrpYkXT9NR'));
  await page.waitForFunction(()=>typeof window.trackAnalytics==='function');
  await page.waitForTimeout(4000);assert.equal(deliveries.filter(event=>event==='page_view').length,1);assert.equal(deliveries.filter(event=>event==='$pageview').length,1);assert.equal(deliveries.filter(event=>event==='landing_opened').length,1);assert.equal(failures.length,0);
  assert(requests.every(request=>request.status===200&&JSON.parse(request.response).status==='Ok'&&!JSON.parse(request.response).quota_limited?.length));
  const proof=requests.find(request=>JSON.parse(request.body).event==='page_view');
  const raw=['POST '+new URL(proof.url).pathname+' HTTP/1.1','Host: us.i.posthog.com',...Object.entries(proof.headers).filter(([key])=>!key.startsWith(':')&&key!=='host').map(([key,value])=>key+': '+value),'',proof.body,'','HTTP status: '+proof.status,'Response body: '+proof.response].join('\n');
  const prefix=preview?'posthog-fix-preview':'posthog-fix-live';fs.writeFileSync('scripts/'+prefix+'.json',JSON.stringify({live:!preview,liveUrl:origin,events:deliveries,allAccepted:true,noPersonalFields:true,proof},null,2));fs.writeFileSync('scripts/'+prefix+'-request.txt',raw);console.log(raw);
 }finally{await browser.close();}
})().catch(error=>{console.error(error.stack);process.exitCode=1;});
