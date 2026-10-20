import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { zipSync, unzipSync, strToU8 } from 'fflate';
import { hash } from '../src/core/common.mjs';
import { getTemplates } from '../src/core/catalog.mjs';
import { destinationFromParts } from '../src/core/configuration.mjs';
import { planGeneration } from '../src/core/plan.mjs';
import { applyGeneration } from '../src/core/apply.mjs';
import { diagnoseHost, runProbe } from '../src/core/diagnostics.mjs';
import { commandText } from '../src/core/next-steps.mjs';
import { create } from '../src/generator.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const ids = ['F1','F2','B1','S1','S2','I1'];
function temp(t) { const dir=fs.mkdtempSync(path.join(os.tmpdir(),'tsukuhako-g020-')); t.after(()=>fs.rmSync(dir,{recursive:true,force:true})); return dir; }
function fake(t) {
 const dir=temp(t);fs.mkdirSync(path.join(dir,'dist'));
 const cat=JSON.parse(fs.readFileSync(path.join(root,'catalog.json')));
 fs.writeFileSync(path.join(dir,'catalog.json'),JSON.stringify(cat));
 for(const item of cat.templates)fs.copyFileSync(path.join(root,item.packagePath),path.join(dir,item.packagePath));
 return dir;
}
function replacement(bundle,bytes) {
 const cat=JSON.parse(fs.readFileSync(path.join(bundle,'catalog.json')));const item=cat.templates.find(x=>x.id==='F1');
 item.packageSha256=hash(bytes);fs.writeFileSync(path.join(bundle,item.packagePath),bytes);fs.writeFileSync(path.join(bundle,'catalog.json'),JSON.stringify(cat));
}
function tree(dir) { const found={};for(const item of fs.readdirSync(dir,{withFileTypes:true})){ const p=path.join(dir,item.name); if(item.isDirectory())for(const [key,value]of Object.entries(tree(p)))found[item.name+'/'+key]=value;else found[item.name]=fs.readFileSync(p,'utf8');}return found; }
const req=(dir,id='F1')=>({templateId:id,destination:path.join(dir,'日本語 空白 '+id)});
const run=(args,cwd=root)=>spawnSync(process.execPath,[path.join(root,'generator/cli.mjs'),...args],{cwd,encoding:'utf8',timeout:15000});

