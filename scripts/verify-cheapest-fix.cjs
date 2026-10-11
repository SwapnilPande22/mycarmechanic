const {chromium}=require('C:/Users/purna/tools/pw-runtime/node_modules/playwright-core');
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),crypto=require('crypto'),{execFileSync}=require('child_process');
const root=path.resolve(__dirname,'..'),node='C:/Users/purna/tools/node-v24.19.0-win-x64/node.exe';
const origin='https://earnest-rhinoceros-454.convex.site',baselinePath=path.join(root,'scripts/cheapest-data-baseline.json');
const cli=args=>{try{return execFileSync(node,['node_modules/convex/bin/main.js',...args],{cwd:root,encoding:'utf8',stdio:['ignore','pipe','pipe'],maxBuffer:32*1024*1024});}catch{throw Error('Private CLI output suppressed');}};
const data=table=>JSON.parse(cli(['data',table,'--prod','--limit','10000','--format','json']));
const hashRows=rows=>Object.fromEntries(rows.map(row=>[row._id,crypto.createHash('sha256').update(JSON.stringify(row)).digest('hex')]));
if(process.argv.includes('--baseline')){fs.writeFileSync(baselinePath,JSON.stringify({inspections:hashRows(data('inspections')),quoteRequests:hashRows(data('quoteRequests'))},null,2));console.log('Saved record hashes for preservation verification; no records changed.');process.exit(0);}
const preview=process.argv.includes('--preview'),artifacts=path.join(root,'scripts',preview?'cheapest-preview':'cheapest-live');fs.mkdirSync(artifacts,{recursive:true});
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
for(const file of ['convex/inspections.ts','convex/garages.ts','convex/garagePresentation.ts','convex/admin.ts','convex/quoteRequests.ts','convex/quoteMessages.ts','convex/schema.ts'])assert.equal(fs.readFileSync(path.join(root,file),'utf8').replaceAll('\r\n','\n'),execFileSync('git',['show','247a2eb:'+file],{cwd:root,encoding:'utf8'}).replaceAll('\r\n','\n'),file+' changed');
const section=(source,start,end)=>source.slice(source.indexOf(start),source.indexOf(end)).replaceAll('\r\n','\n');
const before=execFileSync('git',['show','247a2eb:index.html'],{cwd:root,encoding:'utf8'});
assert.equal(section(html,'      } else if (location.pathname.replace','      } else if (location.pathname.startsWith'),section(before,'      } else if (location.pathname.replace','      } else if (location.pathname.startsWith'),'Admin changed');
assert.equal(section(html,'      const carPlaceholder =','      const resolveCar ='),section(before,'      const carPlaceholder =','      const resolveCar ='),'Garage/quote behavior changed');
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 const evidence={live:!preview,viewportWidth:375,protectedCodeUnchanged:true};
 try{
  const context=await browser.newContext({viewport:{width:375,height:1000},isMobile:true,hasTouch:true,deviceScaleFactor:1});
  if(preview){await context.route(origin+'/**',async route=>new URL(route.request().url()).pathname==='/'?route.fulfill({contentType:'text/html',body:html}):route.continue());await context.route('**/api/action',async route=>{
    if(route.request().postDataJSON().path!=='panels:analyzeDamage')return route.continue();
    const panel={panel:'front_bumper',repairType:'repair',cheapestFix:'screw_back',reason:'Bumper pulled away from its mounting; shell appears intact.',replacementCondition:'the bumper shell is cracked through or its mounting points cannot be secured'};
    return route.fulfill({contentType:'application/json',body:JSON.stringify({status:'success',value:{isCarPhoto:true,panels:[panel],checks:[{panel:'lhs_headlight',reason:'Possible mark; no confirmed crack.'}],estimates:[{panel:'front_bumper',repairType:'repair',low:300,high:1000},{panel:'front_bumper',repairType:'replacement',low:5000,high:8000}]}})});
  });}
  const page=await context.newPage();const responses=[];let pageErrors=0;
  page.on('pageerror',()=>pageErrors++);page.on('response',async response=>{try{if(response.url().endsWith('/api/action')&&response.request().postDataJSON().path==='panels:analyzeDamage')responses.push((await response.json()).value);}catch{}});
  const next=async step=>{await page.locator('[data-chat-next='+step+']').tap();await page.waitForFunction(()=>!Array.from(document.querySelectorAll('[data-chat-next]')).some(x=>x.disabled),{},{timeout:60000});};
  const start=async()=>{await page.goto(origin);if(await page.locator('#chat-name').isVisible()){await page.locator('#chat-name').fill('Polo inspection');await next('name');}await page.locator('#chat-help').fill('Please inspect the visible damage');await next('help');await page.locator('#chat-story').fill('Front bumper pulled away from its mounts');await next('story');await page.locator('#car-model').fill('Polo');await page.getByRole('option',{name:'Volkswagen Polo GT TSI',exact:true}).tap();await page.locator('[data-chat-step=photos]').waitFor({timeout:60000});};
  await start();await page.locator('#damage-photos').setInputFiles(['IMG-20260202-WA0010.jpg','IMG-20260202-WA0012.jpg','IMG-20260202-WA0014.jpg'].map(file=>path.join(root,'test-photos',file)));await page.waitForFunction(()=>!document.querySelector('.photo-converting'));
  await page.locator('#analyze').tap();await page.waitForFunction(()=>document.querySelector('.cheapest-estimate') || (!document.querySelector('#analyze').disabled && document.querySelector('#status').textContent),{},{timeout:360000});
  if(!await page.locator('.cheapest-estimate').count())throw Error('Live inspection failed: '+await page.locator('#status').innerText());
  await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(500);
  const original=responses.at(-1),bumper=original.panels.find(p=>p.panel==='front_bumper');assert(bumper);assert(['refit','reclip','screw_back'].includes(bumper.cheapestFix),'Bumper must be refitted, not repainted or replaced');
  const price=original.estimates.find(p=>p.panel==='front_bumper'&&p.repairType===bumper.repairType);assert(price);assert(price.low>=200&&price.low<=600&&price.high>=500&&price.high<=1200,'Bumper range must be roughly 300-1000');
  for(const lamp of original.panels.filter(p=>p.panel.includes('headlight')))if(lamp.cheapestFix==='replacement'){assert(['broken','cracked_through','missing'].includes(lamp.replacementEvidence));assert(lamp.replacementReason);}
  assert(!original.panels.some(p=>p.panel.includes('headlight')&&p.cheapestFix==='replacement'),'The supplied Polo photos do not show a cracked/broken headlight');
  assert(await page.locator('.replacement-option').first().innerText().then(x=>x.includes('Replace only if')));assert((await page.locator('.replacement-total').innerText()).includes('If parts need replacing'));
  assert(!original.panels.some(p=>p.confidence==='low'));assert(await page.evaluate(()=>document.documentElement.scrollWidth<=375));
  await page.locator('#result').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(artifacts,'polo-estimate-phone.png'),fullPage:true,mask:[page.locator('input[type=tel]'),page.locator('a[href^="tel:"]'),page.locator('.garage-photo')]});
  await page.locator('.cheapest-estimate').screenshot({path:path.join(artifacts,'polo-estimate-card.png')});
  evidence.bumperFix=bumper.cheapestFix;evidence.bumperRange={low:price.low,high:price.high};evidence.damagedHeadlights=original.panels.filter(p=>p.panel.includes('headlight')).map(p=>({part:p.panel,fix:p.cheapestFix,evidence:p.replacementEvidence,reason:p.reason}));evidence.confirmedParts=original.panels.map(p=>({part:p.panel,fix:p.cheapestFix}));evidence.uncertainParts=original.checks?.map(p=>p.panel)||[];
  if(!preview){
   const baseline=JSON.parse(fs.readFileSync(baselinePath));for(const [table,rows] of Object.entries(baseline)){const now=hashRows(data(table));for(const [id,hash] of Object.entries(rows))assert.equal(now[id],hash,'Existing record changed');}evidence.savedRecordsUnchanged=true;
   const saved=data('inspections');const historical=saved.find(row=>Object.keys(baseline.inspections).includes(row._id)&&row.result?.isCarPhoto);assert(historical);const loaded=JSON.parse(cli(['run','inspections:get',JSON.stringify({cacheKey:historical.cacheKey}),'--prod']));assert.deepEqual(loaded,historical.result);evidence.historicalInspectionStillReadable=true;
   const newRow=saved.find(row=>row.result?.photoHash===original.photoHash&&JSON.parse(row.cacheKey)[0]==='inspection-cheapest-v3');assert(newRow);assert.deepEqual(newRow.result,original);evidence.oldCacheInvalidatedWithoutDeletion=true;
   await start();await page.locator('#damage-photos').setInputFiles(['IMG-20260202-WA0014.jpg','IMG-20260202-WA0010.jpg','IMG-20260202-WA0012.jpg'].map(file=>path.join(root,'test-photos',file)));await page.waitForFunction(()=>!document.querySelector('.photo-converting'));await page.locator('#analyze').tap();await page.locator('.cheapest-estimate').waitFor({timeout:120000});await page.waitForTimeout(300);assert.deepEqual(responses.at(-1),original);evidence.photoHashReuseVerified=true;
   const password=cli(['env','get','ADMIN_PASSWORD','--prod']).trim(),admin=await context.newPage();await admin.goto(origin+'/admin');await admin.locator('#admin-password').fill(password);await admin.locator('#admin-login').tap();await admin.locator('.admin-request').first().waitFor({timeout:60000});const ids=await admin.locator('.admin-request').evaluateAll(cards=>cards.map(card=>card.dataset.id));assert(Object.keys(baseline.quoteRequests).every(id=>ids.includes(id)));const photo=await admin.locator('.admin-photos a').first().getAttribute('href');assert((await context.request.get(photo)).ok());evidence.adminRequestsAndPhotosStillOpen=true;
  }
  assert.equal(pageErrors,0);evidence.noHorizontalOverflow=true;fs.writeFileSync(path.join(artifacts,'verification.json'),JSON.stringify(evidence,null,2));console.log(JSON.stringify(evidence));
 }finally{await browser.close();}
})().catch(error=>{console.error(error.name+': '+error.message);process.exitCode=1;});
