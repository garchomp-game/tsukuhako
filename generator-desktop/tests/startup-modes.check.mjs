// Electron renderer checks with real guide generation and mocked host actions.
// No project files, Docker containers, actual VS Code or installed app are changed.
// Build first; run on a dedicated display. TSUKUHAKO_TEST_ROOT can point to a sibling build.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {pathToFileURL} from 'node:url';
import {source} from './startup-modes-fixture.mjs';
const root=path.resolve(process.env.TSUKUHAKO_TEST_ROOT||path.resolve(import.meta.dirname,'../..'));
const {_electron:electron,expect}=await import(pathToFileURL(root+'/tools/node_modules/@playwright/test/index.mjs').href);
const run=fs.mkdtempSync(path.join(os.tmpdir(),'tsukuhako-startup-modes-'));
fs.writeFileSync(run+'/fixture.cjs',source);
const env={...process.env,TSUKUHAKO_UI_ROOT:root,TSUKUHAKO_UI_PROFILE:run+'/profile'};delete env.ELECTRON_RUN_AS_NODE;
let app,p;const records=[],errors=[];
const record=(scenario,extra={})=>{records.push({scenario,result:'PASS',...extra});console.log('PASS',scenario)};
try{
 app=await electron.launch({executablePath:root+'/generator-desktop/node_modules/electron/dist/electron',args:[run+'/fixture.cjs'],env});
 p=await app.firstWindow();p.setDefaultTimeout(15000);p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(()=>Object.defineProperty(navigator,'clipboard',{value:{writeText:async text=>{window.__copied=text}}}));await p.reload();
 await p.setViewportSize({width:1150,height:900});
 const b=name=>p.getByRole('button',{name,exact:true});
 const nav=name=>p.getByRole('navigation',{name:'ツクハコの画面'}).getByRole('button',{name,exact:true});
 const mode=name=>p.getByRole('radio',{name,exact:true});
 const guided='手順を見ながら進める',quick='必要な操作だけ進める';
 const body=p.locator('.markdown');
 async function screen(name){await p.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));await p.screenshot({path:run+'/'+name})}
 async function create(folder,port){
  await expect(b('保存先を決める').or(p.getByLabel('親フォルダ',{exact:true}))).toBeVisible();
  if(await b('保存先を決める').isVisible())await b('保存先を決める').click();
  await p.getByLabel('親フォルダ',{exact:true}).fill('/home/student/日本語の親フォルダー');await p.getByLabel('新しいフォルダ名').fill(folder);
  if(port!==undefined){if(!await p.getByLabel('ホストポート',{exact:true}).isVisible())await p.locator('.advanced summary').click();await p.getByLabel('ホストポート',{exact:true}).fill(port===null?'':String(port))}
  await b('作成内容を確認').click();await b('プロジェクトを作成').click();await expect(p.locator('.created-actions button')).toHaveCount(1);await p.locator('.created-actions button').click();await expect(body.locator('h1')).toBeVisible();
 }
 await expect(mode(guided)).toBeChecked();await mode(guided).focus();await p.keyboard.press('ArrowRight');await expect(mode(quick)).toBeChecked();
 await expect.poll(()=>app.evaluate(()=>globalThis.fixture.saved.guideMode)).toBe('quick');
 await b('はじめてのWeb画面で始める').click();await create('初回の画面',3311);
 await expect(mode(quick)).toBeChecked();const destination='/home/student/日本語の親フォルダー/初回の画面';
 await expect(p.locator('.project-context')).toContainText(destination);await expect(p.locator('.project-context')).toContainText('http://localhost:3311/');
 await expect(b('このフォルダーをVS Codeで開く')).toHaveCount(1);
 const geometry=await p.evaluate(()=>{const context=document.querySelector('.project-context'),action=document.querySelector('.project-editor-action'),title=document.querySelector('.markdown h1'),button=action.querySelector('button.primary'),rect=button.getBoundingClientRect();return{adjacent:context.nextElementSibling===action,actionBeforeTitle:Boolean(action.compareDocumentPosition(title)&Node.DOCUMENT_POSITION_FOLLOWING),top:rect.top,bottom:rect.bottom,fullyVisible:rect.top>=0&&rect.bottom<=innerHeight}});
 expect(geometry.adjacent).toBe(true);expect(geometry.actionBeforeTitle).toBe(true);expect(geometry.fullyVisible).toBe(true);await screen('quick-primary-1150.png');
 await expect(p.locator('.port-explanation')).toContainText('3000');await expect(body.getByRole('heading',{name:'任意の練習',exact:true})).toHaveCount(0);
 record('keyboard mode selection, exact project URL and primary action immediately below context without scrolling',{geometry});

 await b('このフォルダーをVS Codeで開く').click();await expect(p.locator('.project-editor-action .error')).toContainText(destination);
 await mode(guided).check();await expect(p.locator('.project-editor-action .error')).toContainText(destination);await mode(quick).check();await expect(p.locator('.project-editor-action .error')).toContainText(destination);
 await app.evaluate(()=>{globalThis.fixture.editorError=false});await b('このフォルダーをVS Codeで開く').click();
 expect(await app.evaluate(()=>globalThis.fixture.opened)).toEqual([destination]);expect(await app.evaluate(()=>globalThis.fixture.openPayloads)).toEqual(['no-payload','no-payload']);
 await p.locator('.project-context details').filter({has:p.getByRole('button',{name:'手順全体をコピー',exact:true})}).locator('summary').click();await p.locator('.project-context').getByRole('button',{name:'手順全体をコピー',exact:true}).click();expect(await p.evaluate(()=>window.__copied)).toBe(await app.evaluate(()=>globalThis.fixture.last.guide));
 record('mode switching preserves project and editor failure; retry opens only trusted current project; full-copy stays complete');

 await body.getByRole('button',{name:'終了する',exact:true}).click();await expect(p.locator('#終了する')).toBeFocused();await expect(b('簡潔な手順に戻る')).toBeVisible();
 await b('簡潔な手順に戻る').click();await expect(mode(quick)).toBeChecked();await expect(b('簡潔な手順に戻る')).toHaveCount(0);
 await nav('困ったとき').click();await expect(body.locator('h1')).toBeVisible();await b('読んでいた手順へ戻る').click();await expect(mode(quick)).toBeChecked();await expect(p.locator('.project-context')).toContainText(destination);
 record('quick links open focused detailed help and return to quick; global help preserves mode and project');

 await p.setViewportSize({width:390,height:844});await b('このフォルダーをVS Codeで開く').scrollIntoViewIfNeeded();
 expect(await p.evaluate(()=>({body:document.body.scrollWidth>innerWidth,reader:document.querySelector('.reader-scroll').scrollWidth>document.querySelector('.reader-scroll').clientWidth}))).toEqual({body:false,reader:false});
 await b('このフォルダーをVS Codeで開く').focus();await p.keyboard.press('Tab');await expect(b('保存先をコピー')).toBeFocused();await screen('quick-390.png');record('390px layout and keyboard primary-action sequence');

 await p.setViewportSize({width:1150,height:900});await nav('作る').click();await b('別のプロジェクトを作る').click();await create('次の画面',null);
 await expect(p.locator('.project-context')).toContainText('http://localhost:3000/');await expect(p.locator('.port-explanation')).toHaveCount(0);await b('このフォルダーをVS Codeで開く').click();expect((await app.evaluate(()=>globalThis.fixture.opened)).at(-1)).toBe('/home/student/日本語の親フォルダー/次の画面');
 record('default 3000 omits mismatch prose; new project changes the editor target');

 for(const [id,goal,expected,forbidden]of [['S2','入力したメモをDBに保存したい','ローカルDBを起動する',null],['I1','SQLでDBを操作したい','SQLの主要操作を確認する','npm']]){
  await app.evaluate(()=>{globalThis.fixture.saved={view:'create',lessonId:'F2',chapterId:'',scroll:0,guideMode:'quick'}});await p.reload();await expect(mode(quick)).toBeChecked();await p.getByRole('button',{name:new RegExp(goal)}).click();await create(id+'の手順');await expect(body).toContainText(expected);
  if(id==='S2'){const headings=await body.locator('h2').allTextContents();expect(headings.indexOf('ローカルDBを起動する')).toBeLessThan(headings.indexOf('コンテナーで開く'))}
  if(forbidden){await expect(body).not.toContainText(forbidden);await expect(p.locator('.project-context')).not.toContainText('http://localhost');await expect(body).toContainText('sql/practice.sql')}
  record(id+' quick mode retains mandatory operations and correct service-specific instructions');
 }

 await nav('作る').click();await expect.poll(()=>app.evaluate(()=>globalThis.fixture.saved.view)).toBe('create');await p.reload();await expect(mode(quick)).toBeChecked();await expect(p.locator('.project-context')).toHaveCount(0);
 await nav('学ぶ').click();await p.getByLabel('教材・ガイドを選ぶ').selectOption('F2');await p.getByRole('navigation',{name:'章の一覧'}).getByRole('button',{name:'サンプル画面を表示する',exact:true}).click();await expect(body).toContainText('見本');await expect(b('このフォルダーをVS Codeで開く')).toHaveCount(0);
 record('mode persists across reload; an unbound reference guide never opens an arbitrary project');
 expect(errors).toEqual([]);fs.writeFileSync(run+'/result.json',JSON.stringify({scope:'FIXTURE_WITH_REAL_GUIDE_DATA',result:'PASS',records,errors},null,2)+'\n');console.log('Evidence:',run);
}catch(error){console.error('Evidence:',run);console.error('Focus:',await p?.evaluate(()=>document.activeElement?.outerHTML).catch(()=>''));await p?.screenshot({path:run+'/failure.png',timeout:3000}).catch(()=>{});throw error}finally{await app?.close()}
