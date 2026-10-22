import {spawn} from 'node:child_process';
const children=[];
const cli=(name)=>process.platform==='win32'?`${name}.cmd`:name;
function run(name,args,opts={}) { return new Promise((resolve,reject)=>{const child=spawn(cli(name),args,{stdio:'inherit',env:{...process.env,WRANGLER_SEND_METRICS:'false'},...opts});child.on('error',reject);child.on('exit',code=>code===0?resolve():reject(new Error(`${name} exited ${code}`)));}); }
await run('node',['scripts/import-content.mjs']);
await run('npx',['wrangler','d1','migrations','apply','DB','--local']);
function start(args) {const child=spawn(cli('npx'),args,{stdio:'inherit',env:{...process.env,WRANGLER_SEND_METRICS:'false'}});children.push(child);child.on('exit',code=>{if(!stopping){console.error(`Local server stopped (${code}); closing companion.`);stop();}});}
let stopping=false;
function stop(){if(stopping)return;stopping=true;for(const child of children)child.kill('SIGTERM');}
process.on('SIGINT',stop);process.on('SIGTERM',stop);
start(['wrangler','dev','--local','--ip','127.0.0.1','--port',process.env.API_PORT||'8787','--log-level','error']);
start(['vite','--host','127.0.0.1','--port',process.env.WEB_PORT||'5173']);
