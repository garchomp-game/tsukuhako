import {_electron as electron} from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
const out=path.resolve('validation/learning-0.4.0');
const bin=path.resolve('../tsukuhako-starters-0.3.0/validation/brand-0.3.0/runs/desktop-build/tsukuhako-linux-x64-0.3.0/tsukuhako');
const env={...process.env};delete env.ELECTRON_RUN_AS_NODE;
const start=Date.now();const app=await electron.launch({executablePath:bin,args:['--user-data-dir='+out+'/baseline-profile'],env,chromiumSandbox:true});
const page=await app.firstWindow();await page.getByRole('button',{name:'保存先を決める',exact:true}).waitFor();
const startupMs=Date.now()-start, samples=[];const seen=new Set();
for(let i=0;i<15;i++){
 const metrics=await app.evaluate(({app})=>app.getAppMetrics());
 const rows=metrics.map(m=>{seen.add(m.pid);let pssKb=null;try{pssKb=Number(fs.readFileSync('/proc/'+m.pid+'/smaps_rollup','utf8').match(/^Pss:\s+(\d+)/m)[1])}catch{}return{pid:m.pid,type:m.type,cpu:m.cpu.percentCPUUsage,rssKb:m.memory.workingSetSize,pssKb}});
 samples.push({elapsedMs:Date.now()-start,rows});await new Promise(r=>setTimeout(r,1000));
}
await app.close();await new Promise(r=>setTimeout(r,1500));
fs.writeFileSync(out+'/baseline-030.json',JSON.stringify({version:'0.3.0',startupMs,samples,remaining:[...seen].filter(p=>fs.existsSync('/proc/'+p)),conditions:'Linux Mint22.3 x64; sandbox enabled; new isolated profile; Docker2 DB containers; VS Code not running; existing browser untouched; 15 one-second samples'},null,2));
console.log('baseline saved');
