import {chromium,expect} from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
const root=path.resolve(import.meta.dirname,'..'),out=root+'/validation/ux-0.4.2';
const project=JSON.parse(fs.readFileSync(out+'/project.json')),file=project.destination+'/app/page.tsx';
const original=fs.readFileSync(file,'utf8'),changed=original.replace('小さく変えて、<br />動きを確かめよう。','わたしの練習室');expect(changed).not.toBe(original);
const code=await chromium.connectOverCDP('http://127.0.0.1:9422'),editor=code.contexts()[0].pages()[0];
const web=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true}),page=await web.newPage({viewport:{width:1200,height:850}});
editor.setDefaultTimeout(10000);page.setDefaultTimeout(15000);
async function edit(before,after,text){
 await editor.bringToFront();await editor.keyboard.press('Escape');
 await editor.locator('.part.editor [role="textbox"]').first().focus();
 await editor.keyboard.press('Control+h');await editor.locator('.find-widget').getByRole('textbox',{name:'Find',exact:true}).fill(before);
 await editor.locator('.find-widget').getByRole('textbox',{name:'Replace',exact:true}).fill(after);
 await expect(editor.locator('.find-widget')).toContainText('1 of 1');
 await editor.locator('.find-widget').getByRole('button',{name:'Replace (Enter)',exact:true}).click();
 await editor.keyboard.press('Escape');await editor.keyboard.press('Control+s');
 await expect.poll(()=>fs.readFileSync(file,'utf8')).toBe(text);
}
try{
 await expect(editor).toHaveTitle(/Dev Container: ツクハコ F2/);
 await page.goto(`http://localhost:${project.port}/`);await expect(page.locator('h1')).toContainText('小さく変えて、');await page.screenshot({path:out+'/screenshots/f2-before.png'});
 await edit('小さく変えて、<br />動きを確かめよう。','わたしの練習室',changed);await expect(page.locator('h1')).toHaveText('わたしの練習室');
 await editor.screenshot({path:out+'/screenshots/vscode-f2-edited.png'});await page.screenshot({path:out+'/screenshots/f2-changed.png'});
 await edit('わたしの練習室','小さく変えて、<br />動きを確かめよう。',original);await expect(page.locator('h1')).toContainText('小さく変えて、');await expect(page.locator('h1')).not.toContainText('わたしの練習室');
 await editor.screenshot({path:out+'/screenshots/vscode-f2-restored.png'});await page.screenshot({path:out+'/screenshots/f2-restored.png'});
 const container=spawnSync('docker',['ps','-q','--filter','label=devcontainer.local_folder='+project.destination],{encoding:'utf8'});expect(container.status).toBe(0);expect(container.stdout.trim()).toMatch(/^[a-f0-9]{12}$/);
 fs.writeFileSync(out+'/vscode-f2.json',JSON.stringify({status:'PASS',artifact:project.artifact,guideSha256:project.guideSha256,os:'Linux Mint 22.3 x64',vscode:'1.142.0',extension:'0.470.0',template:'F2 0.1.1',container:container.stdout.trim(),port:project.port,fileSha256:createHash('sha256').update(original).digest('hex'),operations:['Actual final 0.4.2 app: F2 generation into a Japanese folder with an unused port','Host: doctor-host.sh','Actual VS Code UI: trust this generated folder and connect to Dev Container','Actual VS Code integrated terminal: pwd is /workspace; npm run dev; Ready shown','VS Code editor: change the heading and save','Browser: changed heading through HMR','VS Code editor: restore original bytes and save','Browser: original heading restored'],reconnect:'NOT_RUN',rebuildAfterEdits:'NOT_RUN',method:'Developer-led actual Linux VS Code UI + browser; not a beginner trial'},null,2)+'\n');
 console.log('F2 actual VS Code edit/save, browser HMR, restore/save, browser restoration PASS');
}finally{
 if(fs.readFileSync(file,'utf8')!==original)fs.writeFileSync(file,original);
 await web.close();await code.close();
}
