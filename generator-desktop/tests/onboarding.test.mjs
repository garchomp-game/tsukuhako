import test from 'node:test';
import assert from 'node:assert/strict';
import {canCreateFiles,helpChapter,preparationItem,projectForChapter,readerContentKey} from '../src/flow.ts';
import {resolveProjectChapter} from '../src/links.ts';
import {validatePayload} from '../security.mjs';
const index={lessons:[{id:'guide',chapters:[{id:'first-run',source:'guides/FIRST-RUN.md'},{id:'troubleshooting',source:'guides/TROUBLESHOOTING.md'}]},{id:'F2',chapters:[{id:'first',source:'START_HERE.md'},{id:'recovery'}]},{id:'I1',chapters:[{id:'first',source:'START_HERE.md'}]}]};
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
