// Disposable distro container with only the selected RPM and test script mounted read-only.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawn,execFileSync} from 'node:child_process';
import {createHash,randomBytes} from 'node:crypto';
const args=process.argv.slice(2),options={};
for(let i=0;i<args.length;i+=2){assert.ok(['--rpm','--image','--evidence'].includes(args[i])&&args[i+1]);assert.ok(!options[args[i]]);options[args[i]]=args[i+1]}
assert.ok(options['--rpm']&&options['--image']&&options['--evidence'],'Use --rpm FILE --image rockylinux:9|registry.fedoraproject.org/fedora:44 --evidence NEW_DIRECTORY');
const rpm=fs.realpathSync(options['--rpm']),image=options['--image'],out=path.resolve(options['--evidence']),script=path.resolve(import.meta.dirname,'container-check.sh');
assert.ok(['rockylinux:9','registry.fedoraproject.org/fedora:44'].includes(image));assert.ok(!fs.existsSync(out));fs.mkdirSync(out,{recursive:true});
const sha=f=>createHash('sha256').update(fs.readFileSync(f)).digest('hex'),id=randomBytes(8).toString('hex'),name='tsukuhako-rpm-check-'+id;
const sync=args=>execFileSync('docker',args,{encoding:'utf8',maxBuffer:8*1024*1024}).trim();
let child,interrupted;
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>{interrupted=signal;child?.kill('SIGTERM')});
async function run(args,log){const stream=fs.createWriteStream(path.join(out,log),{flags:'wx'});child=spawn('docker',args,{stdio:['ignore','pipe','pipe']});for(const src of [child.stdout,child.stderr])src.on('data',data=>stream.write(data));const code=await new Promise((resolve,reject)=>{child.on('error',reject);child.on('close',resolve)});child=undefined;stream.end();assert.ok(!interrupted);assert.equal(code,0,`${log}: docker exited ${code}`)}
const result={category:'ISOLATED_CONTAINER',result:'FAIL',image,input:{file:path.basename(rpm),bytes:fs.statSync(rpm).size,sha256:sha(rpm)},startedAt:new Date().toISOString(),hostPackageInstallation:false,hostHomeMounted:false,dockerSocketMounted:false,privileged:false,notRun:['Desktop GUI launch','SELinux on a real host','Actual older-release migration','Dev Container and sample application lifecycle']};
let created=false,error;
try{
 await run(['pull',image],'image-pull.log');
 result.imageDetails=JSON.parse(sync(['image','inspect',image]))[0].RepoDigests;
 sync(['create','--name',name,'--label','jp.tsukuhako.rpm-validation='+id,'--cpus','2','--memory','3g','--pids-limit','512','--mount',`type=bind,src=${rpm},dst=/input/final.rpm,readonly`,'--mount',`type=bind,src=${script},dst=/input/check.sh,readonly`,image,'bash','/input/check.sh',result.input.sha256]);created=true;
 const info=JSON.parse(sync(['inspect',name]))[0];assert.equal(info.HostConfig.Privileged,false);assert.equal(info.Mounts.length,2);assert.ok(info.Mounts.every(m=>m.Type==='bind'&&!m.RW));
 result.isolation={bindMounts:info.Mounts.map(m=>({destination:m.Destination,readOnly:!m.RW})),network:info.HostConfig.NetworkMode,capAdd:info.HostConfig.CapAdd||[]};
 await run(['start','--attach',name],'container-run.log');result.result='PASS';
}catch(e){error=e;result.error=e.message}
finally{
 if(created){try{const current=JSON.parse(sync(['inspect',name]))[0];assert.equal(current.Config.Labels['jp.tsukuhako.rpm-validation'],id);if(current.State.Running)sync(['stop','--time','10',name]);fs.mkdirSync(out+'/container');sync(['cp',name+':/evidence/.',out+'/container']);sync(['rm','--force',name]);result.containerRemoved=true}catch(e){error??=e;result.result='FAIL';result.cleanupError=e.message}}
 const checks=out+'/container/checks.tsv';if(fs.existsSync(checks))result.checks=fs.readFileSync(checks,'utf8').trim().split('\n').map(row=>{const[id,status]=row.split('\t');return{id,status}});
 if(!result.checks?.some(c=>c.id==='complete'&&c.status==='PASS')){result.result='FAIL';error??=new Error('Missing final completion marker')}
 result.inputUnchanged=sha(rpm)===result.input.sha256;if(!result.inputUnchanged){result.result='FAIL';error??=new Error('Input RPM changed')}
 result.finishedAt=new Date().toISOString();fs.writeFileSync(out+'/result.json',JSON.stringify(result,null,2)+'\n');
}
console.log(JSON.stringify({result:result.result,evidence:out+'/result.json',image},null,2));if(error){console.error(error.message);process.exitCode=1}
