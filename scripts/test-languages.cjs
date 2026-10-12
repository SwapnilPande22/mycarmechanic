const fs=require('fs'),assert=require('assert/strict'),{execFileSync}=require('child_process'),Module=require('module');
const strip=require('node:module').stripTypeScriptTypes;
const email=new Module('email');email._compile(strip(fs.readFileSync('convex/quoteEmail.ts','utf8')).replace(/export function /g,'function ')+'\nmodule.exports={garageSafe,quoteEmailText};','email.js');
const garage=new Module('garage');garage._compile('const garageSafe='+email.exports.garageSafe.toString()+'; const translateTexts=async texts=>texts;\n'+strip(fs.readFileSync('convex/quoteMessages.ts','utf8')).replace(/^import .*;\r?\n/gm,'').replace(/export (async )?function /g,(_,a)=>(a||'')+'function ')+'\nmodule.exports={garageMessage};','garage.js');
const request={name:'Private Name',whatsappNumber:'9000000000',make:'Volkswagen',model:'Polo',carModel:'Volkswagen Polo',year:'2018',city:'Pune',area:'Kothrud',customerConcern:'Private Name: the door is dented. Phone 9000000000. Estimate Rs 4,000.',parts:Array.from({length:8},(_,i)=>({partName:'Door '+i,workNeeded:'Repair',photoObservation:'Visible dent.'}))};
const message=garage.exports.garageMessage(request,'https://example.com/photos');assert(message.split('\n').length<=8);assert(!/Private Name|9000000000|4,000|Rs|estimate/i.test(message));for(let i=0;i<8;i++)assert(message.includes('Door '+i));assert(message.endsWith('Please reply with your price and the earliest time you can inspect the car.'));
const current=fs.readFileSync('index.html','utf8'),before=execFileSync('git',['show','b7246e1:index.html'],{cwd:process.cwd(),encoding:'utf8'});
const analytics=text=>text.slice(text.indexOf('// Explicit, anonymous PostHog'),text.indexOf('</script>',text.indexOf('// Explicit, anonymous PostHog')));assert.equal(analytics(current),analytics(before));
for(const file of ['convex/inspections.ts','convex/panels.ts','convex/priceEstimates.ts','convex/garages.ts','convex/repairPlan.ts','convex/schema.ts'])assert.equal(fs.readFileSync(file,'utf8'),execFileSync('git',['show','b7246e1:'+file],{cwd:process.cwd(),encoding:'utf8'}),file);
const quote=text=>text.slice(text.indexOf('export const isAvailable'),text.indexOf('// The request is durable'));assert.equal(quote(fs.readFileSync('convex/quoteRequests.ts','utf8')),quote(execFileSync('git',['show','b7246e1:convex/quoteRequests.ts'],{cwd:process.cwd(),encoding:'utf8'})));
for(const script of current.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))if(!script[0].includes('type="module"'))new Function(script[1]);new Function(fs.readFileSync('localization.js','utf8'));
const catalog=JSON.parse(fs.readFileSync('ui-translations.json','utf8'));
for(const language of ['hi','mr']){
 for(const [source,translation]of Object.entries(catalog[language]))assert.deepEqual(translation.match(/[0-9]+(?:[,.][0-9]+)*/g)||[],source.match(/[0-9]+(?:[,.][0-9]+)*/g)||[],source);
 for(const key of ['Your name','Continue','Repair Estimate','Upload car photos','Car year (optional)'])assert(/[\u0900-\u097f]/.test(catalog[language][key]),language+' '+key);
 assert(catalog[language]['Front bumper'].includes('(front bumper)'));
}
console.log('PASS: garage copy stays within eight lines and omits identity/prices; all parts retained; fixed translations preserve numbers and bracketed parts; PostHog, inspection, pricing, garage search, quote validation/saving and QUOTE_PHONE code unchanged; scripts parse.');