test('G01/G03/G09: six stable read-only plans; archive bytes and per-template guide match',t=>{
 const dir=temp(t);const cat=JSON.parse(fs.readFileSync(path.join(root,'catalog.json')));
 for(const id of ids){
  const request=req(dir,id), before=fs.readdirSync(dir);const plan=planGeneration(root,request);
  assert.deepEqual(planGeneration(root,request),plan);assert.deepEqual(fs.readdirSync(dir),before);
  const result=applyGeneration(root,plan), item=cat.templates.find(x=>x.id===id);
  const entries=unzipSync(fs.readFileSync(path.join(root,item.packagePath)));
  for(const [name,bytes]of Object.entries(entries))assert.equal(hash(fs.readFileSync(path.join(result.destination,name.slice(id.length+1)))),hash(bytes));
  assert.equal(Object.keys(tree(result.destination)).length,Object.keys(entries).length+2);
  assert.equal(result.templateVersion,item.implementationVersion);
  const guide=fs.readFileSync(result.startHere,'utf8');
  for(const step of plan.nextSteps){if(step.document)assert.ok(fs.existsSync(path.join(result.destination,step.document)));if(step.command)assert.ok(guide.includes(commandText(step.command)));}
  assert.equal(plan.nextSteps[0].command.args[0],id==='I1'?'scripts/doctor.sh':'scripts/doctor-host.sh');
  assert.ok(!guide.includes('scripts/configure.sh'));
  if(id==='I1')assert.ok(!guide.includes('http://'));
  if(id==='B1')assert.ok(guide.includes(`http://localhost:${plan.ports.app}/api/health`));
  if(id==='S2')assert.deepEqual(plan.nextSteps[1].command.args,['scripts/db.sh','start']);
 }
});
test('G04: I1 secret is created only in mode0600 .env; absent from public outputs',t=>{
 const dir=temp(t),request=req(dir,'I1');const plan=planGeneration(root,request);assert.equal(plan.secretGeneratedAtApply,true);assert.deepEqual(fs.readdirSync(dir),[]);
 const result=applyGeneration(root,plan),env=fs.readFileSync(path.join(result.destination,'.env'),'utf8');
 const secret=env.match(/^POSTGRES_PASSWORD=(.+)$/m)[1];assert.match(secret,/^[a-f0-9]{48}$/);
 assert.equal(fs.statSync(path.join(result.destination,'.env')).mode&0o777,0o600);
 assert.ok(!JSON.stringify(plan).includes(secret));assert.ok(!JSON.stringify(result).includes(secret));assert.ok(!fs.readFileSync(result.startHere,'utf8').includes(secret));
 assert.ok(!fs.readdirSync(dir).some(x=>x.startsWith('.tsukuhako-stage-')));
});
test('G02: goals map to known IDs; core rejects S3 even if its eligibility is tampered',t=>{
 const data=getTemplates(root);assert.deepEqual(data.goals.map(x=>x.templates),[['F2','F1'],['B1'],['S1'],['S2'],['I1']]);
 const bundle=fake(t),cat=JSON.parse(fs.readFileSync(path.join(bundle,'catalog.json')));Object.assign(cat.templates.find(x=>x.id==='S3'),{generatorEligible:true,validationStatus:'PASS'});fs.writeFileSync(path.join(bundle,'catalog.json'),JSON.stringify(cat));
 assert.throws(()=>planGeneration(bundle,req(temp(t),'S3')),{code:'UNSUPPORTED_TEMPLATE'});
});
test('G05: modified catalog, ZIP, destination, parent identity and public plan are rejected',t=>{
 for(const kind of ['catalog','zip','destination','parent','plan']){
  const bundle=fake(t),dir=temp(t),request=req(dir),plan=planGeneration(bundle,request);
  if(kind==='catalog')fs.appendFileSync(path.join(bundle,'catalog.json'),'\n');
  if(kind==='zip'){const cat=JSON.parse(fs.readFileSync(path.join(bundle,'catalog.json')));fs.appendFileSync(path.join(bundle,cat.templates[0].packagePath),'changed');}
  if(kind==='destination'){fs.mkdirSync(request.destination);fs.writeFileSync(path.join(request.destination,'keep'),'user');}
  if(kind==='parent'){fs.renameSync(dir,dir+'-old');t.after(()=>fs.rmSync(dir+'-old',{recursive:true,force:true}));fs.mkdirSync(dir);}
  if(kind==='plan')plan.nextSteps[0].command={executable:'sh',args:['-c','touch do-not-run']};
  assert.throws(()=>applyGeneration(bundle,plan),{code:'PLAN_STALE'},kind);
  if(kind==='destination')assert.equal(fs.readFileSync(path.join(request.destination,'keep'),'utf8'),'user');else assert.equal(fs.existsSync(request.destination),false);
  assert.ok(!fs.readdirSync(dir).some(x=>x.startsWith('.tsukuhako-stage-')));
 }
});
test('G06: reserved guide, duplicate ZIP names, symlink entry and oversized metadata are rejected before writes',t=>{
 for(const kind of ['reserved','duplicate','symlink','oversized']){
  const bundle=fake(t),dir=temp(t);let bytes;
  if(kind==='reserved')bytes=Buffer.from(zipSync({'F1/START_HERE.md':strToU8('conflict')}));
  else {
   bytes=Buffer.from(zipSync({'F1/a':strToU8('a'),'F1/b':strToU8('b')}));
   const first=bytes.indexOf(Buffer.from([0x50,0x4b,0x01,0x02])),second=bytes.indexOf(Buffer.from([0x50,0x4b,0x01,0x02]),first+4);
   if(kind==='duplicate')bytes[second+46+3]='a'.charCodeAt(0);
   if(kind==='symlink')bytes.writeUInt32LE(0xa1ff0000,first+38);
   if(kind==='oversized')bytes.writeUInt32LE(50*1024*1024,first+24);
  }
  replacement(bundle,bytes);assert.throws(()=>planGeneration(bundle,req(dir)),{code:'UNSAFE_ARCHIVE'});assert.deepEqual(fs.readdirSync(dir),[]);
 }
});
test('G06: parent replacement by symlink is refused; no unrelated files are touched',t=>{
 const dir=temp(t),victim=temp(t);const plan=planGeneration(root,req(dir));fs.renameSync(dir,dir+'-old');t.after(()=>fs.rmSync(dir+'-old',{recursive:true,force:true}));fs.symlinkSync(victim,dir);
 fs.writeFileSync(path.join(victim,'keep'),'user');assert.throws(()=>applyGeneration(root,plan),{code:'PLAN_STALE'});assert.deepEqual(fs.readdirSync(victim),['keep']);
});
test('G06: structured partial result preserves a changed generated file',t=>{
 const dir=temp(t),plan=planGeneration(root,req(dir));let kept;
 assert.throws(()=>applyGeneration(root,plan,{afterFile(file){kept=file;fs.writeFileSync(file,'my edit');throw new Error('injected');}}),error=>error.code==='PARTIAL_PRESERVED'&&error.details.preserved.includes(kept));
 assert.equal(fs.readFileSync(kept,'utf8'),'my edit');assert.ok(!fs.readdirSync(dir).some(x=>x.startsWith('.tsukuhako-stage-')));
});
test('G07: Docker/VSCode unavailable never prevents generation; unentered destination stays unknown',async t=>{
 const dir=temp(t),request=req(dir);const runner=async command=>({ok:!['docker','code'].includes(command),output:''});
 const report=await diagnoseHost(root,request,{runner,portProbe:async()=>false});
 assert.equal(report.generationReady,true);assert.equal(report.runtimeReady,false);assert.equal(applyGeneration(root,planGeneration(root,request)).status,'created');
 const unchecked=await diagnoseHost(root,undefined,{runner,scope:'generation'});assert.equal(unchecked.generationReady,null);assert.equal(unchecked.runtimeReady,null);
});
test('G07: diagnostic subprocess times out and its process exits',async()=>{
 const result=await runProbe(process.execPath,['-e','console.log(process.pid);setInterval(()=>{},1000)'],120);
 assert.equal(result.ok,false);assert.equal(result.timedOut,true);const pid=Number(result.output.trim());assert.ok(pid>0);assert.throws(()=>process.kill(pid,0),{code:'ESRCH'});
});
test('G08: old synchronous create and explicit JSON create produce identical files',t=>{
 const dir=temp(t),request=req(dir,'F2');const old=create(root,request.templateId,request.destination,{port:3411});assert.equal(old.port,3411);const before=tree(old.destination);
 fs.rmSync(old.destination,{recursive:true});const proc=run(['create','F2',request.destination,'--port','3411','--json']);assert.equal(proc.status,0,proc.stderr);assert.equal(JSON.parse(proc.stdout).status,'created');assert.deepEqual(tree(old.destination),before);
});
test('G10: non-TTY wizard terminates; JSON emits one value; stale expectation is exit1',t=>{
 const dir=temp(t);assert.equal(run(['wizard']).status,1);
 for(const command of ['list','plan']){const args=command==='list'?['list','--json']:['plan','F1',req(dir).destination,'--json'];const result=run(args);assert.equal(result.status,0);assert.ok(JSON.parse(result.stdout));assert.equal(result.stderr,'');}
 const stale=run(['create','F1',req(dir).destination,'--expect-plan','0'.repeat(64),'--json']);assert.equal(stale.status,1);assert.equal(JSON.parse(stale.stdout).error.code,'PLAN_STALE');assert.deepEqual(fs.readdirSync(dir),[]);
 const invalid=run(['plan','F1',req(dir).destination,'--port','80','--json']);assert.equal(invalid.status,1);assert.equal(JSON.parse(invalid.stdout).error.code,'INVALID_OPTIONS');
});
test('G10: write permission failure is exit2 without a partial directory',t=>{
 if(process.getuid?.()===0){t.skip('requires unprivileged user');return;}
 const dir=temp(t);fs.chmodSync(dir,0o500);
 try { const result=run(['create','F1',req(dir).destination,'--json']);assert.equal(result.status,2);assert.equal(JSON.parse(result.stdout).error.code,'WRITE_FAILED');assert.deepEqual(fs.readdirSync(dir),[]); }
 finally { fs.chmodSync(dir,0o700); }
});
test('G11: Japanese, spaces and shell metacharacters stay literal data',t=>{
 const dir=temp(t),destination=destinationFromParts(dir,"日本語 $(touch INJECTED) ; ' & `echo x`");
 const result=run(['create','F1',destination,'--json'],dir);assert.equal(result.status,0,result.stderr);assert.ok(fs.existsSync(path.join(destination,'START_HERE.md')));assert.equal(fs.existsSync(path.join(dir,'INJECTED')),false);
 assert.equal(destinationFromParts('~/','日本語'),path.join(os.homedir(),'日本語'));
 for(const name of ['.','..','a/b','a\\b','a\nb',''])assert.throws(()=>destinationFromParts(dir,name),{code:'INVALID_OPTIONS'});
 assert.equal(commandText({executable:'code',args:['--',destination]}).includes("'\\''"),true);
});
