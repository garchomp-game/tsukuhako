import {spawn} from 'node:child_process';
import {resolve} from 'node:path';
const children=[];
const wrangler=resolve('node_modules/wrangler/bin/wrangler.js');
const vite=resolve('node_modules/vite/bin/vite.js');
const env={...process.env,WRANGLER_SEND_METRICS:'false'};
function run(args) { return new Promise((resolve,reject)=>{const child=spawn(process.execPath,args,{stdio:'inherit',env});child.on('error',reject);child.on('exit',code=>code===0?resolve():reject(new Error(`Local setup exited ${code}`)));}); }
await run(['scripts/import-content.mjs']);
await run([wrangler,'d1','migrations','apply','DB','--local']);
let stopping=false;
function stop(){if(stopping)return;stopping=true;for(const child of children)child.kill('SIGTERM');}
function start(args) {const child=spawn(process.execPath,args,{stdio:'inherit',env});children.push(child);child.on('error',error=>{console.error(error.message);stop();});child.on('exit',code=>{if(!stopping){console.error(`Local server stopped (${code}); closing companion.`);stop();}});}
process.on('SIGINT',stop);process.on('SIGTERM',stop);
start([wrangler,'dev','--local','--ip','127.0.0.1','--port',process.env.API_PORT||'8787','--log-level','error']);
start([vite,'--host','127.0.0.1','--port',process.env.WEB_PORT||'5173']);
