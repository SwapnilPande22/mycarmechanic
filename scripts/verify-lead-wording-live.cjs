const {chromium}=require('C:/Users/purna/tools/pw-runtime/node_modules/playwright-core');
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),{execFileSync}=require('child_process');
const root=path.resolve(__dirname,'..'),origin='https://earnest-rhinoceros-454.convex.site';
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 try {
  const page=await browser.newPage({viewport:{width:1100,height:900}});
  const settle=()=>page.waitForFunction(()=>!document.querySelector('.typing-dots')&&![...document.querySelectorAll('[data-chat-next]')].some(x=>x.disabled),{},{timeout:65000});
  let created, rechecks=0;
  page.on('response',async res=>{try{if(res.url().endsWith('/api/action')){const p=res.request().postDataJSON();if(p.path==='quoteRequests:create'){const reply=await res.json();created=reply.value;console.log('Quote response: '+JSON.stringify(reply));}if(p.path==='panels:analyzeDamage'&&p.args[0].recheckConcern)rechecks++;}}catch{}});
  await page.goto(origin);await settle();await page.emulateMedia({reducedMotion:'reduce'});

  await page.locator('#chat-name').fill('Lead wording live test (do not contact)');await page.locator('[data-chat-next=name]').click();await settle();
  await page.locator('#chat-help').fill('My car got damaged');await page.locator('[data-chat-next=help]').click();await settle();
  await page.locator('#chat-story').fill('My front bumper came loose on the highway. Please check the clips.');await page.locator('[data-chat-next=story]').click();await settle();
  await page.locator('#car-model').fill('Polo');await page.getByRole('option',{name:'Volkswagen Polo GT TSI',exact:true}).click();await settle();
  await page.locator('#customer-city').fill('Pune');await page.locator('#customer-city').press('Escape');await page.locator('[data-chat-next=city]').click();await settle();
  await page.locator('#damage-photos').setInputFiles(['IMG-20260202-WA0010.jpg','IMG-20260202-WA0012.jpg','IMG-20260202-WA0014.jpg'].map(file=>path.join(root,'test-photos',file)));
  await page.waitForFunction(()=>!document.querySelector('.photo-converting'));await page.locator('#analyze').click();await page.locator('#estimate-concern').waitFor({timeout:180000});
  await page.locator('#estimate-concern').fill('estimate looks right');await page.locator('#estimate-concern').press('Enter');await settle();
  assert(await page.locator('.recheck-card').isHidden());assert.equal(await page.locator('.no-concern-reply').innerText(),'Glad that looks right, happy to help!');assert.equal(rechecks,0);
  await page.locator('#show-nearby-garages').click();await page.locator('#garage-area').fill('Kharadi, Pune');await page.locator('#garage-area').press('Escape');await page.locator('#garage-area').press('Escape');await page.locator('#garage-search-button').click();await page.locator('.garage-item').first().waitFor({timeout:120000});
  await page.locator('.garage-review-button').first().click();await page.locator('#quote-yes').waitFor({state:'visible',timeout:30000});await page.locator('#quote-yes').click();
  await page.locator('[name=year]').fill('2018');await page.locator('[name=whatsappNumber]').fill('9000000000');await page.locator('[data-quote-form] button[type=submit]').click();await page.waitForTimeout(5000);console.log('Quote form status: '+await page.locator('[data-quote-status]').innerText());console.log('Form validity: '+await page.locator('[data-quote-form]').evaluate(el=>el.checkValidity()));await page.locator('[data-quote-followup]').waitFor({state:'visible',timeout:30000});assert(created&&!created.paused);
  const password=execFileSync(process.execPath,['node_modules/convex/bin/main.js','env','get','ADMIN_PASSWORD','--prod'],{cwd:root,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
  const admin=await browser.newPage();await admin.goto(origin+'/admin');await admin.locator('#admin-password').fill(password);await admin.locator('#admin-login').click();
  const card=admin.locator('.admin-request[data-id="'+created.id+'"]');await card.waitFor({timeout:60000});
  const stored=await admin.evaluate(async({password,id})=>{const {ConvexHttpClient}=await import('https://esm.sh/convex@1.46.0/browser');return(await new ConvexHttpClient('https://earnest-rhinoceros-454.convex.cloud').action('admin:list',{password})).find(r=>r._id===id);},{password,id:created.id});
  if(stored.emailStatus==='failed')assert.equal(await card.locator('.admin-email-status').innerText(),'Email failed');
  assert.equal(stored.emailStatus,'sent');
  const message=await admin.evaluate(async({password,id})=>{const {ConvexHttpClient}=await import('https://esm.sh/convex@1.46.0/browser');return new ConvexHttpClient('https://earnest-rhinoceros-454.convex.cloud').action('admin:copyForGarage',{password,id,language:'en'});},{password,id:created.id});
  const {quoteEmailText}=require('./load-lead-messages.cjs');
  const email=quoteEmailText(stored,stored.photoUrls,origin+'/admin?request='+created.id);
  assert.equal(email.split('Copy for garage\n')[1],message);
  assert(message.split('\n').length<12);assert(!message.includes(stored.name));assert(!message.includes(stored.whatsappNumber));
  fs.writeFileSync(path.join(root,'scripts/lead-wording-email-text.txt'),email);fs.writeFileSync(path.join(root,'scripts/lead-wording-whatsapp-text.txt'),message);
  console.log('Shared email/WhatsApp body identical; email accepted; under twelve lines; private details excluded.');
  const evidence={liveUrl:origin,requestId:created.id,noConcernAdvances:true,noReinspection:true,savedToAdmin:true,emailStatus:stored.emailStatus,emailId:stored.emailId||null,year:stored.year,sharedGarageTextIdentical:true,lineCount:message.split('\n').length,emailTextSource:'Reconstructed from saved request using deployed formatter; provider retrieval checked separately'};
  fs.writeFileSync(path.join(root,'scripts/lead-wording-live-verification.json'),JSON.stringify(evidence,null,2));console.log(JSON.stringify(evidence,null,2));
 }finally{await browser.close();}
})().catch(error=>{console.error(error.stack);process.exitCode=1;});
