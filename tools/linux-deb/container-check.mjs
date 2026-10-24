// No host package installation. The only bind mount is the requested deb, read-only.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawn, execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const directory=path.dirname(fileURLToPath(import.meta.url));
const sha=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const read=(exe,args)=>execFileSync(exe,args,{encoding:'utf8',maxBuffer:4*1024*1024}).trim();
const writeJSON=(file,data)=>fs.writeFileSync(file,JSON.stringify(data,null,2)+'\n');
let activeChild,interruptedSignal;
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>{interruptedSignal=signal;activeChild?.kill('SIGTERM');});
function options(argv){
  const result={};
  for(let i=0;i<argv.length;i+=2){
    assert(['--deb','--evidence'].includes(argv[i])&&argv[i+1], 'Use --deb FILE --evidence NEW_DIRECTORY');
    assert(!result[argv[i]],'Duplicate option');result[argv[i]]=argv[i+1];
  }
  assert(result['--deb']&&result['--evidence'],'Use --deb FILE --evidence NEW_DIRECTORY');
  return{deb:fs.realpathSync(result['--deb']),evidence:path.resolve(result['--evidence'])};
}
async function run(exe,args,log){
  assert(!interruptedSignal,`Interrupted by ${interruptedSignal}`);
  const stream=fs.createWriteStream(log,{flags:'wx'});
  const child=spawn(exe,args,{stdio:['ignore','pipe','pipe']});
  activeChild=child;
  let tail='';
  for(const output of [child.stdout,child.stderr])output.on('data',chunk=>{stream.write(chunk);tail=(tail+chunk).slice(-10000);});
  const code=await new Promise((resolve,reject)=>{child.on('error',reject);child.on('close',resolve);}).finally(()=>{activeChild=undefined;stream.end();});
  assert(!interruptedSignal,`Interrupted by ${interruptedSignal}`);
  if(code!==0)throw new Error(`${exe} exited ${code}; ${path.basename(log)}\n${tail}`);
}

const {deb,evidence}=options(process.argv.slice(2));
assert(fs.statSync(deb).isFile(),'deb must be a regular file');
assert(!fs.existsSync(evidence),'Evidence directory already exists; choose a new directory');
const fields=Object.fromEntries(['Package','Version','Architecture','Depends'].map(field=>[field,read('dpkg-deb',['-f',deb,field])]));
assert.equal(fields.Package,'tsukuhako');assert.equal(fields.Architecture,'amd64');
assert(/^[0-9][A-Za-z0-9.+:~_-]*$/.test(fields.Version),'Unexpected Debian version');
const input={file:path.basename(deb),bytes:fs.statSync(deb).size,sha256:sha(deb),...fields};
const suffix=new Date().toISOString().replace(/[^0-9]/g,'')+'-'+crypto.randomBytes(4).toString('hex');
const name='tsukuhako-deb-validation-'+suffix,image='tsukuhako-deb-validation:'+suffix;
const label='jp.tsukuhako.validation.id='+suffix;
const sourceFiles=['Dockerfile.validation','container-check.sh','container-check.mjs'].map(file=>({file:'tools/linux-deb/'+file,sha256:sha(path.join(directory,file))}));
fs.mkdirSync(evidence,{recursive:true});
const result={category:'ISOLATED_CONTAINER',interaction:'AUTOMATED',result:'FAIL',startedAt:new Date().toISOString(),input,
  sourceRevision:read('git',['-C',directory,'rev-parse','HEAD']),sourceFiles,
  purpose:'Debian package lifecycle and dependency resolution; no desktop application launch',
  fixture:'Lower package metadata version with identical final application payload; user settings/project/old tar and Docker-location sentinels',
  notRun:['Mint Captain GUI installation and authentication','Mint application-menu launch','Application sandbox under Mint AppArmor policy','Real older-release settings migration','Actual Docker volume lifecycle','Unaided human trial','Public recipient download'],
  hostPackageInstallation:false,hostHomeMounted:false,dockerSocketMounted:false,hostAppArmorMounted:false,privileged:false};
