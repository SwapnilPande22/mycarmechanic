const fs=require('fs'),path=require('path'),assert=require('assert/strict'),{execFileSync}=require('child_process');
const {garageMessage,quoteEmailText}=require('./load-lead-messages.cjs');
const root=path.resolve(__dirname,'..'),origin='https://earnest-rhinoceros-454.convex.site';
const cli=(name,args)=>{const raw=execFileSync(process.execPath,['node_modules/convex/bin/main.js','run',name,JSON.stringify(args),'--prod'],{cwd:root,encoding:'utf8',stdio:['ignore','pipe','pipe'],maxBuffer:16*1024*1024});return raw.trim()?JSON.parse(raw):null;};
let id;
try {
 const password=execFileSync(process.execPath,['node_modules/convex/bin/main.js','env','get','ADMIN_PASSWORD','--prod'],{cwd:root,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
 const args={name:'TEST email fix Kharadi (do not contact)',whatsappNumber:'9000000000',carModel:'Volkswagen Polo',make:'Volkswagen',model:'Polo',vehicleSize:'small',area:'Kharadi, Pune',city:'Pune',parts:[{panel:'front_bumper',partName:'Front bumper',workNeeded:'Repair'},{panel:'lhs_fender',partName:'LHS fender',workNeeded:'Repair'}],garages:[],photos:[],siteOrigin:origin};
 assert(args.name.startsWith('TEST'));
 const created=cli('quoteRequests:create',args);assert(!created.paused);id=created.id;
 fs.writeFileSync(path.join(root,'scripts/email-fix-test-id.json'),JSON.stringify({id,name:args.name},null,2));
 const request=cli('quoteRequests:getForEmail',{id});assert.equal(request.emailStatus,'sent');
 const whatsapp=cli('admin:copyForGarage',{password,id,language:'en'});
 const expected=garageMessage(request,origin+'/quotes/'+id);assert.equal(whatsapp,expected);
 const report={requestId:id,name:request.name,parts:request.parts.length,emailId:request.emailId,emailStatus:request.emailStatus,whatsappMatchesSharedFunction:true,providerRetrieved:false};
 let email;
 try {const proof=cli('quoteRequests:emailDeliveryProof',{id});email=proof.text;report.providerRetrieved=true;report.providerEvent=proof.lastEvent;}catch{report.providerReadFailure='The configured Resend credential cannot retrieve sent email text.';email=quoteEmailText(request,[],origin+'/admin?request='+id);}
 assert.equal(email.split('Copy for garage\n')[1],whatsapp);assert(email.includes('Area: Kharadi\nDamage:\n1. Front bumper – Repair\n2. LHS fender – Repair'));assert(!email.includes('Year not provided'));assert(/Request time: \d{1,2} \w{3} \d{4}, \d{1,2}:\d{2} [AP]M IST/.test(email));
 fs.writeFileSync(path.join(root,report.providerRetrieved ? 'scripts/email-fix-raw-email.txt' : 'scripts/email-fix-formatted-email.txt'),email);fs.writeFileSync(path.join(root,'scripts/email-fix-whatsapp.txt'),whatsapp);fs.writeFileSync(path.join(root,'scripts/email-fix-verification.json'),JSON.stringify(report,null,2));
 console.log(JSON.stringify(report,null,2));console.log(email);
} finally {
 if(id){cli('quoteRequests:remove',{id});assert.equal(cli('quoteRequests:getForEmail',{id}),null);fs.writeFileSync(path.join(root,'scripts/email-fix-test-cleanup.json'),JSON.stringify({id,deleted:true},null,2));console.log('TEST request deleted and absence verified.');}
}
