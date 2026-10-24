import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {getTemplates,loadCatalog} from '../src/core/catalog.mjs';
import {archiveFiles,planGeneration} from '../src/core/plan.mjs';
import {applyGeneration} from '../src/core/apply.mjs';
import {startHere} from '../src/core/next-steps.mjs';
import {diagnoseHost} from '../src/core/diagnostics.mjs';

const root=path.resolve(import.meta.dirname,'../..');
function temp(t) {
  const folder=fs.mkdtempSync(path.join(os.tmpdir(),'tsukuhako-ports-'));
  t.after(()=>fs.rmSync(folder,{recursive:true,force:true}));
  return folder;
}

for(const id of ['F1','F2','B1','S1','S2']) {
  test(`ports: ${id} defaults and explicit values agree across UI catalog, generated env, Compose and guide`,t=>{
    const base=temp(t),entry=getTemplates(root).templates.find(t=>t.id===id);
    assert.equal(entry.defaultPort,3000);
    for(const port of [undefined,3311]) {
      const destination=path.join(base,port?'explicit':'default');
      const plan=planGeneration(root,{templateId:id,destination,...(port?{port}:{})});
      const result=applyGeneration(root,plan),expected=port??3000;
      assert.equal(plan.ports.app,expected);
      assert.match(fs.readFileSync(destination+'/.env','utf8'),new RegExp(`^HOST_PORT=${expected}$`,'m'));
      assert.match(fs.readFileSync(destination+'/compose.yaml','utf8'),/127\.0\.0\.1:\$\{HOST_PORT[^}]*\}:3000/);
      const guide=fs.readFileSync(result.startHere,'utf8');
      assert.equal(guide,startHere(plan,{platform:'linux'}));
      assert.ok(guide.includes(`http://localhost:${expected}`));
      const verify=plan.nextSteps.find(step=>step.key==='verify');
      if(id==='B1')assert.deepEqual(verify.command,{executable:'curl',args:['-i',`http://localhost:${expected}/api/health`]});
      else assert.ok(verify.url.startsWith(`http://localhost:${expected}`));
      if(id==='S2')assert.deepEqual(plan.ports,{app:expected,shadow:54320,api:54321,database:54322,studio:54323});
    }
  });
}

test('ports: standalone ZIPs match their sources; configure uses 3000, respects --port and preserves saved settings',t=>{
  const base=temp(t);
  for(const template of loadCatalog(root).templates.filter(t=>t.id!=='I1')) {
    const files=archiveFiles(root,template),folder=path.join(base,template.id);
    assert.equal(template.defaultPort,3000);
    assert.equal(template.hostPorts.app,3000);
    for(const [relative,data] of files) {
      assert.deepEqual(data,fs.readFileSync(path.join(root,template.sourcePath,relative)),`${template.id}/${relative}`);
      const file=path.join(folder,relative);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,data);
    }
    const envFile=folder+'/.env';
    const configure=(...args)=>execFileSync('bash',['scripts/configure.sh',...args],{cwd:folder});
    configure();assert.match(fs.readFileSync(envFile,'utf8'),/^HOST_PORT=3000$/m);
    fs.unlinkSync(envFile);configure('--port','3311');assert.match(fs.readFileSync(envFile,'utf8'),/^HOST_PORT=3311$/m);
    const previous=fs.readFileSync(envFile,'utf8').replace('HOST_PORT=3311','HOST_PORT=3001');fs.writeFileSync(envFile,previous);
    configure();assert.equal(fs.readFileSync(envFile,'utf8'),previous);
  }
});

test('ports: SQL retains its database default and has no Web URL',t=>{
  const plan=planGeneration(root,{templateId:'I1',destination:path.join(temp(t),'sql')});
  assert.deepEqual(plan.ports,{database:55432});
  assert.ok(!plan.nextSteps.some(step=>step.url?.startsWith('http://localhost:3000')));
  assert.equal(getTemplates(root).templates.find(t=>t.id==='S3').eligible,false);
});

test('ports: an occupied default is reported; explicit port selection remains unchanged',async t=>{
  const destination=path.join(temp(t),'web'),runner=async()=>({ok:true,output:'ms-vscode-remote.remote-containers'});
  const portProbe=async port=>port!==3000;
  const request={templateId:'F2',destination};
  const occupied=await diagnoseHost(root,request,{runner,portProbe});
  assert.equal(occupied.checks.find(c=>c.id==='port-app').status,'FAIL');
  assert.equal(planGeneration(root,request).ports.app,3000);
  const selected=await diagnoseHost(root,{...request,port:3311},{runner,portProbe});
  assert.equal(selected.checks.find(c=>c.id==='port-app').status,'PASS');
  assert.equal(planGeneration(root,{...request,port:3311}).ports.app,3311);
});
