const http=require('http'),fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const script=html.match(/<script type="module">([\s\S]*?)<\/script>/)[1].replace(/^\s*import .*?;\s*$/gm,'');
new vm.Script(script);
console.log('Customer JavaScript syntax valid.');
http.createServer((req,res)=>{
  const name=req.url.split('?')[0]==='/heic2any.min.js' ? 'node_modules/heic2any/dist/heic2any.min.js' : 'index.html';
  res.setHeader('Content-Type',name.endsWith('.js') ? 'text/javascript' : 'text/html; charset=utf-8');
  res.end(fs.readFileSync(path.join(root,name)));
}).listen(4173,'127.0.0.1',()=>console.log('Preview: http://127.0.0.1:4173'));
