import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {nextSteps,startHere} from '../generator/src/core/next-steps.mjs';
import {presentationFor} from '../generator/src/core/presentation.mjs';

const root=path.resolve(import.meta.dirname,'..'),dest=path.join(root,'curriculum');
fs.mkdirSync(dest,{recursive:true});
const productVersion=JSON.parse(fs.readFileSync(root+'/generator-desktop/package.json')).version;
const catalog=JSON.parse(fs.readFileSync(root+'/catalog.json')),lessons=[];
function lesson(id,title,templateVersion,rows,presentation={}) {
 const dir=path.join(dest,id);fs.mkdirSync(dir,{recursive:true});
 const chapters=rows.map(([chapterId,title,body,source])=>{
  const file=id+'/'+chapterId+'.md';fs.writeFileSync(path.join(dest,file),body);
  return {id:chapterId,title,file,source:source||chapterId+'.md',bytes:Buffer.byteLength(body),sha256:createHash('sha256').update(body).digest('hex')};
 });
 lessons.push({id,title,version:productVersion,templateVersion,...presentation,chapters});
}
for(const t of catalog.templates.filter(t=>t.generatorEligible)) {
 const presentation=presentationFor(t.id);
 const ports=t.id==='I1'?{database:t.defaultPort}:{app:t.defaultPort};
 if(t.id==='S2')Object.assign(ports,{shadow:t.hostPorts.shadow,api:t.hostPorts.shadow+1,database:t.hostPorts.shadow+2,studio:t.hostPorts.shadow+3});
 // Reader replaces this unbound reference with the current project's exact guide.
 const example={request:{templateId:t.id},destination:'/home/your-name/projects/sample',ports,templateVersion:t.implementationVersion,projectName:'sample',nextSteps:nextSteps(t.id,ports)};
 const first='> これは生成前に読めるLinux向け手順の見本です。保存先とポートは例です。Windowsでは先に[Windows / WSL 2の準備](lesson:setup/windows)を確認してください。生成後のボタンから、今回のOS・保存先・ポートが入った手順を開いてください。\n\n'+startHere(example,{platform:'linux'});
 const rows=[['first',presentation.firstGoal,first,'START_HERE.md'],['readme','詳しい使い方',fs.readFileSync(root+'/'+t.sourcePath+'/README.md','utf8'),'README.md']];
 const files=fs.readdirSync(root+'/'+t.sourcePath+'/docs').filter(x=>x.endsWith('.md')).sort();
 for(const file of files) {
  const body=fs.readFileSync(root+'/'+t.sourcePath+'/docs/'+file,'utf8');
  rows.push([file.replace(/\.md$/,'').toLowerCase(),body.match(/^#\s+(.+)$/m)?.[1]||file,body,'docs/'+file]);
 }
 const recovery=['troubleshooting','recovery','trouble'].find(id=>rows.some(row=>row[0]===id));
 const creation=fs.readFileSync(root+'/docs/desktop-setup/creation.md','utf8').replaceAll('{{name}}',presentation.name).replaceAll('{{recovery}}',`lesson:${t.id}/${recovery||'setup'}`);
 rows.push(['creation','作成前に困ったとき',creation,'guides/CREATION.md']);
 lesson(t.id,presentation.name,t.implementationVersion,rows,presentation);
}
const setup=[['overview','開発準備の全体像'],['windows','Windows / WSL 2の準備'],['macos','macOSの参考手順'],['linux','Linuxの準備'],['trouble','準備で困ったとき']];
lesson('setup','開発準備',null,setup.map(([id,title])=>[id,title,fs.readFileSync(root+'/docs/desktop-setup/'+id+'.md','utf8')]));
const guides=[['start','はじめに','START_HERE.md'],['first-run','サンプル画面を表示する','FIRST-RUN.md'],['troubleshooting','困ったとき・再開','TROUBLESHOOTING.md'],['next-step','任意：変更と復元','NEXT-STEP.md'],['feedback','記録票','FEEDBACK.md']];
lesson('guide','はじめて使う・ガイド',null,guides.map(([id,title,file])=>[id,title,fs.readFileSync(root+'/docs/launch/sunday-pack/'+file,'utf8'),file]));
const img=fs.readFileSync(root+'/generator-desktop/public/brand-mark.png');
fs.mkdirSync(dest+'/assets',{recursive:true});fs.writeFileSync(dest+'/assets/learning-cycle.png',img);
fs.writeFileSync(dest+'/manifest.json',JSON.stringify({schemaVersion:1,appVersion:productVersion,version:productVersion,lessons,assets:[{id:'learning-cycle',file:'assets/learning-cycle.png',sha256:createHash('sha256').update(img).digest('hex'),bytes:img.length,mime:'image/png'}]},null,2)+'\n');
console.log(lessons.length,'lessons',lessons.reduce((n,l)=>n+l.chapters.length,0),'chapters');
