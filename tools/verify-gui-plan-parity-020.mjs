import {_electron as electron,expect} from '@playwright/test';
import fs from 'node:fs';import path from 'node:path';import {spawnSync} from 'node:child_process';
const root=path.resolve(import.meta.dirname,'..'),runs=path.join(root,'validation/generator-0.2.0/runs');
const base=path.join(runs,'gui-plan-parity');fs.mkdirSync(base,{recursive:true});
const bin=path.join(base,'bin');fs.mkdirSync(bin);fs.symlinkSync('/usr/bin/cksum',path.join(bin,'cksum'));
const packaged=path.join(runs,'gui-relocated-tested/別の 場所/meikyo-generator-linux-x64-0.2.0');
const cli=path.join(runs,'cli-relocated/別の 場所/meikyo-generator-cli-0.2.0-linux/generator/cli.mjs');
const env={...process.env,PATH:bin,NODE_PATH:'',NODE_OPTIONS:''};delete env.ELECTRON_RUN_AS_NODE;
const app=await electron.launch({executablePath:path.join(packaged,'meikyo-generator'),args:[`--user-data-dir=${path.join(base,'profile')}`],env,chromiumSandbox:true});
const results=[];
try{
 const page=await app.firstWindow();await expect(page.getByRole('button',{name:'保存先へ進む →'})).toBeEnabled();
 for(const id of ['F1','F2','B1','S1','S2','I1']){
  const folder=id+' planのみ',destination=path.join(base,folder);
  const gui=await page.evaluate(r=>window.meikyo.plan(r),{templateId:id,parent:base,folder});expect(gui.ok).toBe(true);
  const explicit=spawnSync(process.execPath,[cli,'plan',id,destination,'--json'],{encoding:'utf8',cwd:'/tmp'});expect(explicit.status).toBe(0);
  const planned=JSON.parse(explicit.stdout);expect(gui.value).toEqual(planned);expect(fs.existsSync(destination)).toBe(false);results.push({id,status:'PASS',planId:planned.planId,entirePlanEqual:true,noWrites:true});
 }
 await page.getByRole('button',{name:/SQL・DBを学びたい/}).click();await page.getByRole('button',{name:'保存先へ進む →'}).click();await page.getByLabel('親フォルダ',{exact:true}).fill(base);await page.getByLabel('新しいフォルダ名',{exact:true}).fill('I1 Codeなし');await page.getByRole('button',{name:'内容を確認 →'}).click();await expect(page.getByRole('button',{name:'この内容で作成'})).toBeEnabled();await page.getByRole('button',{name:'この内容で作成'}).click();await expect(page.getByRole('heading',{name:'プロジェクトのファイルを作成しました。'})).toBeVisible();
 await page.getByRole('button',{name:'VS Codeで開く ↗'}).click();await expect(page.getByRole('alert')).toContainText('VS Codeを開けませんでした');await expect(page.getByRole('heading',{name:'プロジェクトのファイルを作成しました。'})).toBeVisible();
 const secret=fs.readFileSync(path.join(base,'I1 Codeなし/.env'),'utf8').match(/POSTGRES_PASSWORD=(.*)/)[1];expect(await page.locator('body').innerText()).not.toContain(secret);expect(fs.existsSync(path.join(base,'I1 Codeなし/START_HERE.md'))).toBe(true);
 await page.screenshot({path:path.join(root,'validation/generator-0.2.0/gui/06-code-unavailable.png'),fullPage:true});results.push({id:'G07-G11-G12-editor-unavailable',status:'PASS',creationRemainsSuccess:true,hostNodeAndDockerAndCodeAbsent:true,secretNotDisplayed:true});
 console.log(JSON.stringify({status:'PASS',results}));
 fs.writeFileSync(path.join(root,'validation/generator-0.2.0/gui/plan-parity.json'),JSON.stringify({status:'PASS',results},null,2)+'\n');
}finally{await app.close()}