let created=false,imageBuilt=false,failed;
try{
  console.log('Building an Ubuntu 24.04 lifecycle image without application runtime libraries.');
  await run('docker',['build','--label',label,'-t',image,'-f',path.join(directory,'Dockerfile.validation'),directory],path.join(evidence,'image-build.log'));
  imageBuilt=true;
  const imageInfo=JSON.parse(read('docker',['image','inspect',image]))[0];
  result.image={id:imageInfo.Id,created:imageInfo.Created,base:'ubuntu:24.04',architecture:imageInfo.Architecture};
  const args=['create','--name',name,'--label',label,'--cpus','2','--memory','2g','--pids-limit','256',
    '--mount',`type=bind,src=${deb},dst=/input/final.deb,readonly`,image,input.sha256,fields.Package,fields.Version,fields.Architecture];
  result.containerId=read('docker',args);created=true;
  const container=JSON.parse(read('docker',['inspect',name]))[0];
  assert.equal(container.HostConfig.Privileged,false);
  assert.equal(container.Mounts.length,1);
  assert.equal(container.Mounts[0].Type,'bind');assert.equal(container.Mounts[0].Source,deb);
  assert.equal(container.Mounts[0].Destination,'/input/final.deb');assert.equal(container.Mounts[0].RW,false);
  result.isolation={bindMounts:[{destination:'/input/final.deb',readOnly:true}],networkMode:container.HostConfig.NetworkMode,
    privileged:container.HostConfig.Privileged,addedCapabilities:container.HostConfig.CapAdd||[],securityOptions:container.HostConfig.SecurityOpt||[]};
  console.log('Checking lower fixture → final deb → remove → reinstall → purge.');
  await run('docker',['start','--attach',name],path.join(evidence,'container-run.log'));
  const state=JSON.parse(read('docker',['inspect',name]))[0].State;
  assert.equal(state.ExitCode,0,'Container lifecycle checks failed');
  result.result='PASS';
}catch(error){failed=error;result.error=error.message;}
finally{
  if(created){
    let owned=false;
    try{
      const state=JSON.parse(read('docker',['inspect',name]))[0];
      assert.equal(state.Config.Labels?.['jp.tsukuhako.validation.id'],suffix);
      owned=true;
      if(state.State.Running)read('docker',['stop','--time','10',name]);
      fs.mkdirSync(path.join(evidence,'container'));
      read('docker',['cp',`${name}:/evidence/.`,path.join(evidence,'container')]);
    }catch(error){result.result='FAIL';result.cleanupError=error.message;failed??=error;}
    if(owned){
      try{read('docker',['rm','--force',name]);result.containerRemoved=true;}
      catch(error){result.result='FAIL';result.containerRemovalError=error.message;failed??=error;}
    }
  }
  if(imageBuilt){
    try{read('docker',['image','rm',image]);result.imageTagRemoved=true;}
    catch(error){result.result='FAIL';result.imageCleanupError=error.message;failed??=error;}
  }
  result.finishedAt=new Date().toISOString();
  result.inputUnchanged=fs.existsSync(deb)&&sha(deb)===input.sha256;
  if(!result.inputUnchanged){result.result='FAIL';failed??=new Error('Input deb changed during validation');}
  const checks=path.join(evidence,'container/checks.tsv');
  if(fs.existsSync(checks))result.checks=fs.readFileSync(checks,'utf8').trim().split('\n').map(line=>{const[id,status]=line.split('\t');return{id,status};});
  if(result.result==='PASS'&&!result.checks?.some(check=>check.id==='complete'&&check.status==='PASS')){
    result.result='FAIL';failed??=new Error('Missing final container completion marker');
  }
  writeJSON(path.join(evidence,'result.json'),result);
}
console.log(JSON.stringify({result:result.result,debSha256:input.sha256,evidence:path.join(evidence,'result.json')},null,2));
if(failed){console.error(failed.message);process.exitCode=1;}
