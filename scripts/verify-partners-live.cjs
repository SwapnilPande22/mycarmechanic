const {chromium}=require('C:/Users/purna/tools/pw-runtime/node_modules/playwright-core');
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),{execFileSync}=require('child_process');
const root=path.resolve(__dirname,'..'),origin='https://earnest-rhinoceros-454.convex.site';
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 try{
  const context=await browser.newContext({viewport:{width:1100,height:900}}),page=await context.newPage();let results=[],errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('response',async response=>{try{if(response.url().endsWith('/api/action')&&response.request().postDataJSON()?.path==='garages:nearby')results.push((await response.json()).value);}catch{}});
  const settle=()=>page.waitForFunction(()=>!document.querySelector('.typing-dots')&&window.i18n.settled()&&![...document.querySelectorAll('[data-chat-next]')].some(x=>x.disabled),{},{timeout:120000});
  await page.goto(origin);await settle();await page.locator('#chat-name').fill('Partner garage verification');await page.locator('[data-chat-next=name]').click();await settle();
  await page.locator('#chat-help').fill('My car got damaged');await page.locator('[data-chat-next=help]').click();await settle();await page.locator('#chat-story').fill('My front bumper came loose on the highway.');await page.locator('[data-chat-next=story]').click();await settle();
  await page.locator('#car-model').fill('Polo');await page.getByRole('option',{name:'Volkswagen Polo GT TSI',exact:true}).click();await settle();await page.locator('#customer-city').fill('Pune');await page.locator('[data-chat-next=city]').click();await settle();
  await page.locator('#damage-photos').setInputFiles(['IMG-20260202-WA0010.jpg','IMG-20260202-WA0012.jpg','IMG-20260202-WA0014.jpg'].map(file=>path.join(root,'test-photos',file)));await page.waitForFunction(()=>!document.querySelector('.photo-converting'));await page.locator('#analyze').click();await page.locator('#show-nearby-garages').waitFor({timeout:180000});await settle();
  const password=execFileSync(process.execPath,['node_modules/convex/bin/main.js','env','get','ADMIN_PASSWORD','--prod'],{cwd:root,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
  const admin=await context.newPage();await admin.goto(origin+'/admin');await admin.locator('#admin-password').fill(password);await admin.locator('#admin-login').click();await admin.locator('#partner-settings').waitFor();await admin.locator('#partner-search').fill('Sai Car Care Kharadi, Pune');await admin.locator('#partner-search-button').click();
  const saiId=process.env.TEST_SAI_PLACE_ID || 'ChIJn0ncPO_DwjsRhU1fk3Um088';
  const sai=admin.locator('#partner-search-results [data-partner-id="'+saiId+'"]');await sai.waitFor({timeout:30000});if(!await sai.isChecked())await sai.check();await admin.locator('#partner-settings-list [data-partner-id="'+saiId+'"]:checked').waitFor({timeout:30000});
  assert.equal(await admin.locator('#partner-settings-list input:checked').count(),4);await admin.reload();await admin.locator('#admin-password').fill(password);await admin.locator('#admin-login').click();await admin.waitForFunction(()=>document.querySelectorAll('#partner-settings-list input:checked').length===4,{},{timeout:30000});
  await page.locator('#show-nearby-garages').click();await settle();await page.emulateMedia({reducedMotion:'reduce'});
  const baseline=JSON.parse(fs.readFileSync(path.join(root,'scripts/partners-search-baseline.json'),'utf8')),proof={liveUrl:origin,adminPartnerSettingPersists:true,searches:{}};
  for(const [area,file]of [['Kharadi, Pune','partners-kharadi-live.png'],['Hinjewadi, Pune','partners-hinjewadi-live.png']]){
   if(area.startsWith('Hinjewadi'))await page.locator('#change-garage-area').click();
   await page.locator('#garage-area').fill(area);await page.locator('#garage-area').press('Escape');await page.locator('#garage-search-button').click();await page.waitForFunction(()=>!document.querySelector('#garage-search-button').disabled,{},{timeout:90000});await page.locator('.garage-item').first().waitFor();await settle();await page.waitForFunction(()=>[...document.querySelectorAll('.garage-item')].every(card=>card.dataset.presentationReady==='true'),{},{timeout:90000});
   const response=results.at(-1),partners=response.garages.filter(g=>g.quotePartner),normal=response.garages.filter(g=>!g.quotePartner).map(({name,placeId,distanceKm})=>({name,placeId,distanceKm}));
   assert.deepEqual(normal,baseline[area].garages,'Existing normal shortlist changed for '+area);assert(partners.every(g=>g.distanceKm<=10));
   if(area.startsWith('Kharadi'))assert.equal(partners.length,4);else assert.equal(partners.length,0);
   assert.equal(await page.locator('.quote-partner-label').count(),partners.length);
   const names=await page.locator('.garage-card-body h3').allInnerTexts();assert.deepEqual(names,response.garages.map(g=>g.name));
   for(const [index,partner]of partners.entries())assert.equal(await page.locator('.garage-item').nth(index).locator('.quote-partner-label').innerText(),'Replies to MyCarMechanic quotes');
   await page.waitForTimeout(2000);await page.locator('#garage-discovery').screenshot({path:path.join(root,'scripts',file),style:'#garage-quote-bar{visibility:hidden!important}'});
   proof.searches[area]={partners:partners.map(({name,placeId,distanceKm})=>({name,placeId,distanceKm})),nonPartners:normal,normalShortlistUnchanged:true,partnerLabels:partners.length,screenshot:'scripts/'+file};
  }
  assert.equal(errors.length,0,errors.join('\n'));fs.writeFileSync(path.join(root,'scripts/partners-live-verification.json'),JSON.stringify(proof,null,2));console.log(JSON.stringify(proof,null,2));
 }finally{await browser.close();}
})().catch(error=>{console.error(error.stack);process.exitCode=1;});
