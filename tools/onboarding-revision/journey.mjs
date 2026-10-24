// Adapted from the previously verified F2 UI flow. Uses only an explicitly supplied extracted deb.
// Real-host, isolated UI observation. Requires the existing onboarding desktop harness.
// This is a phased local evidence runner for the observed Code version.
// After resume opens Code, inspect the ready window before running resume-finish.
// It deliberately does not send commands across an unobserved workbench reload.
import net from 'node:net';
import {fs,out,runtime,start,waitConnect,connect,scene,pause,env,command,json,btn,expect,terminal,edit,sha,chromium,x} from '../onboarding-evidence.mjs';
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
 // Fuzzy ranking can put "Rebuild and Reopen" above "Reopen" in a new profile.
 const literal=name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 const exact=widget.locator('.label-name').filter({hasText:new RegExp('^'+literal+'$')});
 await expect(exact).toBeVisible();
 await exact.click();await expect(widget).toBeHidden();
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
 const binary=process.env.TSUKUHAKO_TEST_BINARY;
 if(!binary||!fs.existsSync(binary))throw Error('Supply the extracted final deb executable');
 const pid=start(binary,['--remote-debugging-port=9430'],'sunday-app.log');
 json(runtime+'/app-process.json',{pid,binary});
 const a=await waitConnect(9430),p=a.page;
 try {
  await btn(p,'保存先を決める').waitFor();
  await expect(p.getByRole('button',{name:'はじめてのWeb画面で始める',exact:true})).toBeEnabled();
  await p.getByRole('button',{name:'はじめてのWeb画面で始める',exact:true}).click();
  await expect(p.locator('#preparation-title')).toBeFocused();
  await p.screenshot({path:out+'/screenshots/00-first-screen.png'});
  await expect(p.getByLabel('はじめてのWeb画面（おすすめ）',{exact:true})).toBeChecked();
  await btn(p,'このOSの準備手順').click();
  await expect(p.locator('.markdown h1')).toHaveText('Linuxの準備');
  await btn(p,'準備チェックへ戻る').click();
  await btn(p,'もう一度確認').first().click();
  await expect(btn(p,'もう一度確認').first()).toBeEnabled();
  await btn(p,'保存先を決める').click();
  const server=net.createServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));const port=server.address().port;await new Promise(r=>server.close(r));
  const parent=runtime+'/projects',folder='はじめてのWeb画面 日本語と空白のある長い保存先 そのまま再開する',destination=parent+'/'+folder;
  fs.mkdirSync(parent,{recursive:true});
  if(fs.existsSync(destination))throw Error('Use a fresh recipient folder');
  await p.getByLabel('親フォルダ',{exact:true}).fill(parent);
  await p.getByLabel('新しいフォルダ名',{exact:true}).fill(folder);
  await p.locator('.advanced summary').click();await p.getByLabel('ホストポート',{exact:true}).fill(String(port));
  await btn(p,'作成内容を確認').click();await btn(p,'プロジェクトを作成').waitFor();
  await expect(p.locator('.preview')).toContainText(destination);await expect(p.locator('.preview')).toContainText(String(port));
  await btn(p,'プロジェクトを作成').click();await btn(p,'サンプル画面を表示する手順へ').waitFor();
  await p.screenshot({path:out+'/screenshots/01-generation-complete.png'});
  const guide=fs.readFileSync(destination+'/START_HERE.md','utf8');
  expect(guide).toContain(`cd -- '${destination}'`);expect(guide).toContain(`http://localhost:${port}/`);
  json(metadata,{destination,port,folder,appPid:pid,binary,sourceHash:sha(destination+'/app/page.tsx'),productVersion:'0.4.6'});
  fs.writeFileSync(runtime+'/host-diagnosis.txt',command('bash',['scripts/doctor-host.sh'],{cwd:destination,env:env()}));
  json(out+'/logs/generation.json',{category:'EXTRACTED_DEB_ON_REAL_HOST',interaction:'AUTOMATED',result:'PASS',appVersion:'0.4.6',folder:'<isolated recipient>/projects/'+folder,nonDefaultPort:port,appUI:true,projectGuideMatchesDestinationAndPort:true,hostDiagnosis:'PASS',generatedEnvPresent:fs.existsSync(destination+'/.env'),externalRecipientDownload:'NOT_RUN'});
  await p.bringToFront();await scene('01-generated','FIRST-RUN 1〜4：準備チェックから新しいF2を生成','F2・保存先・非標準ポートを確認。コンテナ未起動と生成先START_HEREを区別');
  await btn(p,'サンプル画面を表示する手順へ').click();
  await expect(p.locator('.markdown')).toContainText(destination);
  await expect(p.locator('.markdown')).toContainText('http://localhost:'+port+'/');
  await p.getByRole('button',{name:'困ったとき',exact:true}).click();
  await expect(p.getByRole('button',{name:'今回の起動手順へ戻る',exact:true})).toBeVisible();
  await p.getByRole('button',{name:'今回の起動手順へ戻る',exact:true}).click();
  await expect(p.locator('.markdown')).toContainText(destination);
  await p.screenshot({path:out+'/screenshots/02-current-project-guide.png'});
  await p.getByRole('button',{name:'このフォルダーをVS Codeで開く',exact:true}).click();
 } finally { await a.browser.close(); }
} else if(phase==='connect') {
 const c=await waitConnect(9431),p=c.page;
 try {
  await pause(1200);
  // A fresh Code profile can show a two-page welcome dialog before folder trust.
  const welcome=p.getByRole('dialog',{name:'Welcome to Visual Studio Code',exact:true});
  if(await welcome.isVisible()) {
   const skip=welcome.getByText('Continue without Signing In',{exact:true});
   if(await skip.isVisible())await skip.click();
   await welcome.getByText('Get Started',{exact:true}).click();
   await expect(welcome).toBeHidden();
  }
  const trust=p.getByRole('button',{name:/Yes, I trust the authors/});if(await trust.count())await trust.click();
  if(await p.getByText('Manage',{exact:true}).isVisible().catch(()=>false)) {
   await p.getByText('Manage',{exact:true}).click();
   await p.getByText('Trust',{exact:true}).click();
  }
  // The current Code version can keep Workspace Trust in a modal editor.
  if(await p.locator('.workspace-trust-editor.trusted').isVisible().catch(()=>false)) {
   const close=p.getByRole('button',{name:'Close Modal Editor (Escape)',exact:true});
   if(await close.isVisible())await close.click();
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
  // Once acknowledged, the completed task terminal closes. Retain that observation
  // so a UI-only retry never repeats postCreate or pretends the terminal is still open.
  const checkpoint=runtime+'/initialization-observed.json';
  if(fs.existsSync(checkpoint)) {
   const saved=JSON.parse(fs.readFileSync(checkpoint));
   expect(saved.destination).toBe(project.destination);expect(saved.sourceHash).toBe(project.sourceHash);
   expect(saved.container).toBe(command('docker',['ps','-q','--filter','label=devcontainer.local_folder='+project.destination]));
   expect(saved.doctorMessageObserved&&saved.taskCompletionObserved).toBe(true);
  } else {
   await expect(p.locator('body')).toContainText('準備完了');
   await expect(p.locator('body')).toContainText('Done. Press any key to close the terminal.');
   await scene('02-initialized','FIRST-RUN 5〜6：Dev Container接続と構成処理の終了','構成ターミナルに準備完了とDoneの終了表示。サーバー開始前に確認');
   json(checkpoint,{destination:project.destination,sourceHash:project.sourceHash,container:command('docker',['ps','-q','--filter','label=devcontainer.local_folder='+project.destination]),doctorMessageObserved:true,taskCompletionObserved:true,observedAt:new Date().toISOString()});
  }
  await palette(p,'Terminal: Create New Terminal');await pause(700);await terminal(p,'pwd');
  await expect(p.locator('body')).toContainText('/workspace');
  await terminal(p,'npm run dev');
  await expect.poll(async()=>{try{return(await fetch(`http://localhost:${project.port}/`)).status}catch{return 0}},{timeout:180000,intervals:[1500]}).toBe(200);
  await expect(p.locator('body')).toContainText('Ready');
  const id=command('docker',['ps','-q','--filter','label=devcontainer.local_folder='+project.destination]);
  if(!id||id.includes('\n'))throw Error('Expected one owned F2 container');
  json(runtime+'/container.json',{id});
  json(out+'/logs/initialization.json',{category:'EXTRACTED_DEB_ON_REAL_HOST',interaction:'AUTOMATED',result:'PASS',postCreateCommand:JSON.parse(fs.readFileSync(project.destination+'/.devcontainer/devcontainer.json')).postCreateCommand,doctorMessageObserved:true,taskCompletionObserved:true,workspace:'/workspace',serverReady:true,httpStatus:200,container:id,sourceUnchanged:sha(project.destination+'/app/page.tsx')===project.sourceHash});
 }finally{await c.browser.close();}
} else if(phase==='display') {
 const project=JSON.parse(fs.readFileSync(metadata)),c=await connect(9431);
 const browser=await chromium.launch({channel:'chrome',headless:false,env:env(),args:['--window-size=1400,820']});const p=await browser.newPage({viewport:{width:1280,height:760}});
 try {
  await p.goto(`http://localhost:${project.port}/`);await expect(p.locator('h1')).toContainText('小さく変えて');await expect(p.locator('header')).not.toContainText('F2');
  await p.screenshot({path:out+'/screenshots/03-first-page.png'});
  json(out+'/logs/first-page.json',{category:'EXTRACTED_DEB_ON_REAL_HOST',interaction:'AUTOMATED',result:'PASS',firstPageHeading:await p.locator('h1').innerText(),sourceUnchanged:sha(project.destination+'/app/page.tsx')===project.sourceHash,browser:'Chrome '+browser.version(),hostUrlUsesGeneratedPort:true,optionalExerciseRequired:false});
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
 if(process.env.TSUKUHAKO_DEFER_RESUME==='1'){console.log('Saved stop checkpoint; reopen the same folder after secondary-project checks.');process.exit(0)}
 start('code',['--new-window',project.destination,project.destination+'/START_HERE.md'],'sunday-resume-code.log');c=await waitConnect(9431);
 await c.browser.close();
 console.log('Stopped and reopened the same folder. Inspect the ready Code window, then run resume-finish.');
 process.exit(0);
 }
 const stopped=JSON.parse(fs.readFileSync(checkpoint));expect(stopped.container).toBe(id);
 // App must be closed; reopen and read the saved Markdown independently of it.
 await expect.poll(()=>{try{process.kill(project.appPid,0);return true}catch{return false}}).toBe(false);
 await expect(c.page.locator('.statusbar')).toBeVisible({timeout:90000});
 await palette(c.page,'Markdown: Open Preview to the Side');
 await expect.poll(()=>c.page.locator('.tab').allTextContents(),{timeout:20000}).toContainEqual(expect.stringContaining('Preview START_HERE.md'));
 await c.page.screenshot({path:out+'/screenshots/06-saved-guide-resume.png'});
 json(out+'/logs/saved-guide-preview.json',{category:'EXTRACTED_DEB_ON_REAL_HOST',result:'PASS',appClosed:true,savedGuideSha256:sha(project.destination+'/START_HERE.md'),existingFolder:true,markdownPreviewOpened:true});
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
  json(out+'/logs/stop-resume.json',{category:'EXTRACTED_DEB_ON_REAL_HOST',interaction:'AUTOMATED',result:'PASS',checkedAt:new Date().toISOString(),runnerSha256:sha(import.meta.filename),waitedForRemoteStartup:true,commandPaletteFocusChecked:true,unsavedEditors:0,serverStoppedWithCtrlC:stopped.serverStoppedWithCtrlC,ownedContainerStopped:stopped.ownedContainerStopped,container:id,sameContainer:command('docker',['ps','-q','--filter','label=devcontainer.local_folder='+project.destination])===id,volumesPreserved:true,sourceHash:sha(project.destination+'/app/page.tsx'),reopenedSameFolderWithoutRegeneration:true,httpStatus:200,originalHeadingVisible:true});
 }finally{await c.browser.close();}
} else throw Error('Choose generate, connect, start, display, resume or resume-finish');
