const fs=require('fs'),{ConvexHttpClient}=require('convex/browser');
const {chromium}=require('C:/Users/purna/tools/pw-runtime/node_modules/playwright-core');
(async()=>{
 const html=fs.readFileSync('index.html','utf8'),strings=new Set();
 const add=text=>{text=text.trim();if(text.length>1&&text.length<600&&/[A-Za-z]/.test(text)&&!/^[\d\s₹.,–:+/()-]+$/.test(text))strings.add(text);};
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 const page=await browser.newPage();
 const fragments=[html.split('<script>')[0]];
 for(const match of html.matchAll(/'((?:\\.|[^'\\])*)'|"((?:\\.|[^"\\])*)"/g)){
   let value=match[1]??match[2];
   if(value.includes('<')&&value.includes('>'))fragments.push(value);
   else if(value.length<600&&/[A-Za-z][A-Za-z ,’'&/()-]*[ .?!…]/.test(value)&&!/[<>{}=;\\]|https?:|\b(?:function|const|return|document|querySelector|textContent)\b/.test(value))add(value);
 }
 for(const value of fragments){await page.setContent(value.replace(/<script[\s\S]*?<\/script>/g,''));const values=await page.evaluate(()=>{const out=[],w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n;while(n=w.nextNode()){if(!n.parentElement.closest('script,style,svg'))out.push(n.textContent);}document.querySelectorAll('[placeholder],[aria-label],[title]').forEach(el=>['placeholder','aria-label','title'].forEach(attr=>el.hasAttribute(attr)&&out.push(el.getAttribute(attr))));return out;});values.forEach(add);}
 await browser.close();
 ['Total','Replacement:','Visible evidence:','Part · What is wrong · Cheapest fix','Cheapest fixes, including labour','; garage checks excluded','Alternative total, not added to the cheapest fixes.','Unconfirmed parts are excluded.','(priced parts only)','AI estimate. Final work and price after a garage checks the car.','Damage is not confirmed. No price included.','the part itself is broken beyond safe repair, cracked through or missing','Repair Estimate','Rechecked estimate','Mechanic is typing','Language','Car year (optional)','e.g. 2018','Glad that looks right, happy to help!'].forEach(add);
 const selected=[...strings].filter(s=>s.length<600&&!/[{}]|\bdata-|\.class|\.get|\(\)|#|\[|\]/.test(s)&&s!=='Google Maps');
 const client=new ConvexHttpClient('https://shiny-trout-943.ap-southeast-2.convex.cloud');
 const file='ui-translations.json',catalog=fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):{hi:{},mr:{}};
 for(const language of ['hi','mr'])for(let offset=0;offset<selected.length;offset+=10){const texts=selected.slice(offset,offset+10).filter(text=>!/[\u0900-\u097f]/.test(catalog[language][text]||'')&& !['MyCarMechanic','Pune','English','Google Maps','Segoe UI'].includes(text));if(!texts.length)continue;let translated;try{translated=await client.action('presentation:translate',{language,texts});}catch{translated=[];for(const text of texts)translated.push((await client.action('presentation:translate',{language,texts:[text]}))[0]);}for(let i=0;i<texts.length;i++)catalog[language][texts[i]]=translated[i];fs.writeFileSync(file,JSON.stringify(catalog,null,2));console.log(language+': '+Object.keys(catalog[language]).length+' fixed strings');}
})().catch(error=>{console.error(error.message);process.exitCode=1;});
