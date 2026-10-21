import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';import {execFileSync} from 'node:child_process';
import {verifyBundle} from './verify-desktop-bundle.mjs';
const [folder,platform]=process.argv.slice(2),dir=path.resolve(folder);const sha=f=>createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const temporary=fs.mkdtempSync(path.join(os.tmpdir(),'tsukuhako 配布044 日本語 '));
try{
 const received=path.join(temporary,'受取 フォルダ');fs.cpSync(dir,received,{recursive:true});const m=JSON.parse(fs.readFileSync(received+'/manifest.json','utf8'));
 assert.equal(m.productVersion,'0.4.4');assert.equal(m.platform,platform);assert.deepEqual(fs.readdirSync(received).sort(),['START_HERE.txt','SHA256SUMS','manifest.json',m.file].sort());
 const sums=fs.readFileSync(received+'/SHA256SUMS','utf8').trim().split('\n');assert.equal(sums.length,3);
 for(const line of sums){const [digest,file]=line.split('  ');assert.equal(digest,sha(path.join(received,file)));}
 assert.equal(m.sha256,sha(received+'/'+m.file));assert.equal(m.bytes,fs.statSync(received+'/'+m.file).size);const guide=fs.readFileSync(received+'/START_HERE.txt','utf8');assert.ok(guide.includes(m.file)&&guide.includes(m.productVersion)&&guide.includes('配布案内ドラフト'));
 let bundle;
 if(platform==='linux'){
  execFileSync('tar',['-xzf',received+'/'+m.file,'-C',temporary]);const app=temporary+'/tsukuhako-linux-x64-'+m.productVersion+'/resources/app';bundle=await verifyBundle(app);
  execFileSync('python3',[path.resolve(import.meta.dirname,'verify-helper-archive.py'),app]);
  const list=JSON.parse(fs.readFileSync(app+'/bundle-files.json'));assert.ok(!list.some(f=>/(^|\/)(\.git|\.github|tests|validation|\.env)(\/|$)|\.(tsx|tsbuildinfo)$/.test(f.path)));
  assert.ok(fs.existsSync(path.dirname(path.dirname(app))+'/LICENSE'));assert.ok(fs.existsSync(path.dirname(path.dirname(app))+'/LICENSES.chromium.html'));
 }
 console.log(JSON.stringify({status:'PASS',category:'STATIC',platform,productVersion:m.productVersion,sourceCommit:m.sourceCommit,artifact:{file:m.file,sha256:m.sha256,bytes:m.bytes},recipientFiles:4,sha256Files:3,path:'temporary Japanese + space path, arbitrary cwd',runtimeInspection:bundle||'Windows installer payload inspected separately; no Linux execution of exe'},null,2));
}finally{fs.rmSync(temporary,{recursive:true,force:true})}
