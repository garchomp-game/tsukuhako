import { _electron as electron } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const output=path.join(root,'validation/generator-0.2.0/gui-probe');fs.mkdirSync(output,{recursive:true});
const env={...process.env};delete env.ELECTRON_RUN_AS_NODE;
const app=await electron.launch({executablePath:path.join(root,'generator-desktop/node_modules/electron/dist/electron'),args:[path.join(root,'generator-desktop'),`--user-data-dir=${path.join(root,'validation/generator-0.2.0/runs/gui-dev-profile')}`],env,chromiumSandbox:true,timeout:30000});
try{
 const page=await app.firstWindow();page.on('console',m=>console.log('console',m.type(),m.text()));page.on('pageerror',e=>console.log('pageerror',e.message));
 await page.getByRole('heading',{name:'まず何を作りますか？'}).waitFor({timeout:15000});
 await page.getByRole('button',{name:'保存先へ進む →'}).waitFor();
 await page.screenshot({path:path.join(output,'purpose.png'),fullPage:true});
 console.log(await page.locator('body').innerText());
 console.log(await app.evaluate(({BrowserWindow,app})=>({electron:process.versions.electron,node:process.versions.node,visible:BrowserWindow.getAllWindows()[0].isVisible(),preferences:BrowserWindow.getAllWindows()[0].webContents.getLastWebPreferences(),metrics:app.getAppMetrics().map(x=>({type:x.type,name:x.name,pid:x.pid}))})));
}catch(e){console.log('window:',await (await app.firstWindow()).locator('body').innerText());throw e}finally{await app.close()}
