// Cross-source checks against real generated files; no runtime installation is needed.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import {planGeneration} from '../../generator/src/core/plan.mjs';
import {applyGeneration} from '../../generator/src/core/apply.mjs';
import {startHere,GUIDE_ANCHORS} from '../../generator/src/core/next-steps.mjs';
import {presentationFor} from '../../generator/src/core/presentation.mjs';
import {resolveChapter,headingId,classifyLink} from '../../generator-desktop/src/links.ts';
const root=path.resolve(import.meta.dirname,'../..'),require=createRequire(root+'/generator-desktop/package.json'),MarkdownIt=require('markdown-it'),parser=new MarkdownIt();
const index=JSON.parse(fs.readFileSync(root+'/curriculum/manifest.json')),temp=fs.mkdtempSync(path.join(os.tmpdir(),'tsukuhako-guide-'));
const hash=b=>createHash('sha256').update(b).digest('hex');
function headings(text){const tokens=parser.parse(text,{});return tokens.flatMap((t,i)=>t.type==='heading_open'?[headingId(tokens[i+1].content)]:[])}
function links(text){return parser.parse(text,{}).flatMap(t=>t.children||[]).filter(t=>t.type==='link_open').map(t=>t.attrGet('href'))}
const results={category:'GENERATED_FILES_AND_DOCUMENT_INTEGRATION',version:index.appVersion,configurations:[],canonicalLinks:0,curriculumHashes:0,regeneration:false};
try {
 for(const id of ['F1','F2','B1','S1','S2','I1']) {
  const destination=path.join(temp,`${id} 日本語 app's $(literal)`),request={templateId:id,destination,port:id==='I1'?54041:39471,...(id==='S2'?{dbBase:54400}:{})};
  const plan=planGeneration(root,request);applyGeneration(root,plan);
  const guide=fs.readFileSync(destination+'/START_HERE.md','utf8'),meta=presentationFor(id);
  assert.equal(guide,startHere(plan,{platform:'linux'}));assert.ok(guide.includes(meta.firstGoal));assert.ok(guide.includes(meta.name));
  assert.ok(links(guide).every(href=>!/^lesson:|^action:/.test(href)));assert.doesNotMatch(guide,/PowerShell|WSL|Windows/);
  const required=plan.nextSteps.filter(s=>s.phase==='required');assert.equal(required.at(-1).key,'verify');assert.ok(plan.nextSteps.some(s=>s.phase==='optional'));
  assert.ok(headings(guide).includes(GUIDE_ANCHORS.resume));
  for(const href of links(guide)) {
   if(/^https:/.test(href))continue;
   const [target,anchor]=href.split('#'),file=path.resolve(destination,decodeURIComponent(target||'START_HERE.md'));
   assert.ok(file.startsWith(destination+'/'));assert.ok(fs.existsSync(file),id+': '+href);
   if(anchor)assert.ok(headings(fs.readFileSync(file,'utf8')).includes(decodeURIComponent(anchor)),id+': '+href);
  }
  const windows=startHere(plan,{platform:'win32'});assert.match(windows,/WSL/);
  results.configurations.push({id,name:meta.name,goal:meta.firstGoal,requiredFinal:required.at(-1).key,ports:plan.ports,relativeLinksValid:true,windowsBranch:true,guideSha256:hash(guide)});
 }
 for(const lesson of index.lessons)for(const chapter of lesson.chapters){
  const body=fs.readFileSync(root+'/curriculum/'+chapter.file,'utf8');assert.equal(hash(body),chapter.sha256);assert.equal(Buffer.byteLength(body),chapter.bytes);results.curriculumHashes++;
  if(!['guide','setup'].includes(lesson.id)&&!['first','creation'].includes(chapter.id))continue;
  for(const href of links(body)){
   if(/^https:/.test(href))continue;
   const target=resolveChapter(index,lesson.id,chapter.id,href);
   if(!target&&classifyLink(index,lesson.id,chapter.id,href).kind==='file'){assert.ok(fs.existsSync(root+'/starter-templates/'+lesson.id+'/'+href));continue}
   assert.ok(target,chapter.file+': '+href);
   if(target.heading){const c=index.lessons.find(l=>l.id===target.lessonId).chapters.find(c=>c.id===target.chapterId);assert.ok(headings(fs.readFileSync(root+'/curriculum/'+c.file,'utf8')).includes(target.heading),chapter.file+': '+href)}
   results.canonicalLinks++;
  }
 }
 const before=hash(fs.readFileSync(root+'/curriculum/manifest.json'));execFileSync(process.execPath,['tools/build-curriculum.mjs'],{cwd:root});assert.equal(hash(fs.readFileSync(root+'/curriculum/manifest.json')),before);results.regeneration=true;results.result='PASS';
 console.log(JSON.stringify(results,null,2));
}finally{fs.rmSync(temp,{recursive:true,force:true})}
