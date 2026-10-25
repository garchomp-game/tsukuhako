import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const root=path.resolve(import.meta.dirname,'..'),hash=bytes=>createHash('sha256').update(bytes).digest('hex');
function fixture(t){
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'tsukuhako-windows-delivery-'));
 t.after(()=>fs.rmSync(tmp,{recursive:true,force:true}));
 for(const directory of ['tools','docs/windows','dist/desktop-app','validation/platforms-1.0.2'])fs.mkdirSync(path.join(tmp,directory),{recursive:true});
 for(const file of ['tools/artifact-manifest.mjs','tools/delivery-pack.mjs','docs/windows/INSTALL.txt','LICENSE'])fs.copyFileSync(path.join(root,file),path.join(tmp,file));
 fs.writeFileSync(path.join(tmp,'validation/platforms-1.0.2/REPORT.md'),'# Test report\n');
 const info={productVersion:'1.0.2',sourceCommit:'a'.repeat(40),dirty:false};
 fs.writeFileSync(path.join(tmp,'dist/desktop-app/build-info.json'),JSON.stringify(info));
 const artifact=path.join(tmp,'tsukuhako-windows-x64-1.0.2-setup.exe');fs.writeFileSync(artifact,'MZ fixture, not an executable');
 const run=(name,args)=>execFileSync(process.execPath,[path.join(tmp,'tools',name),...args],{encoding:'utf8',stdio:['ignore','pipe','pipe']});
 const make=()=>{run('artifact-manifest.mjs',[artifact,'windows']);const file=artifact+'.manifest.json',manifest=JSON.parse(fs.readFileSync(file));manifest.runtimeVerification={status:'PASS',category:'CI',summary:'Windows Server CIのみのfixture。実行可能ファイルは実行していない。'};fs.writeFileSync(file,JSON.stringify(manifest));return manifest};
 return {tmp,artifact,run,make};
}
test('Windows delivery: exact installer bytes, MIT notice, concrete first-run guide and checksums',t=>{
 const {tmp,artifact,run,make}=fixture(t),manifest=make(),dest=path.join(tmp,'public-delivery');
 run('delivery-pack.mjs',[artifact,'windows',dest]);
 assert.deepEqual(fs.readdirSync(dest).sort(),['INSTALL-windows.txt','LICENSE','SHA256SUMS-windows','manifest-windows.json',path.basename(artifact)].sort());
 assert.equal(hash(fs.readFileSync(path.join(dest,path.basename(artifact)))),manifest.sha256);
 const guide=fs.readFileSync(path.join(dest,'INSTALL-windows.txt'),'utf8');
 assert.ok(guide.includes('1.0.2')&&guide.includes(path.basename(artifact)));
 assert.ok(guide.includes('はじめてのWeb画面で始める')&&guide.includes('WSL用ファイルを準備'));
 assert.doesNotMatch(guide,/\{\{|F2|配布案内ドラフト|private Actions/);
 assert.match(fs.readFileSync(path.join(dest,'LICENSE'),'utf8'),/MIT License/);
 const delivered=JSON.parse(fs.readFileSync(path.join(dest,'manifest-windows.json')));
 assert.equal(delivered.delivery.report,'validation/platforms-1.0.2/REPORT.md');assert.equal(delivered.runtimeVerification.status,'PASS');
 for(const row of fs.readFileSync(path.join(dest,'SHA256SUMS-windows'),'utf8').trim().split('\n')){
  const [digest,name]=row.split('  ');assert.equal(hash(fs.readFileSync(path.join(dest,name))),digest,name);
 }
});
test('Windows delivery rejects tampered bytes and a missing passing CI smoke',t=>{
 const {tmp,artifact,run,make}=fixture(t);make();fs.appendFileSync(artifact,'changed');
 assert.throws(()=>run('delivery-pack.mjs',[artifact,'windows',path.join(tmp,'changed')]),/Artifact and manifest differ/);
 make();const file=artifact+'.manifest.json',manifest=JSON.parse(fs.readFileSync(file));delete manifest.runtimeVerification;fs.writeFileSync(file,JSON.stringify(manifest));
 assert.throws(()=>run('delivery-pack.mjs',[artifact,'windows',path.join(tmp,'unchecked')]),/smoke must pass/);
});
test('Artifact manifest rejects dirty product source and non-executable Windows input',t=>{
 const {tmp,artifact,run}=fixture(t),file=path.join(tmp,'dist/desktop-app/build-info.json');
 const info=JSON.parse(fs.readFileSync(file));info.dirty=true;fs.writeFileSync(file,JSON.stringify(info));
 assert.throws(()=>run('artifact-manifest.mjs',[artifact,'windows']),/Uncommitted source/);
 info.dirty=false;fs.writeFileSync(file,JSON.stringify(info));fs.writeFileSync(artifact,'not executable');
 assert.throws(()=>run('artifact-manifest.mjs',[artifact,'windows']),/Expected a Windows executable/);
});
