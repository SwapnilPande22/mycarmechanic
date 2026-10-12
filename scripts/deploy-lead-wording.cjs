const {spawn}=require('child_process'),fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..'),node='C:/Users/purna/tools/node-v24.19.0-win-x64/node.exe';
const log=path.join(root,'scripts/lead-wording-production-deploy.log');
const env={...process.env},pathKey=Object.keys(env).find(key=>key.toLowerCase()==='path')||'Path';env[pathKey]=path.dirname(node)+';'+(env[pathKey]||'');
fs.writeFileSync(log,'');
const child=spawn(node,[path.join(path.dirname(node),'node_modules/npm/bin/npm-cli.js'),'run','deploy'],{cwd:root,env,stdio:['ignore','pipe','pipe'],windowsHide:true});
const output=chunk=>{fs.appendFileSync(log,chunk);process.stdout.write(chunk);};child.stdout.on('data',output);child.stderr.on('data',output);child.on('error',()=>{console.error('npm run deploy could not start.');process.exitCode=1;});child.on('close',code=>{process.exitCode=code;});


