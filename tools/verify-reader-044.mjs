import {_electron as electron,expect} from '@playwright/test';
import {fs,root,out,runtime,env,scene,json,pause,btn,command,spawn,sha} from './onboarding-evidence.mjs';
import {closeOwnedProcess} from './owned-process-exit.mjs';
const dev=process.env.TSU_READER_DEV==='1';
const normalOnly=process.argv.includes('--normal-only');
if(normalOnly&&dev)throw Error('--normal-only requires the packaged executable');
if(normalOnly&&!process.env.TSUKUHAKO_EXECUTABLE)throw Error('--normal-only requires TSUKUHAKO_EXECUTABLE');
const bin=process.env.TSUKUHAKO_EXECUTABLE||root+'/generator-desktop/node_modules/electron/dist/electron';
const profileRoot=runtime+(dev?'/reader-dev-config-'+Date.now():'/reader-final-config');
const e={...env(),XDG_CONFIG_HOME:profileRoot};delete e.ELECTRON_RUN_AS_NODE;
const records=[],errors=[];let app,p,normalChild,failure;
const record=(id,details={})=>{records.push({id,status:'PASS',...details});console.log('PASS '+id)};
const area=()=>p.getByRole('region',{name:'教材本文'});
const scroll=()=>area().evaluate(el=>el.scrollTop);
const toc=()=>p.getByRole('navigation',{name:'章の一覧'});
async function launch(){app=await electron.launch({executablePath:bin,args:dev?[root+'/generator-desktop']:[],env:e,cwd:'/tmp',chromiumSandbox:true});p=await app.firstWindow();p.setDefaultTimeout(15000);p.on('pageerror',err=>errors.push(err.message));}
async function measure(name){const dims=await p.evaluate(()=>({viewport:{width:innerWidth,height:innerHeight},outerScroll:{height:document.documentElement.scrollHeight,client:document.documentElement.clientHeight,width:document.documentElement.scrollWidth},body:{client:document.querySelector('.reader-scroll').clientHeight,content:document.querySelector('.reader-scroll').scrollHeight}}));expect(dims.outerScroll.height).toBeLessThanOrEqual(dims.outerScroll.client+1);expect(dims.outerScroll.width).toBeLessThanOrEqual(dims.viewport.width);record(name,{...dims,bounds:await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].getBounds()),zoom:await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].webContents.getZoomFactor())});await scene('UX-'+(dev?'dev-':'after-')+name,'教材の表示と操作を確認',name)}
async function zoomKeys(keys){const win=command('wmctrl',['-lp'],{env:e}).split('\n').find(l=>l.trim().split(/\s+/)[2]===String(app.process().pid));command('xdotool',['windowactivate','--sync',win.split(' ')[0]],{env:e});command('xdotool',['key',...keys],{env:e});await pause(350)}
async function bounds(width,height){await app.evaluate(({BrowserWindow},{width,height})=>BrowserWindow.getAllWindows()[0].setBounds({x:20,y:0,width,height}),{width,height});await pause(250)}
try{
 if(!normalOnly){
 await launch();await btn(p,'保存先を決める').click();await p.getByLabel('親フォルダ',{exact:true}).fill('/tmp/reader trial');await p.getByLabel('新しいフォルダ名',{exact:true}).fill('F2 入力保持');
 await btn(p,'学ぶ').click();await p.getByLabel('教材を選ぶ').selectOption('S2');await toc().getByRole('button',{name:'最初の一歩',exact:true}).click();await expect(p.locator('.markdown h1')).toHaveText('S2：最初の一歩');
 await bounds(1150,880);await measure('wide');
 await area().focus();await p.keyboard.press('PageDown');await pause(550);let saved=await scroll();expect(saved).toBeGreaterThan(100);
 await btn(p,'作る').click();await expect(p.getByLabel('新しいフォルダ名',{exact:true})).toHaveValue('F2 入力保持');await expect(p.locator('.steps')).toContainText('どこへ作るか');await btn(p,'学ぶ').click();await expect(p.locator('.markdown h1')).toHaveText('S2：最初の一歩');await expect.poll(async()=>Math.abs(await scroll()-saved)).toBeLessThanOrEqual(1);record('other-view-return',{scroll:saved,generator:'F2',lesson:'S2'});
 await bounds(860,780);await expect(btn(p,'目次を開く')).toBeVisible();await expect(toc()).not.toBeVisible();await expect.poll(async()=>Math.abs(await scroll()-saved)).toBeLessThanOrEqual(1);await measure('narrow');
 await btn(p,'目次を開く').focus();await p.keyboard.press('Enter');await expect(btn(p,'本文に戻る')).toHaveAttribute('aria-expanded','true');await expect(p.getByLabel('教材を選ぶ')).toBeFocused();await expect(toc().locator('[aria-current=page]')).toHaveText('最初の一歩');await p.keyboard.press('Escape');await expect(btn(p,'目次を開く')).toBeFocused();await expect.poll(async()=>Math.abs(await scroll()-saved)).toBeLessThanOrEqual(1);record('toc-keyboard-close-preserves-position');
 await btn(p,'目次を開く').click();await toc().locator('[aria-current=page]').focus();await p.keyboard.press('Enter');await expect(p.locator('.markdown h1')).toBeFocused();
 await btn(p,'目次を開く').click();await p.getByLabel('教材を選ぶ').selectOption('F2');await expect(p.locator('.lesson-overview h1')).toBeFocused();
 await btn(p,'目次を開く').click();await p.getByLabel('教材を選ぶ').selectOption('S2');await expect(p.locator('.lesson-overview h1')).toBeFocused();await btn(p,'最初の一歩').click();await expect(p.locator('.markdown h1')).toBeFocused();saved=await scroll();record('compact-current-chapter-and-lesson-selection-focus');
 await bounds(1150,880);await zoomKeys(['ctrl+0','ctrl+plus','ctrl+plus','ctrl+plus','ctrl+plus']);await expect.poll(()=>app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].webContents.getZoomFactor())).toBe(2);await measure('200percent');
 await btn(p,'目次を開く').click();await scene('UX-'+(dev?'dev-':'after-')+'toc-open','拡大表示で目次を開く','現在章が分かり、本文へ戻れる');await btn(p,'本文に戻る').click();await expect(area()).toBeFocused();await expect.poll(async()=>Math.abs(await scroll()-saved)).toBeLessThanOrEqual(1);
 await area().evaluate(el=>el.scrollTop=0);await p.locator('.heading-toc summary').focus();await p.keyboard.press('Enter');const headingLink=p.locator('.heading-toc button').last();await expect(headingLink).toBeVisible();const headingText=await headingLink.innerText();await headingLink.focus();await p.keyboard.press('Enter');await expect(p.getByRole('heading',{name:headingText,exact:true})).toBeFocused();expect(await scroll()).toBeGreaterThan(0);
 await area().focus();await p.keyboard.press('Control+End');await expect(p.getByRole('navigation',{name:'前後の章'})).toBeInViewport();await scene('UX-'+(dev?'dev-':'after-')+'chapter-end','本文末尾へキーボードで移動','最終行と前後章・目次ボタンに到達できる');
 await btn(p,'次の章 →').focus();await p.keyboard.press('Enter');await expect(p.locator('.chapter-meta')).not.toContainText('最初の一歩');await btn(p,'← 前の章').click();await expect(p.locator('.markdown h1')).toHaveText('S2：最初の一歩');
 await btn(p,'章の一覧へ').click();await expect(toc().locator('[aria-current=page]')).toHaveText('最初の一歩');await btn(p,'本文に戻る').click();await expect(area()).toBeFocused();record('heading-next-previous-toc',{heading:headingText,keyboard:'Enter / Escape / PageDown / Ctrl+End / Ctrl+plus'});
 await area().focus();await p.keyboard.press('Control+Home');await p.keyboard.press('PageDown');await p.keyboard.press('PageDown');await pause(550);saved=await scroll();
 await btn(p,'困ったとき').click();await expect(p.locator('.chapter-meta')).toContainText('S2');await expect(btn(p,'学んでいた章へ戻る')).toBeVisible();await p.locator('.markdown h1').waitFor();await area().focus();await p.keyboard.press('PageDown');await pause(550);const helpScroll=await scroll();await btn(p,'困ったとき').click();await btn(p,'困ったとき').click();await expect.poll(async()=>Math.abs(await scroll()-helpScroll)).toBeLessThanOrEqual(1);await btn(p,'学んでいた章へ戻る').click();await expect(p.locator('.markdown h1')).toHaveText('S2：最初の一歩');await expect.poll(async()=>Math.abs(await scroll()-saved)).toBeLessThanOrEqual(1);record('help-repeat-return',{readingScroll:saved,helpScroll});
 await zoomKeys(['ctrl+0']);await pause(550);saved=await scroll();await expect(p.getByLabel('教材を選ぶ')).toBeVisible();await p.getByLabel('教材を選ぶ').focus();await bounds(860,780);await expect(btn(p,'目次を開く')).toBeFocused();await bounds(1150,880);await expect(p.getByLabel('教材を選ぶ')).toBeFocused();await expect.poll(async()=>Math.abs(await scroll()-saved)).toBeLessThanOrEqual(1);record('breakpoint-focus-and-position');
 await btn(p,'作る').click();await expect(p.getByLabel('親フォルダ',{exact:true})).toHaveValue('/tmp/reader trial');await expect(p.getByLabel('新しいフォルダ名',{exact:true})).toHaveValue('F2 入力保持');await btn(p,'困ったとき').click();await expect(p.locator('.chapter-meta')).toContainText('F2');await btn(p,'作る画面へ戻る').click();await btn(p,'学ぶ').click();await expect(p.locator('.markdown h1')).toHaveText('S2：最初の一歩');await pause(550);saved=await scroll();
 const prefs=await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].webContents.getLastWebPreferences());expect(prefs.sandbox).toBe(true);expect(prefs.contextIsolation).toBe(true);expect(prefs.nodeIntegration).toBe(false);
 await app.close();app=null;await launch();await expect(p.locator('.markdown h1')).toHaveText('S2：最初の一歩');await expect.poll(async()=>Math.abs(await scroll()-saved)).toBeLessThanOrEqual(1);record('quit-restart-reading',{lesson:'S2',chapter:'first',scroll:saved,sandbox:true});await scene('UX-'+(dev?'dev-':'after-')+'restart','アプリを終了して再開','保存した章と本文位置が復元される');await app.close();app=null;expect(errors).toEqual([]);
 }
 if(!dev){
  const fd=fs.openSync(runtime+'/reader-normal.log','w');const child=spawn(bin,[],{env:e,cwd:'/tmp',stdio:['ignore',fd,fd]});normalChild=child;fs.closeSync(fd);const end=Date.now()+20000;let win;
  while(Date.now()<end){win=command('wmctrl',['-lp'],{env:e}).split('\n').find(l=>l.trim().split(/\s+/)[2]===String(child.pid));if(win)break;await pause(250)}
  expect(!!win).toBe(true);await pause(1500);const id=win.split(' ')[0];command('xdotool',['windowactivate','--sync',id],{env:e});
  if(!normalOnly)command('xdotool',['key','ctrl+0','ctrl+plus','ctrl+plus','ctrl+plus','ctrl+plus'],{env:e});
  await scene(normalOnly?'A-normal-launch':'UX-normal-no-debug','最終配布物を引数なしで通常起動',normalOnly?'新しい専用profileでウィンドウ表示を確認。終了結果は別ログで判定':'読書状態を復元し、ネイティブCtrl+plusで200%へ拡大');
  const readingFile=profileRoot+'/tsukuhako/reading.json';
  const exit=await closeOwnedProcess(child,()=>command('wmctrl',['-ic',id],{env:e}));
  const details={args:[],cwd:'/tmp',executableSha256:sha(bin),reading:fs.existsSync(readingFile)?JSON.parse(fs.readFileSync(readingFile)):null,exit};
  if(exit.status!=='PASS'){records.push({id:'normal-launch-no-debug',status:'FAIL',...details});throw Error('Normal launch did not exit gracefully: '+exit.reason)}
  normalChild=null;record('normal-launch-no-debug',details);
 }
 json(out+'/logs/reader-'+(normalOnly?'normal-exit':dev?'development':'final')+'.json',{status:'PASS',category:'REAL_HOST',scope:normalOnly?'packaged normal launch and exit only':dev?'development executable':'final packaged executable',records,errors,zoomMethod:normalOnly?'NOT_RUN: no UI change in this followup':'Native keyboard Ctrl+0 then Ctrl+= four times; verified Electron zoom factor 2 and CSS viewport'});
}catch(error){failure={status:'FAIL',error:String(error),records,errors};console.error(error);process.exitCode=1;await p?.screenshot({path:runtime+'/reader-failure.png'}).catch(()=>{});}finally{
 await app?.close().catch(()=>{});
 if(normalChild&&normalChild.exitCode===null&&normalChild.signalCode===null){const cleanup=await closeOwnedProcess(normalChild,()=>normalChild.kill('SIGTERM'),{timeoutMs:2000});if(failure)failure.cleanup=cleanup;}
 if(failure)json(out+'/logs/reader-'+(normalOnly?'normal-exit':dev?'development':'final')+'-failure.json',failure);
}
