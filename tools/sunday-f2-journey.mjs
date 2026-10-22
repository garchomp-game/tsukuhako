// Real-host, isolated UI observation. Requires the existing onboarding desktop harness.
// This is a phased local evidence runner for the observed Code version.
// After resume opens Code, inspect the ready window before running resume-finish.
// It deliberately does not send commands across an unobserved workbench reload.
import net from 'node:net';
import {fs,out,runtime,start,waitConnect,connect,scene,pause,env,command,json,btn,expect,terminal,edit,sha,chromium,x} from './onboarding-evidence.mjs';
// Select the exact visible command; keyboard focus may move while extensions activate.
async function palette(page,name) {
 await page.bringToFront();
 const win=command('wmctrl',['-lp'],{env:env()}).split('\n').find(l=>l.includes('[TSUKUHAKO evidence]'));
 if(!win)throw Error('Owned Code window missing');
 x(['windowactivate','--sync',win.split(' ')[0]]);
 x(['key','Escape']);x(['key','ctrl+shift+p']);
 const widget=page.locator('.quick-input-widget:visible');await expect(widget).toBeVisible();
 const input=widget.locator('input');await input.focus();await expect(input).toBeFocused();await input.fill('>'+name);
 await expect(input).toHaveValue('>'+name);await expect(input).toBeFocused();
 await expect.poll(()=>widget.locator('.monaco-list-row.focused .label-name').allTextContents()).toEqual([name]);
 x(['key','Return']);await expect(widget).toBeHidden();
}
async function remoteReady(c) {
 await expect.poll(()=>c.page.locator('.statusbar').innerText(),{timeout:180000,intervals:[1500]}).toContain('Dev Container: ツクハコ F2');
 // The remote label can appear before the workbench reload and server startup finish.
 await expect.poll(()=>c.page.locator('.notifications-toasts').allTextContents(),{timeout:180000,intervals:[1500]}).not.toContainEqual(expect.stringContaining('Connecting to Dev Container'));
 await pause(1200);await c.browser.close();
 const ready=await waitConnect(9431);
 await expect(ready.page.locator('.statusbar')).toContainText('Dev Container: ツクハコ F2');
 await expect(ready.page.locator('.tab.dirty')).toHaveCount(0);
 return ready;
}
const phase=process.argv[2];
const metadata=runtime+'/sunday-project.json';
if(phase==='generate') {
 const binary=runtime+'/受取 Linux/tsukuhako-linux-x64-0.4.4/tsukuhako';
 const pid=start(binary,['--remote-debugging-port=9430'],'sunday-app.log');
 json(runtime+'/app-process.json',{pid,binary});
 const a=await waitConnect(9430),p=a.page;
 try {
  await btn(p,'保存先を決める').waitFor();
  await expect(p.getByText('Docker：利用可能',{exact:true})).toBeVisible();
  await expect(p.getByLabel('Next.js：画面とページ移動の練習（初期候補）',{exact:true})).toBeChecked();
  await btn(p,'このOSの準備手順').click();
  await expect(p.locator('.markdown h1')).toHaveText('Linuxの準備');
  await btn(p,'準備チェックへ戻る').click();
  await btn(p,'もう一度確認').first().click();
  await expect(btn(p,'もう一度確認').first()).toBeEnabled();
  await btn(p,'保存先を決める').click();
  const server=net.createServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));const port=server.address().port;await new Promise(r=>server.close(r));
  const parent=runtime+'/projects',folder='F2 日曜 はじめの画面',destination=parent+'/'+folder;
  if(fs.existsSync(destination))throw Error('Use a fresh recipient folder');
  await p.getByLabel('親フォルダ',{exact:true}).fill(parent);
  await p.getByLabel('新しいフォルダ名',{exact:true}).fill(folder);
  await p.locator('.advanced summary').click();await p.getByLabel('ホストポート',{exact:true}).fill(String(port));
  await btn(p,'作成内容を確認').click();await btn(p,'プロジェクトを作成').waitFor();
  await expect(p.locator('.preview')).toContainText(destination);await expect(p.locator('.preview')).toContainText(String(port));
  await btn(p,'プロジェクトを作成').click();await btn(p,'この構成の「最初の一歩」を読む').waitFor();
  await expect(p.getByText('コンテナはまだ起動していません。',{exact:false})).toBeVisible();
  const guide=fs.readFileSync(destination+'/START_HERE.md','utf8');
  expect(guide).toContain(`cd -- '${destination}'`);expect(guide).toContain(`http://localhost:${port}/`);
  json(metadata,{destination,port,folder,appPid:pid,binary,sourceHash:sha(destination+'/app/page.tsx'),productVersion:'0.4.4'});
  fs.writeFileSync(runtime+'/host-diagnosis.txt',command('bash',['scripts/doctor-host.sh'],{cwd:destination,env:env()}));
  json(out+'/logs/generation.json',{category:'REAL_HOST',interaction:'AUTOMATED',result:'PASS',appVersion:'0.4.4',folder:'<isolated recipient>/projects/'+folder,nonDefaultPort:port,appUI:true,projectGuideMatchesDestinationAndPort:true,hostDiagnosis:'PASS',generatedEnvPresent:fs.existsSync(destination+'/.env'),externalRecipientDownload:'NOT_RUN'});
  await p.bringToFront();await scene('01-generated','FIRST-RUN 1〜4：準備チェックから新しいF2を生成','F2・保存先・非標準ポートを確認。コンテナ未起動と生成先START_HEREを区別');
  await p.getByRole('button',{name:'VS Codeで開く ↗',exact:true}).click();
 } finally { await a.browser.close(); }
} else if(phase==='connect') {
 const c=await waitConnect(9431),p=c.page;
 try {
  await pause(1200);
  const trust=p.getByRole('button',{name:/Yes, I trust the authors/});if(await trust.count())await trust.click();
  if(await p.getByText('Manage',{exact:true}).isVisible().catch(()=>false)) {
   await p.getByText('Manage',{exact:true}).click();
   await p.getByText('Trust',{exact:true}).click();
  }
  await palette(p,'Dev Containers: Reopen in Container');
  await expect.poll(async()=>p.locator('.statusbar').innerText(),{timeout:600000,intervals:[2000]}).toContain('Dev Container: ツクハコ F2');
  await expect.poll(async()=>{const row=p.locator('.monaco-list-row').filter({hasText:/^\s*Configuring\.\.\.\s*$/});if(await row.count())await row.last().click();return p.locator('body').innerText()},{timeout:300000,intervals:[1500]}).toContain('準備完了');
  console.log('Configuration message visible; inspect completion output before starting server.');
  fs.writeFileSync(runtime+'/configuration-visible.txt',await p.locator('body').innerText());
  await p.screenshot({path:runtime+'/configuration-observation.png'});
 } finally {await c.browser.close();}
} else if(phase==='start') {
 const project=JSON.parse(fs.readFileSync(metadata));const c=await connect(9431),p=c.page;
 try {
  // A normal postCreate task ends with this completion line, not merely the doctor message.
  await expect(p.locator('body')).toContainText('準備完了');
  await expect(p.locator('body')).toContainText('Done. Press any key to close the terminal.');
  await scene('02-initialized','FIRST-RUN 5〜6：Dev Container接続と構成処理の終了','構成ターミナルに準備完了とDoneの終了表示。サーバー開始前に確認');
  await palette(p,'Terminal: Create New Terminal');await pause(700);await terminal(p,'pwd');
  await expect(p.locator('body')).toContainText('/workspace');
  await terminal(p,'npm run dev');
  await expect.poll(async()=>{try{return(await fetch(`http://localhost:${project.port}/`)).status}catch{return 0}},{timeout:180000,intervals:[1500]}).toBe(200);
  await expect(p.locator('body')).toContainText('Ready');
  const id=command('docker',['ps','-q','--filter','label=devcontainer.local_folder='+project.destination]);
  if(!id||id.includes('\n'))throw Error('Expected one owned F2 container');
  json(runtime+'/container.json',{id});
  json(out+'/logs/initialization.json',{category:'REAL_HOST',interaction:'AUTOMATED',result:'PASS',postCreateCommand:JSON.parse(fs.readFileSync(project.destination+'/.devcontainer/devcontainer.json')).postCreateCommand,doctorMessageObserved:true,taskCompletionObserved:true,workspace:'/workspace',serverReady:true,httpStatus:200,container:id,sourceUnchanged:sha(project.destination+'/app/page.tsx')===project.sourceHash});
 }finally{await c.browser.close();}
} else if(phase==='exercise') {
 const project=JSON.parse(fs.readFileSync(metadata)),c=await connect(9431);
 const browser=await chromium.launch({channel:'chrome',headless:false,env:env(),args:['--window-size=1400,820']});const p=await browser.newPage({viewport:{width:1280,height:760}});
 try {
  await p.goto(`http://localhost:${project.port}/`);await expect(p.locator('h1')).toContainText('小さく変えて');
  await p.screenshot({path:out+'/screenshots/03-first-page.png'});
  const file=project.destination+'/app/page.tsx',before='小さく変えて、<br />動きを確かめよう。',after='わたしの練習室';
  await edit(c.page,'app/page.tsx',before,after);await expect(p.locator('h1')).toHaveText(after);await p.screenshot({path:out+'/screenshots/04-optional-change.png'});
  await edit(c.page,'app/page.tsx',after,before);await expect(p.locator('h1')).toContainText('小さく変えて');expect(sha(file)).toBe(project.sourceHash);
  json(out+'/logs/first-page-and-optional.json',{category:'REAL_HOST',interaction:'AUTOMATED',result:'PASS',firstPageHeading:'小さく変えて、動きを確かめよう。',optionalChangedHeading:after,restoredHash:sha(file),sourceHash:project.sourceHash,editor:'VS Code actual Find/Replace and Save',browser:'Chrome '+browser.version(),hostUrlUsesGeneratedPort:true,optionalExerciseSeparateFromFirstPage:true});
 }finally{await browser.close();await c.browser.close();}
} else if(phase==='resume'||phase==='resume-finish') {
 const project=JSON.parse(fs.readFileSync(metadata));let c=await connect(9431);
 const id=JSON.parse(fs.readFileSync(runtime+'/container.json')).id;
 const volumes=()=>JSON.parse(command('docker',['inspect','--format','{{json .Mounts}}',id])).filter(m=>m.Type==='volume').map(m=>({name:m.Name,destination:m.Destination}));
 const checkpoint=runtime+'/resume-checkpoint.json';
 if(phase==='resume') {
 const beforeVolumes=volumes();
 await c.page.locator('.terminal-wrapper.active .xterm-helper-textarea:visible:not([aria-label="Terminal input"])').focus();x(['key','ctrl+c']);
 await expect.poll(async()=>{try{return(await fetch(`http://localhost:${project.port}/`,{signal:AbortSignal.timeout(1000)})).status}catch{return 0}},{timeout:15000}).toBe(0);
 const win=command('wmctrl',['-lp'],{env:env()}).split('\n').find(l=>l.includes('[TSUKUHAKO evidence]'));
 if(!win)throw Error('Owned Code window missing');command('wmctrl',['-ic',win.split(' ')[0]],{env:env()});await c.browser.close();
 command('bash',['scripts/compose.sh','stop'],{cwd:project.destination,env:env()});
 await expect.poll(()=>command('docker',['inspect','--format','{{.State.Status}}',id]),{timeout:30000}).toBe('exited');
 expect(sha(project.destination+'/app/page.tsx')).toBe(project.sourceHash);
 await expect.poll(async()=>{try{return(await fetch('http://127.0.0.1:9431/json/version',{signal:AbortSignal.timeout(500)})).status}catch{return 0}},{timeout:30000}).toBe(0);
 json(checkpoint,{container:id,beforeVolumes,serverStoppedWithCtrlC:true,ownedContainerStopped:true});
 start('code',['--new-window',project.destination],'sunday-resume-code.log');c=await waitConnect(9431);
 await c.browser.close();
 console.log('Stopped and reopened the same folder. Inspect the ready Code window, then run resume-finish.');
 process.exit(0);
 }
 const stopped=JSON.parse(fs.readFileSync(checkpoint));expect(stopped.container).toBe(id);
 const beforeVolumes=stopped.beforeVolumes;
 try {
  await expect(c.page.locator('.statusbar')).toBeVisible({timeout:90000});
  if(!(await c.page.locator('.statusbar').innerText()).includes('Dev Container: ツクハコ F2'))await palette(c.page,'Dev Containers: Reopen in Container');
  c=await remoteReady(c);
  await expect(c.page.getByRole('button',{name:'Forwarded Ports: 3000',exact:true})).toBeVisible({timeout:90000});
  await palette(c.page,'Terminal: Create New Terminal');await pause(700);await terminal(c.page,'pwd');
  await expect(c.page.locator('body')).toContainText('/workspace');await terminal(c.page,'npm run dev');
  await expect.poll(async()=>{try{return(await fetch(`http://localhost:${project.port}/`)).status}catch{return 0}},{timeout:90000}).toBe(200);
  const browser=await chromium.launch({channel:'chrome',headless:true});try{const p=await browser.newPage();await p.goto(`http://localhost:${project.port}/`);await expect(p.locator('h1')).toContainText('小さく変えて');}finally{await browser.close();}
  expect(volumes()).toEqual(beforeVolumes);expect(sha(project.destination+'/app/page.tsx')).toBe(project.sourceHash);
  await expect(c.page.locator('.tab.dirty')).toHaveCount(0);
  json(out+'/logs/stop-resume.json',{category:'REAL_HOST',interaction:'AUTOMATED',result:'PASS',checkedAt:new Date().toISOString(),runnerSha256:sha(import.meta.filename),waitedForRemoteStartup:true,commandPaletteFocusChecked:true,unsavedEditors:0,serverStoppedWithCtrlC:stopped.serverStoppedWithCtrlC,ownedContainerStopped:stopped.ownedContainerStopped,container:id,sameContainer:command('docker',['ps','-q','--filter','label=devcontainer.local_folder='+project.destination])===id,volumesPreserved:true,sourceHash:sha(project.destination+'/app/page.tsx'),reopenedSameFolderWithoutRegeneration:true,httpStatus:200,originalHeadingVisible:true});
 }finally{await c.browser.close();}
} else throw Error('Choose generate, connect, start, exercise, resume or resume-finish');
