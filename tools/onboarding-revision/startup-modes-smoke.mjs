// Extracted-deb smoke check: real IPC, generation, clipboard and isolated VS Code.
// No installation, sandbox bypass, container startup or external publication.
// TSUKUHAKO_TEST_ROOT points to the build repository when run from another worktree.
import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import {spawn, spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {closeOwnedProcess} from '../owned-process-exit.mjs';

const root=path.resolve(process.env.TSUKUHAKO_TEST_ROOT||path.resolve(import.meta.dirname,'../..'));
const out=path.resolve(process.env.ONBOARDING_OUT||root+'/validation/onboarding-0.4.8/final');
const desktopFile=process.env.TSUKUHAKO_DESKTOP_ENV||root+'/validation/ux-loop-03-startup/runs/desktop-env.json';
const deb=path.resolve(process.env.TSUKUHAKO_TEST_DEB||root+'/dist/linux-deb/tsukuhako-linux-amd64-0.4.8.deb');
// Resume only the process-restart check after successful generation observations.
// Previous attempt evidence is retained, with its harness limitation disclosed.
const resume=process.env.TSUKUHAKO_SMOKE_RESUME_RUN;
const {chromium,expect}=await import(pathToFileURL(root+'/tools/node_modules/@playwright/test/index.mjs').href);
const desktop=JSON.parse(fs.readFileSync(desktopFile,'utf8'));
if(desktop.DISPLAY!==':91')throw Error('Use the dedicated :91 evidence desktop');
if(!fs.existsSync(deb))throw Error('Final deb must exist before starting the check');
fs.mkdirSync(out+'/runs',{recursive:true});
if(resume&&!path.resolve(resume).startsWith(out+'/runs/startup-modes-'))throw Error('Resume must refer to this output directory');
const run=resume?path.resolve(resume):fs.mkdtempSync(out+'/runs/startup-modes-');
const previous=resume?JSON.parse(fs.readFileSync(run+'/result.json','utf8')):null;
fs.mkdirSync(out+'/logs',{recursive:true});fs.mkdirSync(out+'/screenshots',{recursive:true});
const env={...process.env,...desktop,TSU_CAPTURE_RUNTIME:run};delete env.ELECTRON_RUN_AS_NODE;
const profile=run+'/app-profile',projects=run+'/日本語 親フォルダー';
fs.mkdirSync(projects,{recursive:true});fs.mkdirSync(run+'/code-profile/User',{recursive:true});fs.mkdirSync(run+'/code-extensions',{recursive:true});
fs.writeFileSync(run+'/code-profile/User/settings.json',JSON.stringify({
 'workbench.startupEditor':'none','extensions.autoUpdate':false,'extensions.autoCheckUpdates':false,'update.mode':'none',
 'window.title':'[TSUKUHAKO evidence] ${activeEditorShort}${separator}${rootName}${separator}${appName}'
}));
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const sha=file=>createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const json=(file,value)=>fs.writeFileSync(file,JSON.stringify(value,null,2)+'\n');
function command(exe,args=[],options={}){
 const r=spawnSync(exe,args,{env,encoding:'utf8',timeout:15000,...options});
 if(r.status!==0)throw Error(`${exe}: ${r.status}: ${r.stderr||r.stdout}`);return r.stdout.trim();
}
async function free(port){const s=net.createServer();await new Promise((resolve,reject)=>s.once('error',reject).listen(port,'127.0.0.1',resolve));await new Promise(resolve=>s.close(resolve))}
await free(9436);await free(9431);
if(!resume)command('dpkg-deb',['-x',deb,run+'/extracted'],{timeout:60000});
const binary=run+'/extracted/opt/tsukuhako/tsukuhako';
const info=JSON.parse(fs.readFileSync(path.dirname(binary)+'/resources/app/build-info.json','utf8'));
expect(info.productVersion).toBe('0.4.8');
if(previous){
 expect(previous.debSha256).toBe(sha(deb));expect(previous.sourceCommit).toBe(info.sourceCommit);
 expect(previous.records).toHaveLength(4);expect(previous.records.every(record=>record.result==='PASS')).toBe(true);
 fs.copyFileSync(run+'/result.json',run+'/before-restart-result.json');
}
const records=[...(previous?.records||[])],errors=[...(previous?.rendererErrors||[])],closures=[...(previous?.closures||[])],codePids=new Set();let app,connection,page,codeConnection,failure;
const b=name=>page.getByRole('button',{name,exact:true});
const nav=name=>page.getByRole('navigation',{name:'ツクハコの画面'}).getByRole('button',{name,exact:true});
const mode=name=>page.getByRole('radio',{name,exact:true});
const guided='手順を見ながら進める',quick='必要な操作だけ進める';
const record=(scenario,details={})=>{records.push({scenario,result:'PASS',...details});console.log('PASS',scenario)};
const windows=()=>command('wmctrl',['-lp']).split('\n').filter(Boolean).map(row=>{const fields=row.trim().split(/\s+/);return{id:fields[0],pid:Number(fields[2]),row}});
async function connect(port){
 for(let i=0;i<50;i++){
  try{const browser=await chromium.connectOverCDP(`http://127.0.0.1:${port}`);const context=browser.contexts()[0],p=context.pages()[0];p.setDefaultTimeout(15000);return{browser,context,page:p}}catch{await pause(400)}
 }throw Error('No CDP on '+port);
}
async function launch(){
 const fd=fs.openSync(run+'/app.log','a');
 app=spawn(binary,['--user-data-dir='+profile,'--remote-debugging-port=9436','--remote-debugging-address=127.0.0.1'],{env,stdio:['ignore',fd,fd]});fs.closeSync(fd);
 connection=await connect(9436);page=connection.page;page.on('pageerror',error=>errors.push(error.message));
 await expect(page.locator('.version')).toContainText(info.productVersion);
 await connection.context.setOffline(true); // Bundled product text and local IPC must remain available.
}
async function closeApp(){
 if(!app)return;
 const owned=app;
 const result=await closeOwnedProcess(owned,()=>{const win=windows().find(win=>win.pid===owned.pid);if(!win)throw Error('Owned app window missing');command('wmctrl',['-ic',win.id])});
 closures.push({...result,kind:'tsukuhako'});await connection?.browser.close().catch(()=>{});app=null;connection=null;
 expect(result.status).toBe('PASS');
}
async function screenshot(name){
 await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
 const file=out+'/screenshots/'+name+'.png';await page.screenshot({path:file});return path.relative(out,file);
}
async function clipboard(){return spawnSync('xclip',['-selection','clipboard','-o'],{env,encoding:'utf8',timeout:2000}).stdout}
async function create(folder,port){
 await expect(b('保存先を決める').or(page.getByLabel('親フォルダ',{exact:true}))).toBeVisible();
 if(await b('保存先を決める').isVisible())await b('保存先を決める').click();
 await expect(page.locator('#generator-title')).toHaveText('プロジェクトの置き場所を決めます。');
 await page.getByLabel('親フォルダ',{exact:true}).fill(projects);await page.getByLabel('新しいフォルダ名',{exact:true}).fill(folder);
 if(port!==undefined){if(!await page.getByLabel('ホストポート',{exact:true}).isVisible())await page.locator('.advanced summary').click();await page.getByLabel('ホストポート',{exact:true}).fill(String(port))}
 await b('作成内容を確認').click();await expect(page.locator('.preview .port b')).toHaveText(String(port??3000));
 await b('プロジェクトを作成').click();await expect(page.locator('.created-actions button')).toHaveCount(1);await page.locator('.created-actions button').click();
 const destination=path.join(projects,folder),url=`http://localhost:${port??3000}/`,guide=fs.readFileSync(destination+'/START_HERE.md','utf8');
 await expect(page.locator('.project-context')).toContainText(destination);await expect(page.locator('.project-context')).toContainText(url);
 expect(guide).toContain(destination);expect(guide).toContain(url);expect(guide).toContain('終了する');expect(guide).toContain('同じフォルダーから再開する');
 expect(fs.existsSync(destination+'/.env')).toBe(true);
 expect(fs.readFileSync(destination+'/.env','utf8')).toMatch(new RegExp(`^HOST_PORT=${port??3000}$`,'m'));
 const compose=fs.readFileSync(destination+'/compose.yaml','utf8');expect(compose).toContain('3000');
 return{destination,folder,port:port??3000,url,guide};
}
async function editor(project,number){
 await b('このフォルダーをVS Codeで開く').click();await expect(page.locator('.project-editor-action .error')).toHaveCount(0);
 codeConnection||=await connect(9431);const cp=codeConnection.page;
 await expect.poll(async()=>cp.title(),{timeout:20000}).toContain(project.folder);
 const storage=run+'/code-profile/User/workspaceStorage';let match;
 await expect.poll(()=>{
  if(!fs.existsSync(storage))return false;
  for(const item of fs.readdirSync(storage)){
   const f=path.join(storage,item,'workspace.json');if(!fs.existsSync(f))continue;
   const value=JSON.parse(fs.readFileSync(f,'utf8'));
   if(value.folder&&decodeURIComponent(new URL(value.folder).pathname)===project.destination){match={file:path.relative(run,f),folder:value.folder};return true}
  }return false;
 }).toBe(true);
 const owned=windows().filter(w=>w.row.includes('[TSUKUHAKO evidence]'));
 expect(owned.length).toBeGreaterThan(0);for(const w of owned)codePids.add(w.pid);
 await cp.bringToFront();
 // VS Code CDP screenshots can stall during initial compositor setup. Capture
 // the dedicated X11 screen while retaining title and exact workspace evidence.
 command('ffmpeg',['-hide_banner','-loglevel','error','-f','x11grab','-video_size','1600x900','-i',env.DISPLAY,'-frames:v','1','-y',out+'/screenshots/'+number+'-vscode-current-folder.png']);
 record('Actual VS Code received '+project.folder,{destination:project.destination,title:await cp.title(),workspace:match,wrapperInvocations:fs.readFileSync(run+'/code-invocations.log','utf8').trim().split('\n')});
 await page.bringToFront();
}
async function closeCode(){
 await codeConnection?.browser.close().catch(()=>{});codeConnection=null;
 for(const w of windows().filter(w=>codePids.has(w.pid)))command('wmctrl',['-ic',w.id]);
 const alive=pid=>{try{return !/\) Z /.test(fs.readFileSync(`/proc/${pid}/stat`,'utf8'))}catch{return false}};
 for(const pid of codePids){
  for(let i=0;i<10&&alive(pid);i++)await pause(500);
  let cleanupSignal=null;
  if(alive(pid)){
   // A dedicated Code instance may await extension shutdown. Terminate only
   // the recorded process whose arguments still identify this run's profile.
   const args=fs.readFileSync(`/proc/${pid}/cmdline`,'utf8');expect(args).toContain(run+'/code-profile');
   process.kill(pid,'SIGTERM');cleanupSignal='SIGTERM';
  }
  await expect.poll(()=>alive(pid),{timeout:15000}).toBe(false);
  closures.push({kind:'dedicated-code-process',pid,status:'PASS',exited:true,cleanupSignal});
 }
 codePids.clear();await expect.poll(async()=>{try{await free(9431);return true}catch{return false}},{timeout:15000}).toBe(true);
}
try{
 if(!resume){
 await launch();await expect(mode(guided)).toBeChecked();await mode(guided).focus();await page.keyboard.press('ArrowRight');await expect(mode(quick)).toBeChecked();
 await b('はじめてのWeb画面で始める').click();
 await expect(page.locator('#generator-title')).toHaveText('プロジェクトの置き場所を決めます。');
 const first=await create('標準ポート 初回の画面');
 await expect(mode(quick)).toBeChecked();await expect(page.locator('.port-explanation')).toHaveCount(0);await expect(b('このフォルダーをVS Codeで開く')).toHaveCount(1);
 const geometry=await page.evaluate(()=>{const c=document.querySelector('.project-context'),a=document.querySelector('.project-editor-action'),h=document.querySelector('.markdown h1'),r=a.querySelector('button.primary').getBoundingClientRect();return{adjacent:c.nextElementSibling===a,beforeTitle:Boolean(a.compareDocumentPosition(h)&Node.DOCUMENT_POSITION_FOLLOWING),viewport:{width:innerWidth,height:innerHeight},button:{top:r.top,bottom:r.bottom},fullyVisible:r.top>=0&&r.bottom<=innerHeight}});
 expect(geometry.adjacent).toBe(true);expect(geometry.beforeTitle).toBe(true);expect(geometry.fullyVisible).toBe(true);
 record('F2 real generation defaults to 3000 with an immediate visible editor action',{destination:first.destination,port:first.port,geometry,screenshot:await screenshot('01-default-quick-editor-action')});
 await editor(first,'02');
 await mode(guided).check();await expect(page.locator('.reader-layout')).not.toHaveClass(/reader-quick/);await expect(page.locator('.project-context')).toContainText(first.destination);
 await mode(quick).check();await expect(page.locator('.reader-layout')).toHaveClass(/reader-quick/);
 await page.locator('.project-context details').filter({has:page.getByRole('button',{name:'手順全体をコピー',exact:true,includeHidden:true})}).locator('summary').click();await b('手順全体をコピー').click();await expect.poll(clipboard).toBe(first.guide);
 await b('URLをコピー').click();await expect.poll(clipboard).toBe(first.url);
 await nav('困ったとき').click();await b('読んでいた手順へ戻る').click();await expect(mode(quick)).toBeChecked();await expect(page.locator('.project-context')).toContainText(first.destination);
 await page.locator('.markdown').getByRole('button',{name:'終了する',exact:true}).click();await expect(page.locator('#終了する')).toBeFocused();await expect(b('簡潔な手順に戻る')).toBeVisible();await b('簡潔な手順に戻る').click();await expect(page.locator('.reader-layout')).toHaveClass(/reader-quick/);
 record('Guided/quick, offline help return and complete native clipboard copy preserve the real project',{guideSha256:sha(first.destination+'/START_HERE.md'),exactGuideCopy:true,exactUrlCopy:true,screenshot:await screenshot('03-quick-after-help')});
 await nav('作る').click();await b('別のプロジェクトを作る').click();
 const second=await create('変更ポート 次の画面',3311);
 await expect(page.locator('.port-explanation')).toContainText('3000');await expect(page.locator('.project-context')).not.toContainText(first.destination);
 await expect(page.locator('.markdown')).toContainText(second.url);
 record('Explicit 3311 preserves the new project and explains container port 3000',{destination:second.destination,port:second.port,screenshot:await screenshot('04-custom-port-quick')});
 // Actual Code launch is covered once above. Target replacement is separately
 // covered by the renderer/IPC fixture; do not conflate that with host evidence.
 await closeCode();
 await nav('作る').click();await expect.poll(()=>{try{return JSON.parse(fs.readFileSync(profile+'/reading.json','utf8')).guideMode}catch{return null}}).toBe('quick');
 await closeApp();
 }
 await launch();await nav('作る').click();await expect(mode(quick)).toBeChecked();await expect(page.locator('.project-context')).toHaveCount(0);
 await nav('学ぶ').click();await page.getByLabel('教材・ガイドを選ぶ').selectOption('F2');await page.getByRole('navigation',{name:'章の一覧'}).getByRole('button',{name:'サンプル画面を表示する',exact:true}).click();
 await expect(page.locator('.markdown')).toContainText('見本');await expect(b('このフォルダーをVS Codeで開く')).toHaveCount(0);
 record('Actual process restart persists quick preference and clears generated open target',{screenshot:await screenshot('06-restarted-reference-guide')});
 expect(errors).toEqual([]);await closeApp();
}catch(error){failure=error;await page?.screenshot({path:run+'/failure.png',timeout:3000}).catch(()=>{});console.error(error)}
finally{
 if(codePids.size){try{await closeCode()}catch(error){failure||=error}}
 if(app){try{await closeApp()}catch(error){failure||=error}}
 const result={category:'EXTRACTED_DEB_ON_REAL_HOST',interaction:'AUTOMATED',result:failure?'FAIL':'PASS',...info,checkedAt:new Date().toISOString(),deb,debSha256:sha(deb),runtime:run,records,rendererErrors:errors,closures,sandbox:'ENABLED; no bypass flags',hostInstallation:'NOT_RUN',dockerAndSampleRuntime:'NOT_RUN',windows:'NOT_RUN',humanAcceptance:'利用者確認待ち',secondActualCodeTarget:'NOT_VERIFIED; fixture covers target replacement',...(previous?{resumedFrom:run+'/before-restart-result.json',previousHarnessLimitation:previous.error}:{}),...(failure?{error:String(failure)}:{})};
 json(run+'/result.json',result);json(out+'/logs/startup-modes-smoke.json',result);console.log('Evidence:',out);if(failure)process.exitCode=1;
}
