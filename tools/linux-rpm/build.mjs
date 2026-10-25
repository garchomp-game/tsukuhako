// Uses a read-only stage, source seed and node_modules. No host package installation.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {verifyBundle} from '../verify-desktop-bundle.mjs';
const root=path.resolve(import.meta.dirname,'../..'),stage=path.resolve(process.argv[2]||root+'/dist/desktop-app'),out=path.resolve(process.argv[3]||root+'/dist/linux-rpm');
const info=await verifyBundle(stage);assert.equal(info.dirty,false);
const artifact=`tsukuhako-linux-x86_64-${info.productVersion}.rpm`;
fs.mkdirSync(out,{recursive:true});assert.ok(!fs.existsSync(path.join(out,artifact)),'Use a fresh output directory; do not overwrite a release artifact');
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'tsukuhako-rpm-build-')),seed=path.join(temp,'project'),image='tsukuhako-rpm-toolchain:node24-bookworm';
const run=(args)=>{const result=spawnSync('docker',args,{stdio:'inherit'});assert.equal(result.status,0,`docker ${args[0]} failed`)};
try{
 fs.mkdirSync(seed);
 for(const name of ['package.json','electron-builder.rpm.json','public/brand-mark.png','installer/rpm-after-remove.sh']){const target=path.join(seed,name);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(path.join(root,'generator-desktop',name),target)}
 run(['build','-t',image,'-f',root+'/tools/linux-rpm/Dockerfile.build',root+'/tools/linux-rpm']);
 const script=`set -eu
 mkdir -p /tmp/work/project /tmp/work/dist /tmp/build-home
 cp -a /input/project/. /tmp/work/project/
 cp -a /input/app /tmp/work/dist/desktop-app
 ln -s /input/node_modules /tmp/work/project/node_modules
 cd /tmp/work/project
 node node_modules/electron-builder/cli.js --config electron-builder.rpm.json --linux rpm --x64 --publish never
 cp /tmp/work/dist/linux-rpm/*.rpm /output/
 `;
 run(['run','--rm','--cpus','4','--memory','4g','--pids-limit','256','--user',`${process.getuid()}:${process.getgid()}`,'-e','HOME=/tmp/build-home',
 '--mount',`type=bind,src=${seed},dst=/input/project,readonly`,'--mount',`type=bind,src=${stage},dst=/input/app,readonly`,
 '--mount',`type=bind,src=${root}/generator-desktop/node_modules,dst=/input/node_modules,readonly`,'--mount',`type=bind,src=${out},dst=/output`,image,'bash','-c',script]);
 assert.ok(fs.statSync(path.join(out,artifact)).size>1000000);
 console.log(JSON.stringify({status:'PASS',category:'CONTAINER_RPM_BUILD',file:path.join(out,artifact),sourceCommit:info.sourceCommit,hostPackageInstallation:false},null,2));
}finally{fs.rmSync(temp,{recursive:true,force:true})}
