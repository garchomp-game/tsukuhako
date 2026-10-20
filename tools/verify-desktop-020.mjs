import { _electron as electron, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
const root=path.resolve(import.meta.dirname,'..');
const output=path.join(root,'validation/generator-0.2.0/gui');fs.mkdirSync(output,{recursive:true});
const base=path.join(root,'validation/generator-0.2.0/runs/gui-relocated-tested/別の 場所');fs.mkdirSync(base,{recursive:true});
const archive=path.join(root,'dist/meikyo-generator-linux-x64-0.2.0.tar.gz');
const extracted=spawnSync('tar',['-xzf',archive,'-C',base],{encoding:'utf8'});if(extracted.status!==0)throw Error(extracted.stderr);
const packaged=path.join(base,'meikyo-generator-linux-x64-0.2.0');
const bin=path.join(base,'probe-bin');fs.mkdirSync(bin,{recursive:true});
for(const name of ['cksum','bash'])fs.symlinkSync(`/usr/bin/${name}`,path.join(bin,name));
const codeArgs=path.join(base,'editor-args.bin');
fs.writeFileSync(path.join(bin,'code'),'#!/bin/sh\ncase "$1" in\n --version) printf "test-code\\n";;\n --list-extensions) printf "ms-vscode-remote.remote-containers\\n";;\n *) printf "%s\\0" "$@" > "$MEIKYO_TEST_EDITOR_ARGS";;\nesac\n',{mode:0o755});
const env={...process.env,PATH:bin,MEIKYO_TEST_EDITOR_ARGS:codeArgs,NODE_PATH:'',NODE_OPTIONS:''};delete env.ELECTRON_RUN_AS_NODE;
const records=[],errors=[];
const sha=x=>createHash('sha256').update(x).digest('hex');
const cli=path.join(root,'validation/generator-0.2.0/runs/cli-relocated/別の 場所/meikyo-generator-cli-0.2.0-linux/generator/cli.mjs');
function snapshot(dir,redact=false){const result={};function walk(p){for(const entry of fs.readdirSync(p,{withFileTypes:true})){const f=path.join(p,entry.name);if(entry.isDirectory())walk(f);else{let b=fs.readFileSync(f);if(redact&&entry.name==='.env')b=Buffer.from(b.toString().replace(/POSTGRES_PASSWORD=.*/, 'POSTGRES_PASSWORD=<random>'));result[path.relative(dir,f)]=sha(b)}}}walk(dir);return result}
const app=await electron.launch({executablePath:path.join(packaged,'meikyo-generator'),args:[`--user-data-dir=${path.join(base,'profile')}`],env,chromiumSandbox:true,timeout:30000});
let page;
async function load(){await page.reload();await expect(page.getByRole('button',{name:'保存先へ進む →'})).toBeEnabled()}
async function form(folder){await page.getByRole('button',{name:'保存先へ進む →'}).click();await page.getByLabel('親フォルダ',{exact:true}).fill(base);await page.getByLabel('新しいフォルダ名',{exact:true}).fill(folder)}
async function preview(){await page.getByRole('button',{name:'内容を確認 →'}).click();await expect(page.getByRole('heading',{name:'この内容で作成します。'})).toBeVisible()}
function add(id,detail){records.push({id,status:'PASS',...detail});console.log('PASS',id)}
try{
 page=await app.firstWindow();page.on('pageerror',e=>errors.push(e.message));await expect(page.getByRole('button',{name:'保存先へ進む →'})).toBeEnabled();
 const metadata=await app.evaluate(({app,BrowserWindow})=>({electron:process.versions.electron,node:process.versions.node,appPath:app.getAppPath(),visible:BrowserWindow.getAllWindows()[0].isVisible(),preferences:BrowserWindow.getAllWindows()[0].webContents.getLastWebPreferences(),arguments:process.argv}));
 expect(metadata.visible).toBe(true);expect(metadata.preferences.sandbox).toBe(true);expect(metadata.preferences.contextIsolation).toBe(true);expect(metadata.preferences.nodeIntegration).toBe(false);expect(metadata.arguments).not.toContain('--no-sandbox');expect(metadata.appPath).toBe(path.join(packaged,'resources/app'));
 const exposed=await page.evaluate(()=>({require:typeof window.require,process:typeof window.process,keys:Object.keys(window.meikyo)}));expect(exposed.require).toBe('undefined');expect(exposed.process).toBe('undefined');expect(exposed.keys.sort()).toEqual(['getTemplates','chooseParentDirectory','plan','diagnose','apply','openInVSCode'].sort());
 add('G13-renderer-and-sandbox',{metadata,exposed,hostNode:'PATH contains only test code, cksum and bash; no node/npm/Docker'});
 await page.screenshot({path:path.join(output,'01-purpose.png'),fullPage:true});
 // Strict validation happens at the real IPC boundary.
 const bad=await page.evaluate(async parent=>Promise.all([
  window.meikyo.plan({templateId:'S3',parent,folder:'rejected'}),window.meikyo.plan({templateId:'F2',parent,folder:'rejected',bundleRoot:'/tmp'}),window.meikyo.apply({planId:'not-a-plan'}),window.meikyo.openInVSCode()
 ]),base);
 expect(bad.every(x=>x.ok===false)).toBe(true);expect(fs.existsSync(path.join(base,'rejected'))).toBe(false);add('G13-real-ipc-validation',{codes:bad.map(x=>x.error.code)});
 const forbidden=await app.evaluate(async({net})=>{const r=await net.fetch('app://meikyo/main.mjs');return r.status});expect(forbidden).toBe(404);add('G13-protocol-allowlist',{mainSourceStatus:forbidden});
 // Existing destination error, correction, preview, back and retained input.
 fs.mkdirSync(path.join(base,'existing'));
 await form('existing');await page.getByRole('button',{name:'内容を確認 →'}).click();await expect(page.getByRole('alert')).toContainText('既に存在');expect(await page.getByRole('alert').evaluate(e=>e===document.activeElement)).toBe(true);
 await page.getByLabel('新しいフォルダ名',{exact:true}).fill('まだ 作らない');await preview();expect(fs.existsSync(path.join(base,'まだ 作らない'))).toBe(false);
 await page.getByRole('button',{name:'← 戻る'}).click();await expect(page.getByLabel('新しいフォルダ名',{exact:true})).toHaveValue('まだ 作らない');expect(fs.readdirSync(base).some(n=>n.includes('.stage'))).toBe(false);
 const folder='GUI 日本語 ; $(touch injected)';await page.getByLabel('新しいフォルダ名',{exact:true}).fill(folder);await page.getByText('詳細設定',{exact:false}).first().click();await page.getByLabel('ホストポート',{exact:true}).fill('3651');await page.getByLabel('識別ラベル（任意）').fill('gui');
 await page.screenshot({path:path.join(output,'02-destination.png'),fullPage:true});await preview();await expect(page.locator('.notice')).toContainText('ファイルの作成はできます');await expect(page.getByRole('button',{name:'この内容で作成'})).toBeEnabled();await page.screenshot({path:path.join(output,'03-preview.png'),fullPage:true});
 add('G03-G07-G11-G12-back-correct-preview',{noWritesBeforeApply:true,inputRetained:true,errorFocused:true,DockerMissingDoesNotBlock:true});
 // Kill only this app's observed utility process; old plan must fail, retry must work.
 const killed=await app.evaluate(({app})=>{const own=app.getAppMetrics().find(x=>x.name==='Meikyo Generator');process.kill(own.pid,'SIGKILL');return own.pid});
 await expect.poll(()=>app.evaluate(({app},pid)=>app.getAppMetrics().some(x=>x.name==='Meikyo Generator'&&x.pid===pid),killed)).toBe(false);
 await page.getByRole('button',{name:'この内容で作成'}).click();await expect(page.getByRole('alert')).toContainText('確認');expect(fs.existsSync(path.join(base,folder))).toBe(false);
 await page.screenshot({path:path.join(output,'04-worker-retry.png'),fullPage:true});await page.getByRole('button',{name:'← 戻る'}).click();await preview();await page.getByRole('button',{name:'この内容で作成'}).click();await expect(page.getByRole('heading',{name:'プロジェクトのファイルを作成しました。'})).toBeVisible();
 await page.screenshot({path:path.join(output,'05-created.png'),fullPage:true});expect(fs.existsSync(codeArgs)).toBe(false);expect(fs.existsSync(path.join(base,'injected'))).toBe(false);
 await page.getByRole('button',{name:'手順を見る',exact:true}).click();await expect(page.locator('.document')).toContainText('3651');
 await page.getByRole('button',{name:'READMEを見る',exact:true}).click();await expect(page.locator('.document')).toContainText('Next');
 await page.getByRole('button',{name:'手順をコピー',exact:true}).click();await expect(page.getByRole('status')).toContainText('コピーしました');
 const copied=await app.evaluate(({clipboard})=>clipboard.readText());expect(copied).toBe(fs.readFileSync(path.join(base,folder,'START_HERE.md'),'utf8'));
 await page.getByRole('button',{name:'VS Codeで開く ↗'}).click();await expect(page.getByRole('status')).toContainText('VS Codeへ');expect(fs.readFileSync(codeArgs,'utf8').split('\0').filter(Boolean)).toEqual(['--',path.join(base,folder)]);
 add('G12-worker-failure-retry-and-created-actions',{workerTerminated:killed,guideAndReadme:true,clipboardMatches:true,editor:'Explicit button; test launcher receives separate -- and destination arguments. Actual VS Code UI NOT_RUN.'});
 // Byte-for-byte parity for actual UI create and standalone explicit CLI, same destination.
 const uiFiles=snapshot(path.join(base,folder));fs.rmSync(path.join(base,folder),{recursive:true});
 const repeat=spawnSync(process.execPath,[cli,'create','F2',path.join(base,folder),'--name','gui','--port','3651','--json'],{encoding:'utf8',cwd:'/tmp',env:{...process.env,NODE_PATH:'',NODE_OPTIONS:''}});expect(repeat.status).toBe(0);expect(snapshot(path.join(base,folder))).toEqual(uiFiles);add('G08-ui-cli-parity',{files:Object.keys(uiFiles).length});
 // Reload invalidates the worker-held preview, even for the original plan ID.
 await load();const old=await page.evaluate(async p=>window.meikyo.plan({templateId:'F2',parent:p,folder:'reload-not-created'}),base);expect(old.ok).toBe(true);await load();const stale=await page.evaluate(planId=>window.meikyo.apply({planId}),old.value.planId);expect(stale.error.code).toBe('PLAN_STALE');expect(fs.existsSync(path.join(base,'reload-not-created'))).toBe(false);add('G12-reload-invalidates',{code:stale.error.code});
 // Simultaneous IPC apply calls, not just a disabled button.
 const dp=await page.evaluate(async p=>window.meikyo.plan({templateId:'F1',parent:p,folder:'double-create'}),base);
 const doubles=await page.evaluate(planId=>Promise.all([window.meikyo.apply({planId}),window.meikyo.apply({planId})]),dp.value.planId);expect(doubles.filter(x=>x.ok)).toHaveLength(1);expect(doubles.find(x=>!x.ok).error.code).toBe('BUSY');add('G12-double-apply',{results:doubles.map(x=>x.ok?'created':x.error.code)});
 // All six templates through actual renderer -> main -> utility -> shared core.
 for(const id of ['F1','F2','B1','S1','S2','I1']){
   const folder=`${id} API経由`;const dest=path.join(base,folder);
   const response=await page.evaluate(async({id,parent,folder})=>{const plan=await window.meikyo.plan({templateId:id,parent,folder});if(!plan.ok)return plan;const result=await window.meikyo.apply({planId:plan.value.planId});return {plan,result}}, {id,parent:base,folder});
   expect(response.result.ok).toBe(true);
   if(id==='I1') {const secret=fs.readFileSync(path.join(dest,'.env'),'utf8').match(/POSTGRES_PASSWORD=(.*)/)[1];expect(JSON.stringify(response)).not.toContain(secret);expect(await page.locator('body').innerText()).not.toContain(secret);expect(fs.statSync(path.join(dest,'.env')).mode&0o777).toBe(0o600)}
   const gui=snapshot(dest,id==='I1');fs.rmSync(dest,{recursive:true});
   const explicit=spawnSync(process.execPath,[cli,'create',id,dest,'--json'],{encoding:'utf8',cwd:'/tmp'});expect(explicit.status).toBe(0);expect(snapshot(dest,id==='I1')).toEqual(gui);
   add('G01-G04-G08-'+id,{files:Object.keys(gui).length,version:response.result.value.templateVersion,parity:true});
 }
 expect(errors).toEqual([]);add('G14-relocated-binary',{archive:path.basename(archive),sha256:sha(fs.readFileSync(archive)),noHostNode:true,sourceDependency:false});
}catch(error){errors.push(error.stack);if(page)await page.screenshot({path:path.join(output,'failure.png'),fullPage:true}).catch(()=>{});throw error}
finally{await app.close();fs.writeFileSync(path.join(output,'result.json'),JSON.stringify({status:errors.length?'FAIL':'PASS',records,errors},null,2)+'\n');console.log(JSON.stringify({status:errors.length?'FAIL':'PASS',checks:records.length,errors},null,2))}
