import fs from 'node:fs';import path from 'node:path';import {createHash} from 'node:crypto';import {Worker} from 'node:worker_threads';import readline from 'node:readline';
const root=import.meta.dirname,manifest=fs.readFileSync(root+'/manifest.json');
const sha=b=>createHash('sha256').update(b).digest('hex');
if(process.platform!=='linux'||process.arch!=='x64'||sha(manifest)!==process.argv[2])process.exit(3);
for(const f of JSON.parse(manifest).files){if(f.path.startsWith('/')||f.path.split('/').some(p=>p==='..'||!p))process.exit(3);let current=root;for(const p of f.path.split('/')){current=path.join(current,p);if(fs.lstatSync(current).isSymbolicLink())process.exit(3)}if(sha(fs.readFileSync(current))!==f.sha256)process.exit(3)}
const flag=new Int32Array(new SharedArrayBuffer(4));const child=new Worker(new URL('./job.mjs',import.meta.url),{workerData:{root,flag:flag.buffer}});let active,closing=false;
const send=m=>process.stdout.write(JSON.stringify(m)+'\n');
const stop=()=>{closing=true;Atomics.store(flag,0,1);if(!active)child.terminate().then(()=>process.exit(0))};
const input=readline.createInterface({input:process.stdin,crlfDelay:Infinity});let bytes=0;process.stdin.on('data',b=>{bytes+=b.length;if(bytes>1048576)stop()});
input.on('line',line=>{if(line.length>32768)return stop();let m;try{m=JSON.parse(line)}catch{return stop()};if(m.method==='shutdown')return stop();if(m.method==='cancel'){if(active===m.id)Atomics.store(flag,0,1);return}if(closing)return;if(active)return send({id:m.id,ok:false,error:{code:'BUSY',message:'WSLヘルパーは処理中です。',nextAction:'完了を待ってください。'}});if(!/^[a-f0-9-]{36}$/.test(m.id)||!['plan','apply','diagnose','reset','prepare'].includes(m.method))return stop();active=m.id;Atomics.store(flag,0,0);child.postMessage(m)});
input.on('close',stop);process.on('SIGTERM',stop);process.on('SIGINT',stop);
child.on('message',m=>{active=null;send(m);if(closing)child.terminate().then(()=>process.exit(0))});child.on('error',()=>process.exit(4));child.on('exit',()=>process.exit(0));
