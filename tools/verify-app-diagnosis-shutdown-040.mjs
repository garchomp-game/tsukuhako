import {_electron as electron,expect} from '@playwright/test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {setTimeout as delay} from 'node:timers/promises';
const root=path.resolve(import.meta.dirname,'..'),out=root+'/validation/learning-0.4.0';
const tmp=fs.mkdtempSync(os.tmpdir()+'/tsukuhako-app-stop-');
fs.writeFileSync(tmp+'/docker','#!/bin/sh\nprintf "%s\\n" "$$" >> "$TSUKUHAKO_TEST_PIDS"\ntrap "" TERM\nsleep 30\n',{mode:0o755});
const env={...process.env,PATH:tmp+':'+process.env.PATH,TSUKUHAKO_TEST_PIDS:tmp+'/pids'};delete env.ELECTRON_RUN_AS_NODE;
let app;
try{
  app=await electron.launch({executablePath:out+'/runs/desktop-build/tsukuhako-linux-x64-0.4.0/tsukuhako',args:['--user-data-dir='+tmp+'/profile'],env,chromiumSandbox:true});
  const pid=app.process().pid;
  await app.firstWindow();
  for(let n=0;n<100&&!fs.existsSync(tmp+'/pids');n++)await delay(50);
  expect(fs.existsSync(tmp+'/pids')).toBe(true);
  const began=Date.now();await app.close();app=null;await delay(700);
  expect(Date.now()-began).toBeLessThan(5000);
  const pids=fs.readFileSync(tmp+'/pids','utf8').trim().split('\n').map(Number);
  expect(pids.every(p=>!fs.existsSync('/proc/'+p))).toBe(true);
  expect(fs.existsSync('/proc/'+pid)).toBe(false);
  fs.writeFileSync(out+'/app-diagnosis-shutdown.json',JSON.stringify({status:'PASS',fixture:'Owned docker diagnostic blocks and ignores SIGTERM; app must wait for process-group shutdown',elapsedMs:Date.now()-began,pids,processRemaining:false},null,2)+'\n');
  console.log('App close during active diagnosis PASS');
}finally{await app?.close().catch(()=>{});fs.rmSync(tmp,{recursive:true,force:true})}
