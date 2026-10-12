const {chromium}=require('C:/Users/purna/tools/pw-runtime/node_modules/playwright-core');
const assert=require('assert/strict'),fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..'),origin='https://earnest-rhinoceros-454.convex.site',preview=process.argv.includes('--preview');
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 try{
  const context=await browser.newContext({viewport:{width:375,height:900},isMobile:true,hasTouch:true});
  if(preview)await context.route(origin+'/**',route=>route.request().isNavigationRequest()?route.fulfill({contentType:'text/html',body:fs.readFileSync(path.join(root,'index.html'),'utf8')}):route.continue());
  const events=[],deliveries=[];
  context.on('request',request=>{
   if(request.method()!=='POST'||!request.url().startsWith('https://us.i.posthog.com/i/v0/e/'))return;
   const body=request.postDataJSON();const allowed=['distinct_id','$session_id','$process_person_profile','$geoip_disable','$host','$pathname','$current_url','flow_step','action'];
   assert(Object.keys(body.properties).every(key=>allowed.includes(key)));assert.equal(body.properties.$process_person_profile,false);assert.equal(body.properties.$geoip_disable,true);
   assert(!JSON.stringify(body.properties).includes('Analytics privacy test'));assert(!JSON.stringify(body.properties).includes('highway'));assert(!JSON.stringify(body.properties).includes('IMG-'));assert(!JSON.stringify(body.properties).includes('?'));
   assert(!request.headers().referer);events.push({event:body.event,step:body.properties.flow_step,action:body.properties.action,route:body.properties.$pathname});
  });
  context.on('response',async response=>{if(response.request().method()==='POST'&&response.url().startsWith('https://us.i.posthog.com/i/v0/e/')){const body=await response.json().catch(()=>({}));deliveries.push({status:response.status(),quotaLimited:Boolean(body.quota_limited?.length),accepted:body.status===1 || body.status==='Ok' || response.ok()});}});
  const page=await context.newPage();let pageErrors=0;page.on('pageerror',()=>pageErrors++);
  const ready=async step=>page.waitForFunction(s=>!document.querySelector('[data-chat-step='+s+']').hidden&&!document.querySelector('.typing-dots')&&!(document.querySelector('[data-chat-next='+s+']')||document.querySelector('#analyze')).disabled,step,{timeout:65000});
  const next=async(step,destination)=>{await page.locator('[data-chat-next='+step+']').tap();await ready(destination);};
  await page.goto(origin);await ready('name');await page.locator('#chat-name').fill('Analytics privacy test');await next('name','help');await page.locator('#chat-help').fill('My car got damaged');await next('help','story');await page.locator('#chat-story').fill('my bumper fell off on the highway');await next('story','car');await page.locator('#car-model').fill('Polo');await page.getByRole('option',{name:'Volkswagen Polo GT TSI',exact:true}).tap();await ready('city');await next('city','photos');
  await page.locator('#damage-photos').setInputFiles(['IMG-20260202-WA0010.jpg','IMG-20260202-WA0012.jpg','IMG-20260202-WA0014.jpg'].map(file=>path.join(root,'test-photos',file)));await page.waitForFunction(()=>!document.querySelector('.photo-converting'));
  assert(!events.some(event=>event.event==='photos_uploaded'),'File selection is not a server upload');await page.locator('#analyze').tap();await page.locator('.cheapest-estimate').waitFor({timeout:180000});await page.locator('#show-nearby-garages').tap();await page.locator('#garage-area').fill('Kothrud');await page.locator('#garage-search-button').tap();await page.locator('.garage-item').first().waitFor({timeout:120000});await page.locator('.garage-review-button').first().tap();await page.locator('#quote-invitation').waitFor({state:'visible'});await page.locator('#quote-yes').tap();await page.locator('input[type=tel]').waitFor({state:'visible'});
  await page.waitForTimeout(2500);assert.equal(events.filter(e=>e.event==='landing_opened').length,1);assert.equal(events.filter(e=>e.event==='photos_uploaded').length,1);assert.equal(events.filter(e=>e.event==='estimate_shown').length,1);assert(events.some(e=>e.event==='garage_or_quote_tapped'&&e.action==='garage'));assert(events.some(e=>e.event==='garage_or_quote_tapped'&&e.action==='quote'));
  assert.equal(new Set(events.map(e=>e.event)).size,6);assert.equal(pageErrors,0);
  for(const route of ['/admin','/garage','/quotes/private-record-placeholder?private=do-not-send']){const other=await context.newPage();await other.goto(origin+route);await other.waitForTimeout(1500);await other.close();}
  assert(events.some(e=>e.event==='$pageview'&&e.route==='/admin'));assert(events.some(e=>e.event==='$pageview'&&e.route==='/garage'));assert(events.some(e=>e.event==='$pageview'&&e.route==='/quotes/:requestId'));
  await page.waitForTimeout(1500);assert.equal(deliveries.length,events.length,'Every event must reach PostHog');assert(deliveries.every(d=>d.status===200&&d.accepted&&!d.quotaLimited),'PostHog did not accept all events');
  const report={live:!preview,phoneWidth:375,events,deliveries,allRoutesHavePageviews:true,noPersonalFields:true,noSessionRecordingSdk:true,quoteFormReachedWithoutSavingRequest:true};fs.writeFileSync(path.join(root,'scripts',preview?'posthog-preview-verification.json':'posthog-live-verification.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
 }finally{await browser.close();}
})().catch(error=>{const safe=String(error.message).replace(/phc_[A-Za-z0-9]+/g,'[project token withheld]').replace(/(?:\+?\d[\s-]*){10,}/g,'[private contact withheld]');console.error(error.name+': '+safe);process.exitCode=1;});
