import test from 'node:test';
import assert from 'node:assert/strict';
import {canCreateFiles,helpChapter,onboardingHelp,preparationItem,projectForChapter,readerContentKey} from '../src/flow.ts';
import {resolveProjectChapter} from '../src/links.ts';
import {validatePayload} from '../security.mjs';
const index={lessons:[{id:'guide',chapters:[{id:'first-run',source:'guides/FIRST-RUN.md'},{id:'troubleshooting',source:'guides/TROUBLESHOOTING.md'}]},{id:'F2',chapters:[{id:'first',source:'START_HERE.md'},{id:'recovery'}]},{id:'I1',chapters:[{id:'first',source:'START_HERE.md'},{id:'troubleshooting',source:'docs/troubleshooting.md'}]}]};
const project={templateId:'F2',destination:'/home/student/日本語 空白',guide:'# サンプル画面を表示する\n\n## VS Codeでフォルダーを開く\n\n## 開発サーバーを起動する\n',ports:{app:3987}};
test('onboarding: missing runtime tools never block Linux file creation; Windows requires its selected helper',()=>{
 for(const state of ['missing','stopped','setup','restart','unknown'])assert.equal(canCreateFiles('linux',{checks:[{state}],dockerReady:false}),true);
 for(const prep of [undefined,{helperReady:false},{helperReady:true,target:{distroId:'other'}}])assert.equal(canCreateFiles('win32',prep,'selected'),false);
 assert.equal(canCreateFiles('win32',{helperReady:true,target:{distroId:'selected'}},''),false);
 assert.equal(canCreateFiles('win32',{helperReady:true,target:{distroId:'selected'}},'selected'),true);
});
test('onboarding: diagnostic observations retain distinct states and route to the specific OS heading',()=>{
 const input={id:'docker-server',state:'unknown',label:'確認できない',reason:'raw reason',nextAction:'raw action',message:'raw',guide:'windows'};
 for(const state of ['missing','stopped','setup','restart','unknown']){
  const check={...input,state,label:''},item=preparationItem(check);assert.equal(item.state,state);assert.equal(item.chapter,'windows');assert.equal(item.heading,'dockerを使えるようにする');assert.ok(item.label);assert.deepEqual(check,{...input,state,label:''});
 }
 assert.notEqual(preparationItem({...input,state:'unknown',label:''}).label,preparationItem({...input,state:'missing',label:''}).label);
 for(const [id,heading] of [['code','vs-codeを使えるようにする'],['ms-vscode-remote.remote-containers','vs-codeへ必要な機能を追加する'],['s2-curl','メモを保存する画面の追加準備']]){
  const item=preparationItem({...input,id});assert.equal(item.heading,heading);assert.equal(item.chapter,'windows');assert.doesNotMatch(item.title,/S2/);
 }
});
test('onboarding: a current project is used only for its first chapter and a new project invalidates its content key',()=>{
 const reading={view:'learn',lessonId:'F2',chapterId:'first',scroll:0};
 assert.equal(projectForChapter(project,reading),project);assert.equal(projectForChapter(project,{...reading,lessonId:'I1'}),undefined);assert.equal(projectForChapter(project,{...reading,chapterId:'recovery'}),undefined);
 const key=readerContentKey(reading,project);assert.notEqual(key,readerContentKey(reading,{...project,destination:'/home/student/次の プロジェクト',guide:project.guide+'新しい設定'}));assert.notEqual(key,readerContentKey(reading));
 // No runtime heading is added to the strict persisted settings schema.
 assert.deepEqual(validatePayload('saveSettings',reading),reading);
});
test('onboarding: normal help opens symptom guidance and return links target the current project',()=>{
 assert.deepEqual(helpChapter(index,'F2','first'),{lessonId:'guide',chapterId:'troubleshooting'});
 assert.deepEqual(helpChapter(index,'guide','start'),{lessonId:'guide',chapterId:'troubleshooting'});
 assert.deepEqual(helpChapter(index,'F2','exercises'),{lessonId:'F2',chapterId:'recovery'});
 const href='lesson:guide/first-run#開発サーバーを起動する';
 assert.deepEqual(resolveProjectChapter(index,'guide','troubleshooting',href,project),{lessonId:'F2',chapterId:'first',heading:'開発サーバーを起動する'});
 assert.equal(resolveProjectChapter(index,'guide','troubleshooting',href).lessonId,'guide');
 const sql={...project,templateId:'I1',guide:'# データベースに接続する'};
 assert.deepEqual(resolveProjectChapter(index,'guide','troubleshooting',href,sql),{lessonId:'I1',chapterId:'first',heading:''});
 assert.equal(resolveProjectChapter(index,'guide','troubleshooting','javascript:alert(1)',project),null);
});

