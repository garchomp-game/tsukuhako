import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {spawn} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import assert from 'node:assert/strict';
import {setTimeout as delay} from 'node:timers/promises';

const root=path.resolve(import.meta.dirname,'..');
const stage=root+'/validation/release-0.4.4/runs/helper-build/stage';
const meta=JSON.parse(fs.readFileSync(root+'/generator-desktop/wsl-helper/bundle.json'));
const tmp=fs.mkdtempSync(os.tmpdir()+'/tsukuhako-shutdown-');
const fixture=tmp+'/docker';
fs.writeFileSync(fixture,'#!/bin/sh\nprintf "%s\\n" "$$" >> "$TSUKUHAKO_TEST_PIDS"\nsleep 30\n',{mode:0o755});
const binding={distro:'Fixture Linux',distroId:'0011223344556677',user:os.userInfo().username,uid:process.getuid(),home:os.homedir(),arch:'x64',helperVersion:'0.4.4'};
const child=spawn(stage+'/node',[stage+'/helper.mjs',meta.manifestSha256],{env:{...process.env,PATH:tmp+':'+process.env.PATH,TSUKUHAKO_TEST_PIDS:tmp+'/pids',WSL_DISTRO_NAME:binding.distro},stdio:['pipe','pipe','pipe']});
let closed=false,code,output='';
child.on('close',value=>{closed=true;code=value});
child.stdout.on('data',b=>output+=b);
child.stderr.resume();
try{
  child.stdin.write(JSON.stringify({id:randomUUID(),method:'prepare',payload:{templateId:'F2'},binding})+'\n');
  for(let n=0;n<100&&!fs.existsSync(tmp+'/pids');n++)await delay(50);
  assert.ok(fs.existsSync(tmp+'/pids'),'fixture command must actually be running');
  const began=Date.now();
  child.stdin.end(JSON.stringify({method:'shutdown'})+'\n');
  for(let n=0;n<120&&!closed;n++)await delay(50);
  assert.equal(closed,true,'cooperative shutdown deadline');
  assert.equal(code,0);
  const pids=fs.readFileSync(tmp+'/pids','utf8').trim().split('\n').map(Number);
  assert.ok(pids.length>0);
  assert.ok(pids.every(pid=>!fs.existsSync('/proc/'+pid)),'owned diagnostic processes must exit');
  assert.ok(!fs.existsSync('/proc/'+child.pid),'helper must exit');
  fs.writeFileSync(root+'/validation/release-0.4.4/helper-shutdown.json',JSON.stringify({status:'PASS',elapsedMs:Date.now()-began,fixtureCommandWasRunning:true,ownedCommandPids:pids,processRemaining:false,scope:'Actual Linux helper shutdown while diagnostic fixture command blocks. Windows/WSL transport NOT_RUN.'},null,2)+'\n');
  console.log('helper active diagnosis shutdown PASS');
}finally{
  if(!closed)child.kill('SIGTERM');
  fs.rmSync(tmp,{recursive:true,force:true});
}
