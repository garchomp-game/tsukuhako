import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import MarkdownIt from 'markdown-it';
import {resolveChapter,classifyLink} from '../src/links.ts';import {selectDistro,helpChapter,withDistro} from '../src/flow.ts';import {windowsGuidance} from '../adapters/wsl-guidance.mjs';import {nextSteps,startHere,quoteArg} from '../../generator/src/core/next-steps.mjs';
const root=path.resolve(import.meta.dirname,'../..'),m=JSON.parse(fs.readFileSync(root+'/curriculum/manifest.json')),parser=new MarkdownIt();
test('UX: WSL observations survive routing and all Docker states go to Windows setup',()=>{for(const state of ['missing','stopped','setup','unknown','ready']){const input={id:'docker-server',state,guide:'linux',message:'observation',reason:'reason'};const [r]=windowsGuidance([input]);assert.equal(r.state,state);assert.equal(r.message,'observation');assert.equal(r.guide,'windows');assert.equal(input.guide,'linux');assert.match(r.nextAction,/WSL/)}assert.equal(windowsGuidance([{id:'s2-tar',guide:'linux',reason:''}])[0].guide,'windows')});
test('UX: re-list preserves valid distro, clears removed candidates, selects a sole new candidate',()=>{const list=[{id:'a'},{id:'b'}];assert.equal(selectDistro([], 'old'),'');assert.equal(selectDistro([{id:'a'}], 'old'),'a');assert.equal(selectDistro(list,'b'),'b');assert.equal(selectDistro(list,'old'),'');assert.equal(selectDistro([],undefined),'')});
test('UX: source references are not actionable, chapter links round-trip, malformed paths do not throw',()=>{assert.equal(classifyLink(m,'F1','first','src/App.tsx').kind,'file');assert.deepEqual(resolveChapter(m,'F2','first','docs/EXERCISES.md'),{lessonId:'F2',chapterId:'exercises',heading:''});assert.equal(resolveChapter(m,'F2','exercises','../README.md').chapterId,'readme');for(const s of ['%ZZ.md','file:///etc/passwd','javascript:alert(1)','//example.com','lesson:missing/first']){assert.equal(resolveChapter(m,'F2','first',s),null);assert.equal(classifyLink(m,'F2','first',s).kind,'unavailable')}});
test('UX: all shipped chapter links resolve, source references exist or are labelled as historical',()=>{for(const l of m.lessons)for(const c of l.chapters){const tokens=parser.parse(fs.readFileSync(root+'/curriculum/'+c.file,'utf8'),{}).flatMap(t=>t.children||[]);for(const t of tokens.filter(t=>t.type==='link_open')){const href=t.attrGet('href'),kind=classifyLink(m,l.id,c.id,href);if(href.startsWith('lesson:'))assert.equal(kind.kind,'chapter',href);if(kind.kind==='file')assert.ok(fs.existsSync(root+'/starter-templates/'+l.id+'/'+kind.path),l.id+':'+href)}}});
test('UX: help follows the current lesson and falls back to setup',()=>{for(const id of ['F1','F2','B1','S1','S2','I1'])assert.equal(helpChapter(m,id).lessonId,id);assert.deepEqual(helpChapter(m,'absent'),{lessonId:'setup',chapterId:'trouble'})});
test('UX: generated first steps use actual ports, target version and safely quoted directory for every template',()=>{for(const id of ['F1','F2','B1','S1','S2','I1']){const destination="/home/test/日本語 app's $(literal)",ports=id==='I1'?{database:54001}:{app:3897};if(id==='S2')Object.assign(ports,{shadow:54010,api:54011,database:54012,studio:54013});const guide=startHere({request:{templateId:id},destination,ports,templateVersion:'test-version',projectName:'unit',nextSteps:nextSteps(id,ports)});assert.ok(guide.includes(quoteArg(destination)));assert.ok(guide.includes('test-version'));for(const port of Object.values(ports))assert.ok(guide.includes(String(port)));assert.ok(!guide.includes('(lesson:'));assert.match(guide,/PowerShell/);assert.ok(!guide.includes('http://localhost:3001'));}});

import {validatePayload} from '../security.mjs';
import {diagnoseLocal} from '../adapters/local.mjs';
import {ContentLibrary} from '../lib/content.mjs';
test('UX: clearing a WSL selection still allows reading position to be saved',()=>{const reading={view:'learn',lessonId:'F2',chapterId:'first',scroll:550,distroId:'abc0123456789def'};assert.equal(validatePayload('saveSettings',withDistro(reading,'')).scroll,550);assert.equal(withDistro(reading,'').distroId,undefined);assert.equal(validatePayload('saveSettings',withDistro(reading,'abc0123456789def')).distroId,'abc0123456789def')});

test('R041-3: missing S2 tools retain observations and reach the additional setup via Windows',async()=>{
 const calls=[];
 const result=await diagnoseLocal({platform:'linux',templateId:'S2',includeCode:false,env:{},runner:async(name,args)=>{
  calls.push([name,...args]);
  if(['curl','timeout'].includes(name))return{ok:false,error:'ENOENT',output:''};
  return{ok:true,output:args.includes('inspect')?'unix:///var/run/docker.sock':args.includes('info')?JSON.stringify({OSType:'linux',OperatingSystem:'Docker Desktop'}):'1.0'};
 }});
 const routed=windowsGuidance(result.checks),library=new ContentLibrary(root+'/curriculum');
 for(const name of ['curl','timeout']){
  const original=result.checks.find(c=>c.id==='s2-'+name),check=routed.find(c=>c.id===original.id);
  assert.equal(check.state,'missing');assert.equal(check.message,original.message);assert.ok(check.message.includes(name));
  const windows=await library.chapter('setup',check.guide);
  const links=parser.parse(windows.text,{}).flatMap(t=>t.children||[]).filter(t=>t.type==='link_open').map(t=>t.attrGet('href'));
  assert.ok(links.includes('lesson:S2/setup'));
  const target=resolveChapter(m,'setup',check.guide,'lesson:S2/setup');
  assert.equal(target.lessonId,'S2');assert.equal(target.chapterId,'setup');
  assert.ok((await library.chapter(target.lessonId,target.chapterId)).text.includes(name));
  assert.match(windows.text,/選択したWSL/);assert.match(windows.text,/同じ選択/);assert.match(windows.text,/もう一度確認/);
 }
 assert.match(routed.find(c=>c.id==='docker-server').nextAction,/Docker Desktop.*Integration/);
 assert.ok(calls.every(([, ...args])=>!args.some(a=>['install','update','upgrade','--set-default'].includes(a))));
});