test('onboarding: help uses the current project for non-Web or non-Linux guides, with no persisted anchor',()=>{
 const first={lessonId:'F2',chapterId:'first'};
 assert.deepEqual(onboardingHelp(index,first,project,'linux'),{lessonId:'guide',chapterId:'troubleshooting',heading:''});
 for(const platform of ['win32','darwin',undefined])assert.deepEqual(onboardingHelp(index,first,project,platform),{lessonId:'F2',chapterId:'first',heading:'準備が足りないとき'});
 const sql={...project,templateId:'I1'};
 assert.deepEqual(onboardingHelp(index,{lessonId:'I1',chapterId:'first'},sql,'linux'),{lessonId:'I1',chapterId:'first',heading:'準備が足りないとき'});
 assert.deepEqual(onboardingHelp(index,{lessonId:'I1',chapterId:'first'},undefined,'linux'),{lessonId:'I1',chapterId:'troubleshooting',heading:''});
 assert.deepEqual(onboardingHelp(index,{lessonId:'I1',chapterId:'first'},project,'linux'),{lessonId:'I1',chapterId:'troubleshooting',heading:''});
 const {heading,...destination}=onboardingHelp(index,first,project,'win32');
 assert.ok(heading);assert.deepEqual(validatePayload('saveSettings',{view:'help',...destination,scroll:0}),{view:'help',lessonId:'F2',chapterId:'first',scroll:0});
});
test('onboarding: an observed Docker runtime with unverified compatibility is not described as possibly uninstalled',()=>{
 const check={id:'engine-compatibility',state:'unknown',label:'確認できない',message:'desktop構成のテンプレート適合は別途確認が必要です。',reason:'Engineと異なる実行方式です。',nextAction:'対象構成で実起動を確認します。',guide:'linux'};
 const item=preparationItem(check);
 assert.equal(item.state,'unknown');assert.equal(item.label,'適合は未確認');assert.equal(item.heading,'dockerを使えるようにする');
 assert.doesNotMatch(item.purpose+item.action,/未導入|インストール/);assert.match(item.action,/既存の設定/);assert.match(item.action,/起動/);
 assert.equal(check.label,'確認できない');
});

test('creation help: real curriculum covers every configuration, stage and platform without runtime commands',async()=>{
 const fs=await import('node:fs');
 const {creationHelp,localizeCreationHelp}=await import('../src/flow.ts');
 const {resolveChapter}=await import('../src/links.ts');
 const real=JSON.parse(fs.readFileSync(new URL('../../curriculum/manifest.json',import.meta.url)));
 for(const id of ['F1','F2','B1','S1','S2','I1'])for(const stage of ['selection','destination','confirmation','generation-error']) {
  const route=creationHelp(id,stage),lesson=real.lessons.find(l=>l.id===id),chapter=lesson.chapters.find(c=>c.id===route.chapterId);
  assert.ok(chapter);const text=fs.readFileSync(new URL('../../curriculum/'+chapter.file,import.meta.url),'utf8');
  assert.ok(text.includes(lesson.title));assert.ok(text.includes('## '+route.heading));assert.doesNotMatch(text,/npm run dev|scripts\/db.sh|\{\{/);
  for(const [platform,target] of [['linux','linux'],['win32','windows'],['darwin','macos'],[undefined,null],['unknown',null]]) {
   const localized=localizeCreationHelp(text,platform);
   assert.doesNotMatch(localized,/<!--|-->/);
   const osLinks=[...localized.matchAll(/\]\((lesson:setup\/(linux|windows|macos))\)/g)];
   assert.equal(osLinks.length,target?1:3);if(target)assert.equal(osLinks[0][2],target);
   for(const [,href] of localized.matchAll(/\]\((lesson:[^)]+)\)/g))assert.ok(resolveChapter(real,id,'creation',href),href);
  }
  if(id==='I1')assert.match(text,/lesson:I1\/troubleshooting/);
 }
});
