import {_electron as electron, expect} from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {diagnoseLocal} from '../generator-desktop/adapters/local.mjs';
import {windowsGuidance} from '../generator-desktop/adapters/wsl-guidance.mjs';

const root=path.resolve(import.meta.dirname,'..'),out=root+'/validation/ux-0.4.2';
const run=out+'/runs/gui-'+(process.env.UX_RUN||'final');
fs.mkdirSync(run,{recursive:true});fs.mkdirSync(out+'/screenshots',{recursive:true});
const extracted=run+'/アプリ 展開';fs.mkdirSync(extracted);
const archive=root+'/dist/tsukuhako-linux-x64-0.4.2.tar.gz';
expect(spawnSync('tar',['-xzf',archive,'-C',extracted]).status).toBe(0);
const bin=extracted+'/tsukuhako-linux-x64-0.4.2/tsukuhako',env={...process.env};delete env.ELECTRON_RUN_AS_NODE;
const artifact=createHash('sha256').update(fs.readFileSync(archive)).digest('hex');
const records=[],errors=[];let app,page;
const record=(id,details={})=>{records.push({id,status:'PASS',...details});console.log('PASS',id)};
const button=name=>['作る','学ぶ','困ったとき'].includes(name)?page.getByRole('navigation',{name:'ツクハコの画面'}).getByRole('button',{name,exact:true}):page.getByRole('button',{name,exact:true});
const shot=name=>page.screenshot({path:out+'/screenshots/'+name+'.png'});
async function launch(profile){app=await electron.launch({executablePath:bin,args:['--user-data-dir='+profile],env,chromiumSandbox:true});page=await app.firstWindow();page.setDefaultTimeout(15000);page.on('pageerror',e=>errors.push(e.message));await button('保存先を決める').waitFor();}
async function missingTools(missing){
 const result=await diagnoseLocal({platform:'linux',templateId:'S2',includeCode:false,env:{},runner:async(name,args)=>missing.includes(name)?{ok:false,error:'ENOENT',output:''}:{ok:true,output:args.includes('inspect')?'unix:///var/run/docker.sock':args.includes('info')?JSON.stringify({OSType:'linux',OperatingSystem:'Docker Desktop'}):'1.0'}});
 return windowsGuidance(result.checks);
}
try{
 await launch(run+'/profile');
 await expect(page.getByText('Docker：利用可能',{exact:true})).toBeVisible();
 const prefs=await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].webContents.getLastWebPreferences());
 expect(prefs.sandbox).toBe(true);expect(prefs.contextIsolation).toBe(true);expect(prefs.nodeIntegration).toBe(false);
 await button('学ぶ').click();await page.getByLabel('教材を選ぶ').selectOption('S2');
 await page.getByRole('navigation',{name:'章の一覧'}).getByRole('button',{name:'最初の一歩',exact:true}).click();
 await expect(page.locator('.markdown h1')).toHaveText('S2：最初の一歩');
 await page.locator('.reader-scroll').evaluate(el=>el.scrollTop=510);await page.waitForTimeout(550);
 const readingScroll=await page.locator('.reader-scroll').evaluate(el=>el.scrollTop);
 await button('困ったとき').click();await expect(page.getByLabel('教材を選ぶ')).toHaveValue('S2');
 await expect(button('学んでいた章へ戻る')).toBeVisible();
 await page.locator('.markdown h1').waitFor();
 await page.locator('.reader-scroll').evaluate(el=>el.scrollTop=310);await page.waitForTimeout(550);
 const helpBefore=await page.evaluate(()=>window.tsukuhako.readSettings());
 expect(helpBefore.ok&&helpBefore.value.view).toBe('help');
 expect(helpBefore.value.chapterId).toBe('recovery');
 expect(helpBefore.value.scroll).toBeGreaterThan(250);
 await button('困ったとき').click();await button('困ったとき').click();await page.waitForTimeout(550);
 expect(await page.evaluate(()=>window.tsukuhako.readSettings())).toEqual(helpBefore);
 await expect(page.getByLabel('教材を選ぶ')).toHaveValue('S2');await expect(button('学んでいた章へ戻る')).toBeVisible();
 await shot('help-repeat-S2');
 await button('学んでいた章へ戻る').click();await expect(page.locator('.markdown h1')).toHaveText('S2：最初の一歩');
 await expect.poll(()=>page.locator('.reader-scroll').evaluate(el=>el.scrollTop)).toBe(readingScroll);
 record('R041-2-learn-S2-help-three-clicks-return-position',{generatorTemplate:'F2',learningTemplate:'S2',readingScroll,helpScroll:helpBefore.value.scroll});
 await button('作る').click();await button('困ったとき').click();await expect(page.getByLabel('教材を選ぶ')).toHaveValue('F2');
 await expect(button('作る画面へ戻る')).toBeVisible();await button('困ったとき').click();await expect(page.getByLabel('教材を選ぶ')).toHaveValue('F2');await button('作る画面へ戻る').click();
 record('R041-2-create-F2-help-repeat-return');

 const socket=net.createServer();await new Promise((resolve,reject)=>{socket.once('error',reject);socket.listen(0,'127.0.0.1',resolve)});
 const port=socket.address().port;await new Promise(resolve=>socket.close(resolve));
 const folder='F2 日本語 復元の練習.dir',destination=path.join(run,folder);
 await button('保存先を決める').click();await page.getByLabel('親フォルダ',{exact:true}).fill(run);await page.getByLabel('新しいフォルダ名',{exact:true}).fill(folder);
 await page.locator('.advanced summary').click();await page.getByLabel('ホストポート',{exact:true}).fill(String(port));
 await button('作成内容を確認').click();await button('プロジェクトを作成').click();await button('この構成の「最初の一歩」を読む').click();
 await expect(page.locator('.markdown h1')).toHaveText('F2：最初の一歩');await expect(page.locator('.markdown')).toContainText(String(port));
 const headings=page.locator('.markdown h3');
 const restore=headings.filter({hasText:'元の内容に戻して保存する'});
 await restore.scrollIntoViewIfNeeded();
 const restoreText=await restore.evaluate(el=>{let text='';for(let n=el.nextElementSibling;n&&n.tagName!=='H3';n=n.nextElementSibling)text+=n.textContent+'\n';return text});
 expect(restoreText).toContain('場所：VS Codeの編集画面');expect(restoreText).toContain('app/page.tsx');expect(restoreText).not.toContain('ブラウザのアドレス欄');
 const verifyText=await headings.filter({hasText:'復元した結果を確認する'}).evaluate(el=>{let text='';for(let n=el.nextElementSibling;n&&n.tagName!=='H3';n=n.nextElementSibling)text+=n.textContent+'\n';return text});
 expect(verifyText).toContain('場所：OSのブラウザのアドレス欄');expect(verifyText).toContain(`http://localhost:${port}/`);
 await shot('F2-restore-guide');
 const guide=fs.readFileSync(destination+'/START_HERE.md','utf8');
 fs.writeFileSync(out+'/generated-F2-START_HERE.md',guide);
 fs.writeFileSync(out+'/project.json',JSON.stringify({artifact,bin,destination,port,template:'F2',templateVersion:'0.1.1',guideSha256:createHash('sha256').update(guide).digest('hex'),method:'Actual Linux packaged app UI generation; runtime exercise recorded separately'},null,2)+'\n');
 record('R041-1-F2-final-package-generation-and-distinct-guide-steps',{destination,port});
 await app.close();app=null;

 // Only IPC observations are fixtures. This does not install tools or exercise Windows.
 await launch(run+'/windows-fixture-profile');
 const missing=await missingTools(['curl','timeout']),ready=await missingTools([]);
 await app.evaluate(({ipcMain},{missing,ready})=>{
  globalThis.reviewFixture={ready:false,missing,complete:ready,calls:[],installs:0};
  const distros=[{id:'1111222233334444',name:'Ubuntu Other',generation:2,state:'Stopped'},{id:'5555666677778888',name:'Ubuntu Lab',generation:2,state:'Stopped'}];
  ipcMain.removeHandler('tsukuhako:getPreparation');ipcMain.handle('tsukuhako:getPreparation',()=>({ok:true,value:{platform:'win32',arch:'x64',distros}}));
  ipcMain.removeHandler('tsukuhako:checkPreparation');ipcMain.handle('tsukuhako:checkPreparation',(_,payload)=>{const f=globalThis.reviewFixture;f.calls.push(payload);return{ok:true,value:{platform:'win32',arch:'x64',distros,templateId:payload.templateId,checkedAt:new Date().toISOString(),helperReady:true,dockerReady:true,target:{distro:'Ubuntu Lab',distroId:payload.distroId,user:'student',home:'/home/student'},checks:f.ready?f.complete:f.missing}}});
  ipcMain.removeHandler('tsukuhako:prepareWSL');ipcMain.handle('tsukuhako:prepareWSL',()=>{globalThis.reviewFixture.installs++;return{ok:false,error:{code:'FIXTURE',message:'Unexpected install',nextAction:'',details:{}}}});
 },{missing,ready});
 await page.reload();await page.getByLabel('開発するWSL').selectOption('5555666677778888');await page.locator('.goal').nth(3).click();await button('もう一度確認').first().click();
 const curl=()=>page.locator('.prep-details li').filter({hasText:'S2のホスト用 curl の確認'});
 await expect(curl().locator('.state')).toHaveText('未導入');
 await button('保存先を決める').click();await page.getByLabel('親フォルダ',{exact:true}).fill('/home/student/練習用');await page.getByLabel('新しいフォルダ名',{exact:true}).fill('S2 入力保持');
 await curl().getByRole('button',{name:'公式導入先・手順を読む',exact:true}).click();
 await expect(page.locator('.markdown h1')).toHaveText('Windows / WSL 2の準備');
 await page.getByRole('button',{name:'S2の追加準備',exact:true}).click();await expect(page.getByLabel('教材を選ぶ')).toHaveValue('S2');
 await expect(page.locator('.markdown')).toContainText('curl、tar、sha256sum、timeout');await shot('S2-additional-setup');
 await button('作る画面へ戻る').click();await expect(page.getByLabel('開発するWSL')).toHaveValue('5555666677778888');
 await expect(page.getByLabel('親フォルダ',{exact:true})).toHaveValue('/home/student/練習用');await expect(page.getByLabel('新しいフォルダ名',{exact:true})).toHaveValue('S2 入力保持');
 await expect(curl().locator('.state')).toHaveText('未導入');await button('もう一度確認').first().click();await expect(curl().locator('.state')).toHaveText('未導入');
 await app.evaluate(()=>{globalThis.reviewFixture.ready=true});await expect(curl().locator('.state')).toHaveText('未導入');
 await button('もう一度確認').first().click();await page.locator('.prep-details summary').click();await expect(curl().locator('.state')).toHaveText('利用可能');
 const fixture=await app.evaluate(()=>({calls:globalThis.reviewFixture.calls,installs:globalThis.reviewFixture.installs}));
 expect(fixture.calls).toEqual(Array(3).fill({templateId:'S2',distroId:'5555666677778888'}));expect(fixture.installs).toBe(0);
 record('R041-3-Windows-S2-missing-tools-guide-return-recheck',{scope:'Windows IPC observations on Linux; not Windows/WSL integration',...fixture});
 await app.close();app=null;expect(errors).toEqual([]);
 fs.writeFileSync(out+'/gui.json',JSON.stringify({status:'PASS',artifact,run,records,errors,windowsMacReal:'NOT_RUN',beginnerTrial:'NOT_RUN'},null,2)+'\n');
}catch(error){
 fs.writeFileSync(out+'/gui-failure.json',JSON.stringify({error:String(error),records,errors},null,2)+'\n');await shot('failure').catch(()=>{});console.error(error);process.exitCode=1;
}finally{await app?.close().catch(()=>{});}
