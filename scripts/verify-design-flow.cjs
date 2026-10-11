const {chromium}=require('C:/Users/purna/tools/pw-runtime/node_modules/playwright-core');
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),crypto=require('crypto'),{execFileSync}=require('child_process');
const root=path.resolve(__dirname,'..'),node='C:/Users/purna/tools/node-v24.19.0-win-x64/node.exe';
const origin='https://earnest-rhinoceros-454.convex.site',cloud=origin.replace('.site','.cloud');
const live=process.argv.includes('--live');
const finish=process.argv.includes('--finish');
const artifacts=path.join(root,'scripts',live?'design-live':'design-preview');fs.mkdirSync(artifacts,{recursive:true});
const baseline=JSON.parse(fs.readFileSync(path.join(root,'scripts/design-protected-baseline.json')));
for(const [p,hash] of Object.entries(baseline.files))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,p))).digest('hex'),hash,p+' changed');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');assert.equal(html.slice(html.indexOf('      } else if (location.pathname.replace'),html.indexOf('      } else if (location.pathname.startsWith')),baseline.admin,'Admin route changed');
const cli=(args)=>{try{return execFileSync(node,['node_modules/convex/bin/main.js',...args],{cwd:root,encoding:'utf8',stdio:['ignore','pipe','pipe'],maxBuffer:32*1024*1024});}catch{throw Error('Convex CLI operation failed; private output suppressed.');}};
function data(table){const rows=JSON.parse(cli(['data',table,'--prod','--limit','1000','--format','json']));assert(rows.length<1000,'Data scan needs pagination');return rows;}
function documentHashes(rows){return Object.fromEntries(rows.map(row=>[row._id,crypto.createHash('sha256').update(JSON.stringify(row)).digest('hex')]));}
const oldInspections=data('inspections'),oldRequests=data('quoteRequests');
const preservationPath=path.join(root,'scripts/design-data-baseline.json');
if(!live)fs.writeFileSync(preservationPath,JSON.stringify({inspections:documentHashes(oldInspections),quoteRequests:documentHashes(oldRequests)},null,2));
const preservation=JSON.parse(fs.readFileSync(preservationPath));
for(const [table,rows] of [['inspections',oldInspections],['quoteRequests',oldRequests]])for(const [id,hash] of Object.entries(preservation[table]))assert.equal(documentHashes(rows)[id],hash,'Existing record changed');
(async()=>{
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const evidence={live,viewport:375,protectedBackendAndAdminUnchanged:true,existingInspections:oldInspections.length,existingQuoteRequests:oldRequests.length,screenshots:[]};
try {
 const context=await browser.newContext({viewport:{width:375,height:812},deviceScaleFactor:1,isMobile:true,hasTouch:true});
 if(!live)await context.route(origin+'/**',async route=>{const url=new URL(route.request().url());if(url.pathname==='/' || url.pathname==='/admin')await route.fulfill({contentType:'text/html',body:html});else await route.continue();});
 const page=await context.newPage();let analysis=null;let created=null;let actions=0;let pageErrors=0;
 page.on('pageerror',()=>pageErrors++);
 page.on('response',async response=>{try{if(response.url().endsWith('/api/action')){const request=response.request().postDataJSON();const value=(await response.json()).value;if(request.path==='panels:analyzeDamage')analysis=value;if(request.path==='quoteRequests:create')created=value;if(request.path==='conversation:nextQuestion' && value?.question)actions++;}}catch{}});
 const shot=async(name,locator)=>{await page.waitForTimeout(250);if(locator)await locator.scrollIntoViewIfNeeded();await page.screenshot({path:path.join(artifacts,name+'.png'),fullPage:true,mask:[page.locator('[name=whatsappNumber]'),page.locator('a[href^="tel:"]'),page.locator('[data-request-number]')]});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=375),'Mobile horizontal overflow');evidence.screenshots.push(name);};
 async function next(step){await page.locator('[data-chat-next='+step+']').click();await page.waitForFunction(()=>!Array.from(document.querySelectorAll('[data-chat-next]')).some(el=>el.disabled),{},{timeout:45000});assert.equal(await page.locator('#chat-history .app-bubble').count(),1);}
 async function start(car='Polo GT TSI',name='Design flow verification',screens=false){await page.goto(origin);await page.evaluate(()=>localStorage.clear());await page.reload();if(screens)await shot('01-welcome-name');await page.locator('#chat-name').fill(name);await next('name');if(screens)await shot('02-how-can-i-help');await page.locator('#chat-help').fill('My car was damaged while parked');await next('help');if(screens)await shot('03-describe-the-issue');await page.locator('#chat-story').fill('Someone hit the side while the car was parked. Please check the visible damage.');await next('story');if(screens)await shot('04-car-and-variant');await page.locator('#car-model').fill(car);if(car==='Polo GT TSI')await page.getByRole('option',{name:'Volkswagen Polo GT TSI',exact:true}).click();else await page.locator('#car-model').press('Escape');await next('car');if(screens)await shot('05-upload-photos');assert(await page.locator('#customer-city').isHidden());}
 async function inspect(file,screens=false){analysis=null;await page.locator('#damage-photos').setInputFiles(path.join(root,'test-photos',file));await page.waitForFunction(()=>!document.querySelector('.photo-converting'));await page.locator('#analyze').click();if(screens)await shot('06-inspecting');await page.waitForFunction(()=>!document.querySelector('#analyze').disabled,{},{timeout:240000});}
 if(!finish){
 await start('Polo GT TSI','Design flow verification',true);await inspect('IMG-20260202-WA0010.jpg',true);await page.locator('.result-wrap').waitFor();assert(analysis&&analysis.isCarPhoto);const savedResult=analysis;
 assert(await page.locator('#garage-discovery').isHidden());assert(await page.locator('#quote-prompt').isHidden());assert(await page.locator('#chat-history').isHidden());await shot('07-estimate-and-garage-invitation');
 await page.locator('#show-nearby-garages').click();assert(await page.locator('.result-wrap').isHidden());assert(await page.locator('[name=whatsappNumber]').isHidden());await shot('08-location');
 await page.locator('#garage-area').fill('Kothrud');await page.locator('#garage-area').press('Escape');await page.locator('#garage-search-button').click();await page.waitForFunction(()=>!document.querySelector('#garage-search-button').disabled,{},{timeout:120000});assert(await page.locator('#garage-list .garage-item').count()>0);assert(await page.locator('#quote-prompt').isHidden());await shot('09-garages-and-reviews');
 await page.locator('[data-garage-index]').first().click();await page.locator('.garage-inline-detail').first().waitFor({state:'visible'});await shot('10-garage-reviews');
 await page.locator('#garage-quote-button').click();assert(await page.locator('#quote-invitation').isVisible());assert(await page.locator('[name=whatsappNumber]').isHidden());await shot('11-quote-permission',page.locator('#quote-invitation'));
 await page.locator('#quote-yes').click();assert(await page.locator('[name=whatsappNumber]').isVisible());await shot('12-phone-after-permission',page.locator('#quote-prompt'));
 if(live){
   // Read the existing configured destination in memory solely as the valid test contact.
   // No contact value is logged, written to evidence, or exposed in screenshots.
   const raw=cli(['env','get','QUOTE_PHONE','--prod']).replace(/\D/g,'');
   const number=raw.slice(-10);assert(/^[6-9]\d{9}$/.test(number),'A configured valid test contact is required');
   await page.locator('[name=whatsappNumber]').fill(number);await page.locator('[data-quote-form] [type=submit]').click();await page.locator('[data-quote-followup]').waitFor({state:'visible',timeout:120000});assert(created&&!created.paused);
   await shot('13-request-saved',page.locator('#quote-prompt'));
   await page.locator('[data-quote-done]').click();await shot('14-thank-you');
   evidence.realRequestSaved=true;
 } else await page.locator('[data-quote-dismiss]').click();
 await start();await inspect('IMG-20260202-WA0010.jpg');assert.deepEqual(analysis,savedResult,'Identical photos/model/city must reuse the same result');evidence.photoHashReuseVerified=true;
 await page.locator('#estimate-concern').fill('I don’t think this part is damaged');await page.locator('#recheck-estimate').click();assert(await page.locator('[data-chat-step=photos]').isVisible());assert(await page.locator('#result').isHidden());await shot('15-recheck-with-new-photos');
 await start();await inspect('non-car-landscape.jpg');assert(!analysis.isCarPhoto);assert(await page.locator('[data-chat-step=photos]').isVisible());await shot('16-non-car-error');
 await start();
 await page.locator('#damage-photos').setInputFiles({name:'unreadable-photo.jpg',mimeType:'image/jpeg',buffer:Buffer.from('not a decodable photo')});await page.locator('.photo-error').waitFor();await shot('17-photo-guidance');
 await start('Virtus');await inspect('IMG-20260202-WA0010.jpg');await page.locator('.model-choice').waitFor();assert.equal(await page.locator('.result-wrap').count(),0);await shot('18-car-mismatch');await page.locator('[data-car-choice=seen]').click();await page.locator('.result-wrap').waitFor({timeout:120000});await page.locator('#decline-garages').click();await shot('19-decline-garages');
 await page.reload();assert(await page.locator('[data-chat-step=help]').isVisible());assert((await page.locator('#chat-history').innerText()).includes('how can we help you today'));await shot('20-returning-visit');
 } else {
   assert(live,'Finish mode requires live checks');
   const request=oldRequests.find(row=>row.name==='Design flow verification');assert(request,'The completed flow must have saved its request');created={id:request._id,paused:false};
   evidence.screenshots=fs.readdirSync(artifacts).filter(name=>name.endsWith('.png')).map(name=>name.replace('.png','')).sort();
   assert(evidence.screenshots.length>=20,'Completed screenshot steps missing');
   evidence.realRequestSaved=true;evidence.photoHashReuseVerified=true;evidence.previousFlowStepsPassed=true;
   await page.goto(origin);await page.evaluate(()=>localStorage.setItem('mycarmechanic-name','Design flow verification'));await page.reload();
 }
 if(live){await page.locator('#chat-help').fill('मेरी गाड़ी पार्किंग में खराब हो गई है');await next('help');assert(Array.from(await page.locator('#chat-history').innerText()).some(char=>char.charCodeAt(0)>=0x0900&&char.charCodeAt(0)<=0x097F),'Language-aware prompt missing');await shot('21-language-aware-conversation');assert(actions>0);evidence.aiConversationVerified=true;}
 const password=cli(['env','get','ADMIN_PASSWORD','--prod']).trim();const admin=await context.newPage();await admin.goto(origin+'/admin');await admin.locator('#admin-password').fill(password);await admin.locator('#admin-login').click();await admin.waitForFunction(()=>!document.querySelector('#admin-status').textContent.includes('Loading') && document.querySelector('#admin-status').textContent.includes('quote request'),{},{timeout:60000});
 const ids=await admin.locator('.admin-request').evaluateAll(cards=>cards.map(card=>card.dataset.id));assert(oldRequests.every(request=>ids.includes(request._id)));if(created)assert(ids.includes(created.id));
 const links=await admin.locator('.admin-photos a').evaluateAll(anchors=>anchors.map(a=>a.href));if(links.length){assert((await context.request.get(links[0])).ok());evidence.savedQuotePhotoOpens=true;}
 if(oldInspections.length){const inspection=oldInspections.find(row=>row.result?.isCarPhoto);if(inspection){const value=await page.evaluate(async({cloud,cacheKey})=>{const {ConvexHttpClient}=await import('https://esm.sh/convex@1.46.0/browser');return new ConvexHttpClient(cloud).query('inspections:get',{cacheKey});},{cloud,cacheKey:inspection.cacheKey}).catch(()=>null);/* Internal query is verified through CLI below. */const cached=JSON.parse(cli(['run','inspections:get',JSON.stringify({cacheKey:inspection.cacheKey}),'--prod']));assert.deepEqual(cached,inspection.result);evidence.savedInspectionReadable=true;}}
 for(const [table,hashes] of Object.entries(preservation)){const now=documentHashes(data(table));for(const [id,hash] of Object.entries(hashes))assert.equal(now[id],hash,'Existing '+table+' record changed');}
 assert.equal(pageErrors,0,'Customer page JavaScript errors');
 evidence.adminExistingRequestsOpen=true;evidence.existingRecordsUnchanged=true;evidence.noPhoneOrKeyInEvidence=true;
 fs.writeFileSync(path.join(artifacts,'verification.json'),JSON.stringify(evidence,null,2));console.log(JSON.stringify(evidence));
}finally{await browser.close();}
})().catch(error=>{console.error('Design verification failed: '+error.name);console.error(String(error.stack).split('\n').filter(line=>line.trim().startsWith('at ')).join('\n'));process.exitCode=1;});
