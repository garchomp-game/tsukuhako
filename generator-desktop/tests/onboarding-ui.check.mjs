// Renderer integration fixture. No actual Docker/VS Code/WSL/install operation.
// Run after `npm --prefix generator-desktop run build` and `npm --prefix tools ci`.
import {_electron as electron,expect} from '../../tools/node_modules/@playwright/test/index.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'../..'),run=fs.mkdtempSync(path.join(os.tmpdir(),'tsukuhako-onboarding-ui-'));
import {source} from './onboarding-fixture.mjs';

const entry=path.join(run,'fixture.cjs');fs.writeFileSync(entry,source);
const env={...process.env,TSUKUHAKO_UI_ROOT:root,TSUKUHAKO_UI_PROFILE:path.join(run,'profile')};delete env.ELECTRON_RUN_AS_NODE;
let app,page;const records=[],errors=[],screenshots=[];
async function capture(name){
 // A hidden native window may return its previous painted frame. Show only this
 // isolated fixture window for capture, then restore its hidden state.
 await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].showInactive());
 try{await page.locator('.preparation').evaluate(el=>el.scrollIntoView({block:'start'}));await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));await page.screenshot({path:path.join(run,name),clip:{x:0,y:0,width:1280,height:720},timeout:20000});screenshots.push(name)}
 finally{await app.evaluate(({BrowserWindow})=>process.env.TSUKUHAKO_UI_VISIBLE?BrowserWindow.getAllWindows()[0].showInactive():BrowserWindow.getAllWindows()[0].hide())}
}
const record=name=>{records.push(name);console.log('PASS',name)};
try{
 app=await electron.launch({executablePath:path.join(root,'generator-desktop/node_modules/electron/dist/electron'),args:[entry],env});
 page=await app.firstWindow();page.setDefaultTimeout(12000);page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>Object.defineProperty(navigator,'clipboard',{value:{writeText:async text=>{window.__copied=text}}}));await page.reload();
 const button=name=>page.getByRole('button',{name,exact:true});
 const nav=name=>page.getByRole('navigation',{name:'ツクハコの画面'}).getByRole('button',{name,exact:true});
 await expect(button('保存先を決める')).toBeEnabled();
 await capture('preparation-missing-fixture.png');
 await button('はじめてのWeb画面で始める').click();await expect(page.locator('#generator-title')).toBeFocused();await button('準備の状態を確認').click();await expect(page.locator('#preparation-title')).toBeFocused();
 await page.locator('.preparation-item').first().getByRole('button').click();
 await expect(page.locator('.markdown h1')).toHaveText('Linuxの準備');await expect(page.locator('#dockerを使えるようにする')).toBeFocused();
 await button('準備チェックへ戻る').click();record('Linux runtime missing allows creation; preparation link focuses the exact heading');
 for(const state of ['stopped','setup','restart','unknown']){await app.evaluate((_,state)=>{globalThis.fixture.state=state},state);await button('もう一度確認').click();await expect(page.locator('.preparation-item').first().locator('.state')).toHaveClass('state '+state);if(state==='unknown')await capture('preparation-unknown-fixture.png')}
 record('stopped, setup, restart, unknown remain distinct');
 async function create(folder,port){if(await button('作成に戻る').first().isVisible())await button('作成に戻る').first().click();await expect(button('保存先を決める').or(page.getByLabel('親フォルダ',{exact:true}))).toBeVisible();if(await button('保存先を決める').isVisible())await button('保存先を決める').click();await page.getByLabel('親フォルダ',{exact:true}).fill('/home/student/日本語の長い 親フォルダー');await page.getByLabel('新しいフォルダ名').fill(folder);if(!await page.getByLabel('ホストポート',{exact:true}).isVisible())await page.locator('.advanced summary').click();await page.getByLabel('ホストポート',{exact:true}).fill(String(port));await button('作成内容を確認').click();await button('プロジェクトを作成').click();await expect(page.locator('.created-actions button')).toHaveCount(1);await button('サンプル画面を表示する手順へ').click();await expect(page.locator('.markdown h1')).toHaveText('サンプル画面を表示する')}
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
 await create('Windows 今回の手順',4201);await nav('困ったとき').click();await expect(page.getByLabel('教材・ガイドを選ぶ')).toHaveValue('F2');await expect(page.locator('#準備が足りないとき')).toBeFocused();await expect(page.locator('.project-context')).toContainText('Windows 今回の手順');
 await button('読んでいた手順へ戻る').click();await expect(page.locator('.project-context')).toContainText('4201');
 await nav('作る').click();await nav('困ったとき').click();await expect(page.locator('#準備が足りないとき')).toBeFocused();await expect(page.getByLabel('教材・ガイドを選ぶ')).toHaveValue('F2');await button('作る画面へ戻る').click();await button('サンプル画面を表示する手順へ').click();
 await app.evaluate(()=>{globalThis.fixture.editorError=true});await button('このフォルダーをVS Codeで開く').click();await page.locator('.project-editor-action .error').getByRole('button',{name:'困ったときの手順へ'}).click();await expect(page.locator('#準備が足りないとき')).toBeFocused();await expect(page.getByLabel('教材・ガイドを選ぶ')).toHaveValue('F2');await button('読んでいた手順へ戻る').click();
 record('Windows first-guide help and editor failure stay on its current project and preserve return state');
 await nav('作る').click();await page.getByLabel('開発するWSL').selectOption('bbbbbbbbbbbbbbbb');await expect(button('保存先を決める')).toBeDisabled();record('Windows requires the helper for the selected distribution; switching invalidates it');

 await page.setViewportSize({width:1280,height:1000});
 // Start now opens the recommended destination directly; prose follows that flow.
 await app.evaluate(()=>{Object.assign(globalThis.fixture,{platform:'linux',helper:false,planError:false,applyError:false,saved:{view:'create',lessonId:'F2',chapterId:'',scroll:0}})});await page.reload();
 await button('全体の流れを読む').click();
 await page.getByRole('navigation',{name:'章の一覧'}).getByRole('button',{name:'サンプル画面を表示する',exact:true}).click();
 await expect(page.locator('.markdown')).toContainText('保存先の入力画面');
 await nav('作る').click();await button('はじめてのWeb画面で始める').click();await expect(page.locator('#generator-title')).toBeFocused();
 await expect(page.locator('#generator-title')).toHaveText('プロジェクトの置き場所を決めます。');await expect(page.getByLabel('親フォルダ',{exact:true})).toBeVisible();await expect(page.locator('.preparation')).toBeHidden();
 record('Start opens the recommended destination directly, with preparation available on demand');
 for(const platform of ['linux','win32'])for(const [id,name,goal] of [['F2','はじめてのWeb画面',null],['I1','SQLで調べるデータベース','SQLを学ぶ'],['S2','メモを保存するWeb画面','保存機能を作る']]){
  await app.evaluate((_,platform)=>{Object.assign(globalThis.fixture,{platform,helper:false,planError:false,applyError:false,saved:{view:'create',lessonId:'F2',chapterId:'',scroll:0}})},platform);await page.reload();
  await expect(button('はじめてのWeb画面で始める')).toBeEnabled();
  if(goal)await page.getByRole('button',{name:new RegExp(goal)}).click();
  const checkHelp=async(heading,entry)=>{
   await entry.click();await expect(page.getByLabel('教材・ガイドを選ぶ')).toHaveValue(id);await expect(page.locator('.markdown h1')).toHaveText(name+'を作る前に困ったとき');await expect(page.locator('[id="'+heading+'"]').filter({hasText:heading})).toBeFocused();
   const body=page.locator('.markdown');await expect(body).not.toContainText('npm run dev');await expect(body).not.toContainText('scripts/db.sh');
   await expect(body.getByRole('button',{name:platform==='linux'?'Linuxの準備':'Windowsと選択したWSLの準備',exact:true})).toHaveCount(1);
   await expect(body.getByRole('button',{name:platform==='linux'?'Windowsと選択したWSLの準備':'Linuxの準備',exact:true})).toHaveCount(0);
  };
  await checkHelp('準備を確認する',nav('困ったとき'));
  if(platform==='win32'&&id==='I1'){await page.locator('.reader-scroll').evaluate(e=>{e.scrollTop=0});await page.screenshot({path:path.join(run,'windows-sql-creation-help-fixture.png')});screenshots.push('windows-sql-creation-help-fixture.png')}
  await page.locator('.markdown').getByRole('button',{name:platform==='linux'?'Linuxの準備':'Windowsと選択したWSLの準備',exact:true}).click();await expect(page.locator('.markdown h1')).toHaveText(platform==='linux'?'Linuxの準備':'Windowsの準備');await button('準備チェックへ戻る').click();await expect(page.locator('#preparation-title')).toBeFocused();
  if(platform==='win32'){
   await expect(button('保存先を決める')).toBeDisabled();await page.getByLabel('開発するWSL').selectOption('aaaaaaaaaaaaaaaa');await button('もう一度確認').click();await expect(button('保存先を決める')).toBeDisabled();await button('WSL用ファイルを準備').click();
  }
  await button('保存先を決める').click();await page.getByLabel('新しいフォルダ名').fill('保持する入力 '+id);
  await checkHelp('保存先を確認する',nav('困ったとき'));await button('作る画面へ戻る').click();await expect(page.getByLabel('新しいフォルダ名')).toHaveValue('保持する入力 '+id);
  await app.evaluate(()=>{globalThis.fixture.planError=true});await button('作成内容を確認').click();
  await checkHelp('保存先を確認する',button('困ったときの手順を読む'));await button('作る画面へ戻る').click();
  await app.evaluate(()=>{globalThis.fixture.planError=false});await button('作成内容を確認').click();
  await checkHelp('作成内容を確認する',nav('困ったとき'));await button('作る画面へ戻る').click();
  await app.evaluate(()=>{globalThis.fixture.applyError=true});await button('プロジェクトを作成').click();
  await checkHelp('作成に失敗したとき',button('困ったときの手順を読む'));await button('作る画面へ戻る').click();
  await checkHelp('作成に失敗したとき',nav('困ったとき'));await button('作る画面へ戻る').click();await expect(page.locator('.preview')).toContainText('保持する入力 '+id);
  record('V02: '+platform+' '+id+' selected preparation, destination/plan error, confirmation/apply error and preserved return');
 }

 for(const platform of ['darwin','unknown']){
  await app.evaluate((_,platform)=>{Object.assign(globalThis.fixture,{platform,helper:false,planError:false,applyError:false,saved:{view:'create',lessonId:'F2',chapterId:'',scroll:0}})},platform);await page.reload();await expect(button('はじめてのWeb画面で始める')).toBeEnabled();await nav('困ったとき').click();
  await expect(page.locator('.markdown h1')).toHaveText('はじめてのWeb画面を作る前に困ったとき');await expect(page.locator('.markdown')).not.toContainText('<!--');
  const choices=page.locator('.markdown').getByRole('button').filter({hasText:/^(Linuxの準備|Windowsと選択したWSLの準備|macOSの参考手順)$/});await expect(choices).toHaveCount(platform==='darwin'?1:3);
  if(platform==='darwin')await expect(choices).toHaveText('macOSの参考手順');else await expect(page.locator('.markdown')).toContainText('OSの確認結果がまだない場合');
  record('V02: '+platform+' creation help keeps explicit OS guidance without markup');
 }
 expect(errors).toEqual([]);fs.writeFileSync(path.join(run,'result.json'),JSON.stringify({scope:'FIXTURE',records,errors,screenshots},null,2));console.log('Evidence:',run);
}catch(error){console.error(error);console.error('Focus:',await page?.evaluate(()=>document.activeElement?.outerHTML).catch(()=>''));await page?.screenshot({path:path.join(run,'failure.png'),timeout:3000}).catch(()=>{});console.error('Evidence:',run);throw error}finally{await app?.close()}
