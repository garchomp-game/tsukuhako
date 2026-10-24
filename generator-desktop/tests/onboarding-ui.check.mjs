// Renderer integration fixture. No actual Docker/VS Code/WSL/install operation.
// Run after `npm --prefix generator-desktop run build` and `npm --prefix tools ci`.
import {_electron as electron,expect} from '../../tools/node_modules/@playwright/test/index.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'../..'),run=fs.mkdtempSync(path.join(os.tmpdir(),'tsukuhako-onboarding-ui-'));
const source=String.raw`
const {app,BrowserWindow,ipcMain}=require('electron');
const path=require('node:path');
const root=process.env.TSUKUHAKO_UI_ROOT;
app.setPath('userData',process.env.TSUKUHAKO_UI_PROFILE);
app.disableHardwareAcceleration();
const chapters={
 'guide/start':'# はじめてのWeb画面\n\n準備を確認し、サンプルを表示します。',
 'guide/first-run':'# 標準の初回手順\n\n## 初期処理の正常終了を待つ\n\n標準設定の見本です。',
 'guide/troubleshooting':'# 困ったとき\n\n## 初期処理が終わらないとき\n\n[初期処理の手順へ](lesson:guide/first-run#初期処理の正常終了を待つ)\n\n[動作確認へ](lesson:guide/first-run#サンプルの動作を確認する)',
 'setup/linux':'# Linuxの準備\n\n## Dockerを使えるようにする\n\nDockerの手順。\n\n## VS Codeを使えるようにする\n\nVS Codeの手順。\n\n## VS Codeへ必要な機能を追加する\n\n機能の手順。',
 'setup/windows':'# Windowsの準備\n\n## Dockerを使えるようにする\n\nWSLを確認します。\n\n## メモを保存する画面の追加準備\n\n追加手順です。',
 'F2/first':'# サンプル画面を表示する\n\n標準設定の見本です。',
 'F2/recovery':'# 詳しい技術手順'
};
const titles={guide:'ガイド',setup:'OS別の準備',F2:'はじめてのWeb画面'};
const index={version:'fixture',appVersion:'fixture',assets:[],lessons:Object.entries(titles).map(([id,title])=>({id,title,version:'fixture',templateVersion:null,chapters:Object.keys(chapters).filter(k=>k.startsWith(id+'/')).map(k=>({id:k.split('/')[1],title:chapters[k].split('\n')[0].slice(2),source:k+'.md'}))}))};
const template={id:'F2',name:'はじめてのWeb画面',summary:'画面を表示します。',technology:'Next.js',firstGoal:'サンプル画面を表示する',guideAction:'サンプル画面を表示する手順へ',success:'サンプル画面が表示されます。',route:'/',version:'fixture',defaultPort:3000,eligible:true,includedFeatures:[],notIncluded:[],prerequisites:[],notRun:[],validationScope:'fixture'};
const catalog={version:'fixture',defaultParent:'/home/student',goals:[{id:'screen',title:'画面を作る',summary:'画面の練習',templates:['F2']}],templates:[template,{...template,id:'F1',name:'一つの画面を作る'}]};
const states={missing:'未導入',stopped:'導入済みだが未起動',setup:'設定不足',restart:'再起動等が必要',unknown:'確認できない',ready:'利用可能'};
const check=(id,state)=>({id,state,label:states[state],message:id+' raw diagnostic',reason:'raw reason',nextAction:'raw next action',guide:fixture.platform==='win32'?'windows':'linux'});
const fixture=globalThis.fixture={platform:'linux',state:'missing',saved:{view:'create',lessonId:'F2',chapterId:'',scroll:0},helper:false,editorError:true,opened:[],reads:[],checks:[],distros:[{id:'aaaaaaaaaaaaaaaa',name:'Ubuntu A',generation:2,state:'Stopped'},{id:'bbbbbbbbbbbbbbbb',name:'Ubuntu B',generation:2,state:'Stopped'}]};
function preparation(payload={}){return {platform:fixture.platform,arch:'x64',distros:fixture.distros,helperReady:fixture.helper,target:fixture.helper?{distro:'Ubuntu A',distroId:payload.distroId,user:'student',home:'/home/student'}:undefined,checkedAt:new Date().toISOString(),checks:[check('docker-server',fixture.state),check('code','unknown'),check('ms-vscode-remote.remote-containers','setup')],dockerReady:false}}
const ok=value=>({ok:true,value});
const handlers={getLearningIndex:()=>index,readSettings:()=>fixture.saved,saveSettings:p=>(fixture.saved=p,{saved:true}),getTemplates:()=>catalog,getPreparation:()=>({platform:fixture.platform,arch:'x64',distros:fixture.distros}),checkPreparation:p=>(fixture.checks.push(p),preparation(p)),prepareWSL:p=>(fixture.helper=true,preparation(p)),cancelPreparation:()=>({cancelled:true}),readChapter:p=>(fixture.reads.push(p),{text:chapters[p.lessonId+'/'+p.chapterId]||'# 補助資料'}),readAsset:()=>'',openLessonLink:()=>({opened:false}),chooseParentDirectory:()=>'/home/student',exportDiagnostic:()=>({saved:false}),plan:p=>{fixture.last=undefined;if(!p){fixture.plan=undefined;return null}return fixture.plan={planId:'fixture-plan',request:p,destination:p.parent+'/'+p.folder,templateVersion:'fixture',projectName:p.name||'study',ports:{app:p.port||3000},files:[],nextSteps:[]}},diagnose:()=>({generationReady:true,runtimeReady:false,checks:[]}),apply:()=>{const p=fixture.plan;const url='http://localhost:'+p.ports.app+'/';return fixture.last={status:'created',destination:p.destination,templateId:p.request.templateId,templateVersion:'fixture',projectName:p.projectName,ports:p.ports,readme:'README.md',startHere:'START_HERE.md',readmeText:'# README',nextSteps:[{location:'host',cwd:'destination',title:'サンプルの動作を確認する',url}],guide:'# サンプル画面を表示する\n\n保存先：'+p.destination+'\n\n## 準備を確認する\n\n'+('準備する場所と結果を読みます。\n\n'.repeat(8))+'\n\x60\x60\x60sh\ncd -- \x27'+p.destination+'\x27\n\x60\x60\x60\n\n## VS Codeでフォルダーを開く\n\n今回の保存先を開きます。\n\n## コンテナーで開く\n\n手順を確認します。\n\n## 初期処理の正常終了を待つ\n\n「準備完了」と正常終了を確認します。\n\n## 開発サーバーを起動する\n\n\x60\x60\x60sh\nnpm run dev\n\x60\x60\x60\n\n## サンプルの動作を確認する\n\n'+url+'\n\n## 同じフォルダーから再開する\n\nSTART_HERE.mdを開きます。'}},openInVSCode:()=>{if(fixture.editorError)return {__error:{code:'EDITOR_UNAVAILABLE',message:'VS Codeへ接続を渡せませんでした。',nextAction:'VS Codeの「フォルダーを開く」で保存先を選んでください。',details:{}}};fixture.opened.push(fixture.last?.destination);return {opened:true}}};
for(const [name,fn] of Object.entries(handlers))ipcMain.handle('tsukuhako:'+name,(_,p)=>{const v=fn(p);return v?.__error?{ok:false,error:v.__error}:ok(v)});
app.whenReady().then(()=>{const w=new BrowserWindow({show:false,width:1280,height:1000,webPreferences:{preload:path.join(root,'generator-desktop/preload.cjs'),contextIsolation:true,sandbox:true,nodeIntegration:false,backgroundThrottling:false}});w.loadFile(path.join(root,'generator-desktop/build/index.html'))});
app.on('window-all-closed',()=>app.quit());
`;
const entry=path.join(run,'fixture.cjs');fs.writeFileSync(entry,source);
const env={...process.env,TSUKUHAKO_UI_ROOT:root,TSUKUHAKO_UI_PROFILE:path.join(run,'profile')};delete env.ELECTRON_RUN_AS_NODE;
let app,page;const records=[],errors=[];
const record=name=>{records.push(name);console.log('PASS',name)};
try{
 app=await electron.launch({executablePath:path.join(root,'generator-desktop/node_modules/electron/dist/electron'),args:[entry],env});
 page=await app.firstWindow();page.setDefaultTimeout(12000);page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>Object.defineProperty(navigator,'clipboard',{value:{writeText:async text=>{window.__copied=text}}}));await page.reload();
 const button=name=>page.getByRole('button',{name,exact:true});
 const nav=name=>page.getByRole('navigation',{name:'ツクハコの画面'}).getByRole('button',{name,exact:true});
 await expect(button('保存先を決める')).toBeEnabled();
 await button('はじめてのWeb画面で始める').click();await expect(page.locator('#preparation-title')).toBeFocused();
 await page.locator('.preparation-item').first().getByRole('button').click();
 await expect(page.locator('.markdown h1')).toHaveText('Linuxの準備');await expect(page.locator('#dockerを使えるようにする')).toBeFocused();
 await button('準備チェックへ戻る').click();record('Linux runtime missing allows creation; preparation link focuses the exact heading');
 for(const state of ['stopped','setup','restart','unknown']){await app.evaluate((_,state)=>{globalThis.fixture.state=state},state);await button('もう一度確認').click();await expect(page.locator('.preparation-item').first().locator('.state')).toHaveClass('state '+state)}
 record('stopped, setup, restart, unknown remain distinct');
 async function create(folder,port){await button('保存先を決める').click();await page.getByLabel('親フォルダ',{exact:true}).fill('/home/student/日本語の長い 親フォルダー');await page.getByLabel('新しいフォルダ名').fill(folder);if(!await page.getByLabel('ホストポート',{exact:true}).isVisible())await page.locator('.advanced summary').click();await page.getByLabel('ホストポート',{exact:true}).fill(String(port));await button('作成内容を確認').click();await button('プロジェクトを作成').click();await expect(page.locator('.created-actions button')).toHaveCount(1);await button('サンプル画面を表示する手順へ').click();await expect(page.locator('.markdown h1')).toHaveText('サンプル画面を表示する')}
 const first='初回 日本語 プロジェクト',destination='/home/student/日本語の長い 親フォルダー/'+first;
 await create(first,3987);await expect(page.locator('.markdown')).toContainText(destination);await expect(page.locator('.project-context')).toContainText('http://localhost:3987/');
 await page.locator('.code-block').first().getByRole('button').click();expect(await page.evaluate(()=>window.__copied)).toBe("cd -- '"+destination+"'\n");
 await page.locator('.project-context summary').click();await page.locator('.project-context').getByRole('button',{name:'手順全体をコピー'}).click();expect(await page.evaluate(()=>window.__copied)).toBe(await app.evaluate(()=>globalThis.fixture.last.guide));
 await button('このフォルダーをVS Codeで開く').click();await expect(page.locator('.project-editor-action .error')).toContainText('フォルダーを開く');await expect(page.locator('.project-editor-action .error')).toContainText(destination);
 await app.evaluate(()=>{globalThis.fixture.editorError=false});await button('このフォルダーをVS Codeで開く').click();expect(await app.evaluate(()=>globalThis.fixture.opened)).toEqual([destination]);
 await nav('困ったとき').click();await expect(page.locator('.markdown h1')).toHaveText('困ったとき');await button('初期処理の手順へ').click();await expect(page.locator('#初期処理の正常終了を待つ')).toBeFocused();await expect(page.locator('.project-context')).toContainText(destination);
 await nav('作る').click();await button('サンプル画面を表示する手順へ').click();await expect(page.locator('.project-context')).toContainText('3987');
 record('actual destination/port, code/full-guide copies, editor failure/retry, help and create round trip');
 await page.setViewportSize({width:390,height:844});await button('このフォルダーをVS Codeで開く').scrollIntoViewIfNeeded();
 const overflow=await page.evaluate(()=>({body:document.body.scrollWidth>innerWidth,reader:document.querySelector('.reader-scroll').scrollWidth>document.querySelector('.reader-scroll').clientWidth}));expect(overflow).toEqual({body:false,reader:false});
 await button('目次を開く').click();await expect(page.getByLabel('教材・ガイドを選ぶ')).toBeFocused();await page.keyboard.press('Escape');await expect(button('目次を開く')).toBeFocused();
 record('390px long path and keyboard TOC focus');
 await nav('作る').click();await button('別のプロジェクトを作る').click();await create('次の プロジェクト',4099);await expect(page.locator('.project-context')).toContainText('4099');await expect(page.locator('.reader-scroll')).not.toContainText(first);
 await button('このフォルダーをVS Codeで開く').click();expect((await app.evaluate(()=>globalThis.fixture.opened)).at(-1)).toContain('次の プロジェクト');record('new project replaces old guide and editor target');
 await app.evaluate(()=>{globalThis.fixture.platform='win32';globalThis.fixture.helper=false;globalThis.fixture.saved={view:'create',lessonId:'F2',chapterId:'',scroll:0}});await page.reload();await expect(button('保存先を決める')).toBeDisabled();
 await page.getByLabel('開発するWSL').selectOption('aaaaaaaaaaaaaaaa');await button('もう一度確認').click();await expect(button('保存先を決める')).toBeDisabled();await button('WSL用ファイルを準備').click();await expect(button('保存先を決める')).toBeEnabled();
 await page.getByLabel('開発するWSL').selectOption('bbbbbbbbbbbbbbbb');await expect(button('保存先を決める')).toBeDisabled();record('Windows requires the helper for the selected distribution; switching invalidates it');
 expect(errors).toEqual([]);fs.writeFileSync(path.join(run,'result.json'),JSON.stringify({scope:'FIXTURE',records,errors},null,2));console.log('Evidence:',run);
}catch(error){console.error(error);await page?.screenshot({path:path.join(run,'failure.png'),timeout:3000}).catch(()=>{});console.error('Evidence:',run);throw error}finally{await app?.close()}
