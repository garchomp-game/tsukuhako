import {_electron as electron, expect} from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const root=path.resolve(import.meta.dirname,'..'), evidence=path.join(root,'validation/brand-0.3.0');
const output=path.join(evidence,'gui'), base=path.join(evidence,'runs/gui-relocated/別の 場所');
expect(fs.existsSync(base)).toBe(false);
fs.mkdirSync(base,{recursive:true});fs.mkdirSync(output,{recursive:true});
const archive=path.join(root,'dist/tsukuhako-linux-x64-0.3.0.tar.gz');
const extracted=spawnSync('tar',['-xzf',archive,'-C',base],{encoding:'utf8'});
expect(extracted.status,extracted.stderr).toBe(0);
const packaged=path.join(base,'tsukuhako-linux-x64-0.3.0');
const cli=path.join(evidence,'runs/cli-relocated/別の 場所/tsukuhako-generator-cli-0.3.0-linux/generator/cli.mjs');
const startup=path.join(evidence,'runs/startup');fs.mkdirSync(startup,{recursive:true});
const bin=path.join(base,'bin');fs.mkdirSync(bin);fs.symlinkSync('/usr/bin/cksum',path.join(bin,'cksum'));
const env={...process.env,PATH:bin,NODE_PATH:'',NODE_OPTIONS:'',XDG_CONFIG_HOME:path.join(base,'profile-config')};
delete env.ELECTRON_RUN_AS_NODE;
const records=[],errors=[];
const add=(id,detail)=>{records.push({id,status:'PASS',...detail});console.log('PASS',id)};
const sha=data=>createHash('sha256').update(data).digest('hex');
const app=await electron.launch({executablePath:path.join(packaged,'tsukuhako'),env,chromiumSandbox:true,timeout:30000});
let page;
async function size(width,height){await app.evaluate(({BrowserWindow},s)=>BrowserWindow.getAllWindows()[0].setSize(...s),[width,height])}
async function keyboardClick(locator){
  for(let i=0;i<60;i++){
    if(await locator.evaluate(el=>el===document.activeElement))break;
    await page.keyboard.press('Tab');
  }
  await expect(locator).toBeFocused();
  expect(await locator.evaluate(el=>getComputedStyle(el).outlineStyle)).not.toBe('none');
  await page.keyboard.press('Enter');
}
async function capture(stage){
  await size(1150,900);
  await page.screenshot({path:path.join(output,`${stage}.png`),fullPage:true});
  await size(860,680);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  const small=await page.locator('main p,main small,main button,main label,main summary,main dt,main dd,main code').evaluateAll(els=>els.filter(el=>el.getClientRects().length&&parseFloat(getComputedStyle(el).fontSize)<14).map(el=>el.textContent));
  expect(small).toEqual([]);
  await page.screenshot({path:path.join(output,`${stage}-minimum.png`),fullPage:true});
}
try{
  page=await app.firstWindow();page.on('pageerror',e=>errors.push(e.message));
  const next=()=>page.getByRole('button',{name:'保存先を決める',exact:true});
  await expect(next()).toBeEnabled();
  expect(page.url()).toBe('app://tsukuhako/index.html');
  await expect(page).toHaveTitle('ツクハコ | プロジェクトを作る');
  const metadata=await app.evaluate(({app,BrowserWindow})=>({
    name:app.getName(),version:app.getVersion(),userData:app.getPath('userData'),sessionData:app.getPath('sessionData'),
    appPath:app.getAppPath(),visible:BrowserWindow.getAllWindows()[0].isVisible(),
    preferences:BrowserWindow.getAllWindows()[0].webContents.getLastWebPreferences(),
    args:process.argv,electron:process.versions.electron,node:process.versions.node,
    worker:app.getAppMetrics().find(x=>x.name==='Tsukuhako Generator')?.name,
  }));
  expect(metadata.name).toBe('ツクハコ');expect(metadata.version).toBe('0.3.0');
  expect(metadata.userData).toBe(path.join(base,'profile-config/tsukuhako'));expect(metadata.sessionData).toBe(metadata.userData);
  expect(metadata.appPath).toBe(path.join(packaged,'resources/app'));expect(metadata.visible).toBe(true);
  expect(metadata.preferences.sandbox).toBe(true);expect(metadata.preferences.contextIsolation).toBe(true);
  expect(metadata.preferences.nodeIntegration).toBe(false);expect(metadata.args).not.toContain('--no-sandbox');
  expect(metadata.worker).toBe('Tsukuhako Generator');
  const exposed=await page.evaluate(()=>({require:typeof window.require,process:typeof window.process,methods:Object.keys(window.tsukuhako).sort()}));
  expect(exposed.require).toBe('undefined');expect(exposed.process).toBe('undefined');
  expect(exposed.methods).toEqual(['apply','chooseParentDirectory','diagnose','getTemplates','openInVSCode','plan']);
  const brand=await page.locator('.brand img').getAttribute('src');expect(brand).toContain('brand-mark.svg');
  add('T01-T03-T07-brand-profile-isolation',{metadata,exposed,brand,hostPathContains:['cksum']});
  const forbidden=await app.evaluate(async({net})=>(await net.fetch('app://tsukuhako/main.mjs')).status);
  expect(forbidden).toBe(404);
  const bad=await page.evaluate(parent=>Promise.all([
    window.tsukuhako.plan({templateId:'S3',parent,folder:'rejected'}),
    window.tsukuhako.plan({templateId:'F2',parent,folder:'rejected',bundleRoot:'/tmp'}),
    window.tsukuhako.apply({planId:'not-a-plan'}),
  ]),base);
  expect(bad.every(x=>!x.ok)).toBe(true);expect(fs.existsSync(path.join(base,'rejected'))).toBe(false);
  add('T03-real-ipc-and-protocol',{codes:bad.map(x=>x.error.code),mainSourceStatus:forbidden});
  for(const id of ['F1','F2','B1','S1','S2','I1']){
    const folder=id+' planのみ',dest=path.join(base,folder);
    const gui=await page.evaluate(request=>window.tsukuhako.plan(request),{templateId:id,parent:base,folder});
    const explicit=spawnSync(process.execPath,[cli,'plan',id,dest,'--json'],{cwd:'/tmp',encoding:'utf8'});
    expect(explicit.status,explicit.stderr).toBe(0);expect(gui.ok).toBe(true);
    const plan=JSON.parse(explicit.stdout);expect(plan.generatorVersion).toBe('0.3.0');expect(gui.value).toEqual(plan);
    expect(fs.existsSync(dest)).toBe(false);
    add('T03-plan-parity-'+id,{entirePlanEqual:true,noWrites:true,templateVersion:plan.templateVersion});
  }
  // A repeated purpose click must not reset an already selected Vite choice.
  await page.getByRole('radio',{name:'React + Vite',exact:true}).check();
  await page.getByRole('button',{name:/画面を作りたい/}).click();
  await expect(page.getByRole('radio',{name:'React + Vite',exact:true})).toBeChecked();
  await page.getByRole('radio',{name:'Next.js（初期候補）',exact:true}).check();
  await capture('01-purpose');
  await keyboardClick(next());
  const parent=page.getByLabel('親フォルダ',{exact:true}),folder=page.getByLabel('新しいフォルダ名',{exact:true});
  fs.mkdirSync(path.join(startup,'existing'));
  await parent.fill(startup);await folder.fill('existing');
  await page.locator('summary').filter({hasText:'詳細設定'}).click();
  await page.getByLabel('識別ラベル（任意）').fill('first');
  await page.getByLabel('ホストポート',{exact:true}).fill('3761');
  await keyboardClick(page.getByRole('button',{name:'作成内容を確認',exact:true}));
  await expect(page.getByRole('alert')).toContainText('この名前のフォルダは既にあります。');
  await expect(page.getByRole('alert')).toContainText('新しい名前か、別の親フォルダを選んでください。');
  await expect(page.getByRole('alert')).toBeFocused();
  await expect(folder).toHaveValue('existing');await expect(parent).toHaveValue(startup);
  await expect(page.getByLabel('ホストポート',{exact:true})).toHaveValue('3761');
  await page.screenshot({path:path.join(output,'duplicate-destination.png'),fullPage:true});
  await folder.fill('F2 学習');await capture('02-destination');
  await keyboardClick(page.getByRole('button',{name:'作成内容を確認',exact:true}));
  await expect(page.getByRole('heading',{name:'この内容でプロジェクトを作成します。'})).toBeVisible();
  expect(fs.existsSync(path.join(startup,'F2 学習'))).toBe(false);
  await keyboardClick(page.getByRole('button',{name:'← 戻る',exact:true}));
  await expect(folder).toHaveValue('F2 学習');await expect(page.getByLabel('識別ラベル（任意）')).toHaveValue('first');
  await keyboardClick(page.getByRole('button',{name:'作成内容を確認',exact:true}));
  await expect(page.locator('.preview')).toContainText(path.join(startup,'F2 学習'));
  await expect(page.locator('.notice')).toHaveText('ファイルは作成できます。起動する前に、Dockerなどの準備が必要です。');
  await capture('03-preview');
  add('T02-T11-keyboard-duplicate-back',{minimumWindow:[860,680],inputRetained:true,noWrites:true,focusOutline:true,textMinimumPx:14});
  await page.evaluate(()=>{
    window.__busyEvidence=[];
    new MutationObserver(()=>{
      if(document.querySelector('main')?.getAttribute('aria-busy')==='true')
        window.__busyEvidence.push({text:document.querySelector('[role=status]')?.textContent,disabled:[...document.querySelectorAll('footer.actions button')].every(x=>x.disabled)});
    }).observe(document.body,{subtree:true,childList:true,attributes:true,characterData:true});
  });
  await keyboardClick(page.getByRole('button',{name:'プロジェクトを作成',exact:true}));
  await expect(page.getByRole('heading',{name:'プロジェクトのファイルができました。'})).toBeVisible();
  const busy=await page.evaluate(()=>window.__busyEvidence);
  expect(busy.some(x=>x.text==='ファイルを作成しています'&&x.disabled)).toBe(true);
  await expect(page.locator('.created-actions .primary')).toHaveText('起動手順を見る');
  await capture('04-created');
  const destination=path.join(startup,'F2 学習'),guide=fs.readFileSync(path.join(destination,'START_HERE.md'),'utf8');
  await keyboardClick(page.getByRole('button',{name:'起動手順を見る',exact:true}));
  await expect(page.locator('.document pre')).toHaveText(guide);
  expect(guide).toContain('わたしの練習室');expect(guide).toContain('元へ戻');
  await page.getByRole('button',{name:'READMEを見る',exact:true}).click();
  await expect(page.locator('.document pre')).toContainText('Next.js');
  fs.writeFileSync(path.join(evidence,'gui-generated-f2.json'),JSON.stringify({
    status:'PASS',source:'Final packaged GUI; real UI generation. This folder is retained for T10 startup.',
    destination,port:3761,templateVersion:'0.1.1',guideSha256:sha(guide),archive:path.basename(archive),archiveSha256:sha(fs.readFileSync(archive)),
  },null,2)+'\n');
  add('T03-T10-T11-ui-created-guide',{destination,guideExact:true,busyEvidence:busy,hostNodeDockerCodeAbsent:true});
  // Reuse the effective double-apply regression at the real renamed IPC boundary.
  const dp=await page.evaluate(parent=>window.tsukuhako.plan({templateId:'F1',parent,folder:'double-create'}),base);
  const doubles=await page.evaluate(planId=>Promise.all([window.tsukuhako.apply({planId}),window.tsukuhako.apply({planId})]),dp.value.planId);
  expect(doubles.filter(x=>x.ok)).toHaveLength(1);expect(doubles.find(x=>!x.ok).error.code).toBe('BUSY');
  add('T11-double-apply',{results:doubles.map(x=>x.ok?'created':x.error.code)});
  expect(errors).toEqual([]);
}catch(error){
  errors.push(error.stack);if(page)await page.screenshot({path:path.join(output,'failure.png'),fullPage:true}).catch(()=>{});throw error;
}finally{
  await app.close();
  const report={status:errors.length?'FAIL':'PASS',archive:path.basename(archive),sha256:sha(fs.readFileSync(archive)),records,errors};
  fs.writeFileSync(path.join(output,'result.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({status:report.status,checks:records.length,errors}));
}
