const fs=require('fs'),path=require('path'),crypto=require('crypto');const root=path.resolve(__dirname,'..'),output=path.join(root,'dist');const convexUrl=process.env.VITE_CONVEX_URL;if(!convexUrl||!/^https:\/\/[^/]+\.convex\.cloud$/.test(convexUrl))throw Error('VITE_CONVEX_URL must be an HTTPS Convex deployment URL.');
fs.mkdirSync(output,{recursive:true});
// All names below are generated assets within dist; HTML is always revalidated.
for(const file of fs.readdirSync(output))if(['chat-questions.js','customer-controls.js','quick-entry.js','design.css','localization.js','ui-translations.js','heic2any.min.js','heic2any.LICENSE.md'].includes(file)||/^(?:chat-questions|customer-controls|quick-entry|design|localization|ui-translations|heic2any)[-.].*\.(?:css|js|md)$/.test(file))fs.unlinkSync(path.join(output,file));
const assets={
 'chat-questions.js':fs.readFileSync(path.join(root,'chat-questions.js')),
 'design.css':fs.readFileSync(path.join(root,'design.css')),
 'quick-entry.js':fs.readFileSync(path.join(root,'quick-entry.js')),
 'localization.js':fs.readFileSync(path.join(root,'localization.js')),
 'ui-translations.js':Buffer.from('window.UI_TRANSLATIONS = '+fs.readFileSync(path.join(root,'ui-translations.json'),'utf8')+';\n'),
 'heic2any.min.js':fs.readFileSync(path.join(root,'node_modules/heic2any/dist/heic2any.min.js')),
 'heic2any.LICENSE.md':fs.readFileSync(path.join(root,'node_modules/heic2any/LICENSE.md')),
};let html=fs.readFileSync(path.join(root,'index.html'),'utf8').replaceAll('https://earnest-rhinoceros-454.convex.cloud',convexUrl);const manifest={};
for(const [name,body]of Object.entries(assets)){const ext=path.extname(name),base=name.slice(0,-ext.length),hash='0'+crypto.createHash('sha256').update(body).digest('hex').slice(0,12),hashed=base+'-'+hash+ext;fs.writeFileSync(path.join(output,hashed),body);html=html.replaceAll('/'+name,'/'+hashed);manifest[name]='/'+hashed;}
fs.writeFileSync(path.join(output,'index.html'),html);fs.writeFileSync(path.join(root,'scripts/static-asset-manifest.json'),JSON.stringify(manifest,null,2));console.log('Built dist/index.html with content-versioned assets (one-year immutable cache).');
