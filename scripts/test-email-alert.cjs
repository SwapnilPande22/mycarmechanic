const fs = require('fs'), assert = require('assert/strict');
const ts = fs.readFileSync('convex/quoteEmail.ts', 'utf8');
const Module = require('module');
const m = new Module('email-test');
m._compile(require('node:module').stripTypeScriptTypes(ts).replace(/export function /g,'function ') + '\nmodule.exports={quoteEmailText};', 'email-test.js');
const text = m.exports.quoteEmailText({name:'Test',whatsappNumber:'9000000000',createdAt:0,make:'Volkswagen',model:'Polo',year:'2018',carModel:'Polo',city:'Pune',area:'Kothrud',customerConcern:'My bumper fell off. Phone 9000000000. Rs 4,000',parts:[{partName:'Bumper',workNeeded:'Refit',customerDescription:'Bumper fell off',photoObservation:'Loose bumper clips'}]}, ['https://example.com/photo']);
const garage = text.split('Copy for garage\n')[1];
assert(!garage.includes('9000000000')); assert(!garage.includes('4,000'));
assert(garage.includes('Loose bumper clips')); assert(garage.includes('2018')); assert(garage.includes('https://example.com/photo'));
const h=fs.readFileSync('index.html','utf8');
for(const script of h.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)) {
  if(script[0].includes('type="module"')) continue;
  new Function(script[1]);
}
const pattern=h.match(/if\(concern && (\/.*?\/i)\.test\(concern\)\)/)[1];
const accepts=new Function('return '+pattern)();
for(const phrase of ['estimate looks right','looks right','no concern','I have no concerns','all good','okay','no issues']) assert(accepts.test(phrase),phrase);
for(const phrase of ['the bumper is damaged','price looks wrong','looks right but the door is wrong']) assert(!accepts.test(phrase),phrase);
console.log('PASS: email copy includes damage, year and photos; phone/prices are withheld; no-concern routing accepts affirmations and preserves actual concerns; scripts parse.');
