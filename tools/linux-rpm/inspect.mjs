// Static inspection only. RPM extraction runs in Docker; no host installation.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {verifyBundle} from '../verify-desktop-bundle.mjs';
const run=(cmd,args)=>execFileSync(cmd,args,{encoding:'utf8',maxBuffer:16*1024*1024});
export async function inspectRpm(input){
 const rpm=fs.realpathSync(input),temp=fs.mkdtempSync(path.join(os.tmpdir(),'tsukuhako-rpm-inspect-'));
 try{
  const script=`set -eu
   rpm -qp --qf '%{NAME}\\n%{VERSION}\\n%{ARCH}\\n%{LICENSE}\\n' /input/final.rpm > /output/metadata.txt
   rpm -qp --requires /input/final.rpm > /output/requires.txt
   rpm -qp --scripts /input/final.rpm > /output/scripts.txt
   rpm -qp --qf '[%{FILEUSERNAME}:%{FILEGROUPNAME} %{FILENAMES}\\n]' /input/final.rpm > /output/owners.txt
   rpm --checksig --nosignature /input/final.rpm > /output/digest.txt
   mkdir /output/payload
   cd /output/payload
   rpm2cpio /input/final.rpm | cpio -id --quiet --no-preserve-owner
  `;
  run('docker',['run','--rm','--network','none','--user',`${process.getuid()}:${process.getgid()}`,'--mount',`type=bind,src=${rpm},dst=/input/final.rpm,readonly`,'--mount',`type=bind,src=${temp},dst=/output`,'tsukuhako-rpm-toolchain:node24-bookworm','bash','-c',script]);
  const read=name=>fs.readFileSync(path.join(temp,name),'utf8'),[name,version,architecture,license]=read('metadata.txt').trim().split('\n');
  assert.equal(name,'tsukuhako');assert.equal(architecture,'x86_64');assert.equal(license,'MIT');
  const requires=read('requires.txt').trim().split('\n');
  for(const dependency of ['gtk3','nss','libsecret','alsa-lib','mesa-libgbm','xdg-utils'])assert.ok(requires.includes(dependency),dependency);
  assert.ok(read('owners.txt').trim().split('\n').every(line=>line.startsWith('root:root ')));
  assert.match(read('digest.txt'),/OK/);
  const base=path.join(temp,'payload/opt/tsukuhako'),app=base+'/resources/app',bundle=await verifyBundle(app);
  assert.equal(bundle.dirty,false);assert.equal(bundle.productVersion,version);
  assert.equal(JSON.parse(fs.readFileSync(app+'/package.json')).license,'MIT');
  for(const file of ['LICENSE.electron.txt','LICENSES.chromium.html'])assert.ok(fs.statSync(base+'/'+file).size>100);
  const desktop=read('payload/usr/share/applications/tsukuhako.desktop');
  assert.match(desktop,/^Name=ツクハコ$/m);assert.match(desktop,/^Icon=tsukuhako$/m);assert.match(desktop,/^Terminal=false$/m);
  assert.doesNotMatch(desktop,/--no-sandbox|--disable-sandbox/);
  const scripts=read('scripts.txt');
  assert.match(scripts,/if \[ "\$1" != "0" \]/); // preserve the link during RPM upgrades
  assert.doesNotMatch(scripts,/--no-sandbox|sysctl\s|usermod\s|groupadd\s|docker\s|\$HOME|\/home\//);
  const glibc=[...new Set(run('readelf',['--version-info',base+'/tsukuhako']).match(/GLIBC_[0-9.]+/g))].sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));
  return{status:'PASS',category:'RPM_STATIC_INSPECTION',checkedAt:new Date().toISOString(),file:path.basename(rpm),bytes:fs.statSync(rpm).size,sha256:createHash('sha256').update(fs.readFileSync(rpm)).digest('hex'),metadata:{name,version,architecture,license},requires,bundle,desktop,scripts,maximumMainBinaryGlibc:glibc.at(-1),signing:'UNSIGNED',hostInstallation:'NOT_RUN',desktopGui:'NOT_RUN'};
 }finally{fs.rmSync(temp,{recursive:true,force:true})}
}
if(process.argv[1]&&pathToFileURL(path.resolve(process.argv[1])).href===import.meta.url)console.log(JSON.stringify(await inspectRpm(process.argv[2]),null,2));
