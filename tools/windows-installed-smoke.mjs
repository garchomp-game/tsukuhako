// Runs only the installed application. CDP observes its normal renderer/IPC, with no mocks.
import {chromium,expect} from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import {spawn,execFileSync} from 'node:child_process';
const [exe,profile,out]=process.argv.slice(2);
if(process.platform!=='win32'||!exe||!profile||!out)throw Error('Windows installed exe, isolated profile and output required');
fs.mkdirSync(out,{recursive:true});
const errors=[],record={category:'CI',status:'FAIL',launch:'installed executable; isolated --user-data-dir and CDP observation; no sandbox overrides',rendererErrors:errors};
let child,browser;
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const save=()=>fs.writeFileSync(path.join(out,'renderer.json'),JSON.stringify(record,null,2)+'\n');
try{
 const server=net.createServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));const port=server.address().port;await new Promise(r=>server.close(r));
 const fd=fs.openSync(path.join(out,'app-stderr.log'),'w');const env={...process.env};delete env.ELECTRON_RUN_AS_NODE;
 child=spawn(exe,['--user-data-dir='+profile,'--remote-debugging-port='+port,'--remote-debugging-address=127.0.0.1'],{cwd:path.dirname(profile),env,stdio:['ignore',fd,fd]});
 record.pid=child.pid;save();child.on('error',e=>errors.push(String(e)));
 const until=Date.now()+45000;
 while(Date.now()<until){if(child.exitCode!==null)throw Error('Application exited before renderer');try{browser=await chromium.connectOverCDP('http://127.0.0.1:'+port,{timeout:1500});break}catch{await pause(250)}}
 if(!browser)throw Error('No renderer CDP session within 45 seconds');
 const context=browser.contexts()[0];let page=context.pages().find(p=>p.url().startsWith('app://tsukuhako/'));
 if(!page)page=await context.waitForEvent('page',{timeout:10000});
 page.setDefaultTimeout(15000);page.on('pageerror',e=>errors.push(e.message));page.on('crash',()=>errors.push('renderer crash'));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 await expect(page.locator('.version')).toContainText('0.4.4');
 const windowInfo=()=>JSON.parse(execFileSync('powershell.exe',['-NoProfile','-Command',`$p=Get-Process -Id ${child.pid}; @{pid=$p.Id; handle=$p.MainWindowHandle.ToInt64(); title=$p.MainWindowTitle; responding=$p.Responding; sessionId=$p.SessionId} | ConvertTo-Json -Compress`],{encoding:'utf8'}));
 await expect.poll(()=>windowInfo().handle,{timeout:10000}).not.toBe(0);record.window=windowInfo();expect(record.window.responding).toBe(true);
 await page.getByRole('navigation',{name:'ツクハコの画面'}).getByRole('button',{name:'学ぶ',exact:true}).click();
 await page.getByRole('navigation',{name:'章の一覧'}).getByRole('button',{name:'最初の一歩',exact:true}).click();
 await expect(page.locator('.markdown h1')).toHaveText('F2：最初の一歩');await expect(page.locator('.markdown')).toContainText('初期構成処理が正常終了');
 await page.getByRole('region',{name:'教材本文'}).focus();await page.keyboard.press('PageDown');await pause(700);
 const settingsFile=path.join(profile,'reading.json');await expect.poll(()=>fs.existsSync(settingsFile)).toBe(true);
 const settings=JSON.parse(fs.readFileSync(settingsFile,'utf8'));expect(settings.lessonId).toBe('F2');expect(settings.chapterId).toBe('first');expect(settings.scroll).toBeGreaterThan(0);
 record.savedReading=settings;record.chapterLoaded=true;record.url=page.url();await page.screenshot({path:path.join(out,'installed-lesson.png')});
 const alerts=await page.getByRole('alert').allTextContents();expect(alerts).toEqual([]);expect(errors).toEqual([]);
 // Real window close, then wait for the owned app process to exit gracefully.
 const closed=execFileSync('powershell.exe',['-NoProfile','-Command',`(Get-Process -Id ${child.pid}).CloseMainWindow()`],{encoding:'utf8'}).trim();expect(closed).toBe('True');
 const quitUntil=Date.now()+15000;while(child.exitCode===null&&Date.now()<quitUntil)await pause(200);
 expect(child.exitCode).toBe(0);record.gracefulExit=true;record.status='PASS';
}catch(e){record.error=String(e);process.exitCode=1;}finally{
 await browser?.close().catch(()=>{});
 if(child?.pid&&child.exitCode===null){record.forcedCleanup=true;try{execFileSync('taskkill.exe',['/PID',String(child.pid),'/T','/F'],{stdio:'ignore'})}catch{}}
 save();
}
