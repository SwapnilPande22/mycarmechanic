const {spawn}=require('child_process'),fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..'),node='C:/Users/purna/tools/node-v24.19.0-win-x64/node.exe';
const log=path.join(root,'scripts/recheck-production-deploy.log');
const env={...process.env},pathKey=Object.keys(env).find(key=>key.toLowerCase()==='path')||'Path';
env[pathKey]=path.dirname(node)+';'+(env[pathKey]||'');
fs.writeFileSync(log,'');
function run(args){return new Promise((resolve,reject)=>{const child=spawn(node,args,{cwd:root,env,stdio:['ignore','pipe','pipe'],windowsHide:true});const output=chunk=>{fs.appendFileSync(log,chunk);process.stdout.write(chunk);};child.stdout.on('data',output);child.stderr.on('data',output);child.on('error',()=>reject(Error('Deployment process could not start')));child.on('close',code=>code===0?resolve():reject(Error('Deployment failed')));});}
(async()=>{await run(['node_modules/convex/bin/main.js','deploy','--env-file','.env.local','--yes']);await run(['node_modules/@convex-dev/static-hosting/dist/cli/index.js','upload','--build','--prod']);})().catch(error=>{console.error(error.message);process.exitCode=1;});
