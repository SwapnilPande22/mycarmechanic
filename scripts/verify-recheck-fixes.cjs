const {chromium}=require('C:/Users/purna/tools/pw-runtime/node_modules/playwright-core');
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),crypto=require('crypto'),{execFileSync}=require('child_process');
const root=path.resolve(__dirname,'..'),node='C:/Users/purna/tools/node-v24.19.0-win-x64/node.exe';
const origin='https://earnest-rhinoceros-454.convex.site',live=process.argv.includes('--live');
const artifacts=path.join(root,'scripts',live?'recheck-live':'recheck-preview');fs.mkdirSync(artifacts,{recursive:true});
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const previous=execFileSync('git',['show','3e50e2c:index.html'],{cwd:root,encoding:'utf8'});
for(const p of ['convex/priceEstimates.ts','convex/inspections.ts','convex/garages.ts','convex/garagePresentation.ts','convex/admin.ts','convex/quoteRequests.ts','convex/quoteMessages.ts','convex/schema.ts'])assert.equal(fs.readFileSync(path.join(root,p),'utf8').replaceAll('\r\n','\n'),execFileSync('git',['show','3e50e2c:'+p],{cwd:root,encoding:'utf8'}).replaceAll('\r\n','\n'),p+' changed');
const section=(source,start,end)=>source.slice(source.indexOf(start),source.indexOf(end)).replaceAll('\r\n','\n');
assert.equal(section(html,'      } else if (location.pathname.replace','      } else if (location.pathname.startsWith'),section(previous,'      } else if (location.pathname.replace','      } else if (location.pathname.startsWith'));
assert.equal(section(html,'      const carPlaceholder =','      const resolveCar ='),section(previous,'      const carPlaceholder =','      const resolveCar ='),'Garage and quote behavior changed');
const cli=args=>{try{return execFileSync(node,['node_modules/convex/bin/main.js',...args],{cwd:root,encoding:'utf8',stdio:['ignore','pipe','pipe'],maxBuffer:32*1024*1024});}catch{throw Error('Private CLI output suppressed');}};
const data=table=>JSON.parse(cli(['data',table,'--prod','--limit','1000','--format','json']));
const hashRows=rows=>Object.fromEntries(rows.map(row=>[row._id,crypto.createHash('sha256').update(JSON.stringify(row)).digest('hex')]));
const baselinePath=path.join(root,'scripts/recheck-data-baseline.json');
if(!fs.existsSync(baselinePath))fs.writeFileSync(baselinePath,JSON.stringify({inspections:hashRows(data('inspections')),quoteRequests:hashRows(data('quoteRequests'))},null,2));
const baseline=JSON.parse(fs.readFileSync(baselinePath));
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 const evidence={live,viewportWidth:375,protectedCodeUnchanged:true};
 try {
  const context=await browser.newContext({viewport:{width:375,height:812},isMobile:true,hasTouch:true,deviceScaleFactor:1});
  if(!live)await context.route(origin+'/**',async route=>{if(new URL(route.request().url()).pathname==='/')await route.fulfill({contentType:'text/html',body:html});else await route.continue();});
  const page=await context.newPage();const responses=[];let errors=0;
  page.on('pageerror',()=>errors++);
  page.on('response',async response=>{try{if(response.url().endsWith('/api/action') && response.request().postDataJSON().path==='panels:analyzeDamage')responses.push({args:response.request().postDataJSON().args[0],body:await response.json()});}catch{}});
  const snap=async name=>{await page.waitForTimeout(300);await page.screenshot({path:path.join(artifacts,name+'.png'),fullPage:true,mask:[page.locator('input[type=tel]'),page.locator('a[href^="tel:"]')]});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=375));};
  const next=async step=>{await page.locator('[data-chat-next='+step+']').tap();await page.waitForFunction(()=>!Array.from(document.querySelectorAll('[data-chat-next]')).some(el=>el.disabled),{},{timeout:45000});};
  async function carStep(){await page.goto(origin);await page.evaluate(()=>localStorage.clear());await page.reload();await page.locator('#chat-name').fill('Recheck verification');await next('name');await page.locator('#chat-help').fill('My front bumper got damaged');await next('help');await page.locator('#chat-story').fill('Someone hit the car while parked');await next('story');}
  await carStep();await page.locator('#car-model').fill('Polo');const option=page.getByRole('option',{name:'Volkswagen Polo GT TSI',exact:true});await option.waitFor();await snap('01-autosuggest-options');await option.tap();await page.locator('[data-chat-step=photos]').waitFor({state:'visible',timeout:45000});assert.equal(await page.locator('#car-model').inputValue(),'Volkswagen Polo GT TSI');assert(await page.locator('[data-chat-step=car]').isHidden());await snap('02-autosuggest-tap-advanced');evidence.tapFillsAndAdvances=true;
  await carStep();await page.locator('#car-model').fill('Custom make model Touring variant');await next('car');assert(await page.locator('[data-chat-step=photos]').isVisible());assert.equal(await page.locator('#car-model').inputValue(),'Custom make model Touring variant');await snap('03-free-text-car');evidence.unlistedCarStillWorks=true;
  await carStep();await page.locator('#car-model').fill('Polo');await page.getByRole('option',{name:'Volkswagen Polo GT TSI',exact:true}).tap();await page.locator('[data-chat-step=photos]').waitFor({state:'visible',timeout:45000});
  await page.locator('#damage-photos').setInputFiles(path.join(root,'test-photos','IMG-20260202-WA0010.jpg'));await page.waitForFunction(()=>!document.querySelector('.photo-converting'));await page.locator('#analyze').tap();await page.locator('.result-wrap').waitFor({timeout:240000});
  const originalText=await page.locator('.result-wrap').first().innerText();const original=responses.at(-1).body.value;assert(original.isCarPhoto);assert(!responses.at(-1).args.recheckConcern);
  const order=await page.locator('#result').evaluate(el=>Array.from(el.children).map(child=>child.className));assert(order.indexOf('card result-wrap')<order.indexOf('card recheck-card'));assert(order.indexOf('card recheck-card')<order.indexOf('card garage-invite'));assert(await page.locator('#garage-discovery').isHidden());await snap('04-concern-under-estimate-before-garages');evidence.correctScreenOrder=true;
  const concern="I don't think this part is damaged. Please re-examine the front bumper in the same photo." + (live ? " Please check whether the mark is paint damage rather than dirt." : "");
  const beforeRecheck=data('inspections');const expectedKey=JSON.stringify(['inspection-recheck-v1',original.photoHash,'volkswagen polo gt tsi','pune','small',concern]);
  const cachedBefore=beforeRecheck.some(row=>row.cacheKey===expectedKey);
  await page.locator('#estimate-concern').fill(concern);await page.locator('#recheck-estimate').tap();assert(await page.locator('.result-wrap').first().isVisible());await snap('05-original-stays-during-recheck');await page.waitForFunction(()=>!document.querySelector('#recheck-estimate').disabled,{},{timeout:240000});
  assert.equal(await page.locator('.result-wrap').count(),2);assert.equal(await page.locator('.result-wrap').first().innerText(),originalText);assert.equal(await page.locator('.result-wrap').nth(1).locator('h2').innerText(),'Rechecked estimate');
  const recheck=responses.at(-1);assert.equal(recheck.args.recheckConcern,concern);assert.equal(recheck.body.value.isRecheck,true);assert.equal(recheck.body.value.photoHash,original.photoHash);assert.equal(recheck.body.value.recheckConcern,concern);assert(await page.locator('[data-chat-step=car]').isHidden());assert(await page.locator('[data-chat-step=photos]').isHidden());
  const saved=data('inspections');const savedRecheck=saved.find(row=>row.cacheKey===expectedKey);assert(savedRecheck);assert.deepEqual(savedRecheck.result,recheck.body.value);const ordinary=saved.find(row=>row.cacheKey===JSON.stringify(['inspection-v2',original.photoHash,'volkswagen polo gt tsi','pune','small']));assert.deepEqual(ordinary.result,original);
  await snap('06-original-and-rechecked-estimate');evidence.recheckUsesSamePhotos=true;evidence.concernSpecificCache=true;evidence.originalCacheUnchanged=true;evidence.freshVisionRun=!cachedBefore;evidence.originalVisibleAndUnchanged=true;
  await page.locator('#recheck-estimate').tap();await page.waitForFunction(()=>!document.querySelector('#recheck-estimate').disabled,{},{timeout:120000});assert.equal(await page.locator('.result-wrap').count(),3);assert.deepEqual(responses.at(-1).body.value,recheck.body.value);evidence.repeatConcernUsesOnlyRecheckCache=true;
  // Invalid rechecks must keep existing estimates and remain retryable.
  await page.locator('#estimate-concern').fill('');await page.locator('#recheck-estimate').tap();assert.equal(await page.locator('.result-wrap').count(),3);assert((await page.locator('#recheck-status').innerText()).includes('Tell me'));evidence.emptyConcernPreservesEstimates=true;
  const password=cli(['env','get','ADMIN_PASSWORD','--prod']).trim();const admin=await context.newPage();await admin.goto(origin+'/admin');await admin.locator('#admin-password').fill(password);await admin.locator('#admin-login').click();await admin.waitForFunction(()=>!document.querySelector('#admin-status').textContent.includes('Loading') && document.querySelector('#admin-status').textContent.includes('quote request'),{},{timeout:60000});
  const ids=await admin.locator('.admin-request').evaluateAll(cards=>cards.map(card=>card.dataset.id));assert(Object.keys(baseline.quoteRequests).every(id=>ids.includes(id)));const photoLink=await admin.locator('.admin-photos a').first().getAttribute('href');assert((await context.request.get(photoLink)).ok());
  for(const [table,rows] of Object.entries(baseline)){const current=hashRows(data(table));for(const [id,hash] of Object.entries(rows))assert.equal(current[id],hash,'Existing record changed');}
  assert.equal(errors,0);evidence.savedRecordsAndAdminVerified=true;evidence.noHorizontalOverflow=true;
  fs.writeFileSync(path.join(artifacts,'verification.json'),JSON.stringify(evidence,null,2));console.log(JSON.stringify(evidence));
 } finally {await browser.close();}
})().catch(error=>{console.error('Recheck verification failed: '+error.name);console.error(String(error.stack).split('\n').filter(line=>line.trim().startsWith('at ')).join('\n'));process.exitCode=1;});
