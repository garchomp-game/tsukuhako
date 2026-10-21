// Observe the delivered archive on a dedicated real-host desktop. No product IPC mocks.
import {fs,root,out,runtime,env,command,scene,pause,waitConnect,connect,btn,expect,json,sha,palette,terminal,spawn,edit} from './onboarding-evidence.mjs';
import net from 'node:net';
const phase=process.argv[2];
const archive=process.env.TSUKUHAKO_ARTIFACT||root+'/dist/tsukuhako-linux-x64-0.4.4.tar.gz';
const unpack=runtime+'/受取物 日本語';
const bin=unpack+'/tsukuhako-linux-x64-0.4.4/tsukuhako';
const e={...env(),PATH:runtime+'/bin:/usr/bin:/bin'};delete e.ELECTRON_RUN_AS_NODE;
function launch(exe,args,log){const fd=fs.openSync(runtime+'/'+log,'a');const p=spawn(exe,args,{env:e,cwd:'/tmp',stdio:['ignore',fd,fd],detached:true});p.unref();return p.pid;}
async function chooseCommand(page,name){
 await page.bringToFront();await page.keyboard.press('Escape');await page.keyboard.press('F1');await page.locator('.quick-input-widget input').fill('>'+name);await pause(400);
 for(let n=0;n<20;n++){const selected=page.locator('.quick-input-widget .monaco-list-row.focused .label-name');if(await selected.count()&&(await selected.innerText())===name){await page.keyboard.press('Enter');return;}await page.keyboard.press('ArrowDown');await pause(80);}throw Error('Exact command not selected: '+name);
}
if(phase==='normal'){
 fs.mkdirSync(unpack,{recursive:true});command('tar',['-xzf',archive,'-C',unpack]);
 const pid=launch(bin,[],'normal-app.log');let win;
 for(let n=0;n<80;n++){win=command('wmctrl',['-lp'],{env:e}).split('\n').find(l=>l.includes('ツクハコ'));if(win)break;await pause(250);}
 if(!win)throw Error('Normal app window did not appear');await pause(3000);
 const noNode=command('sh',['-c','command -v node || true'],{env:e});expect(noNode).toBe('');
 const entry={category:'REAL_HOST',status:'PASS',artifact:sha(archive),productCommit:JSON.parse(fs.readFileSync(unpack+'/tsukuhako-linux-x64-0.4.4/resources/app/build-info.json')).sourceCommit,executable:bin,cwd:'/tmp',PATH:e.PATH,hostNodeAvailable:false,uid:command('id',['-u']),pid,args:command('ps',['-p',String(pid),'-o','args=']),window:win,debugPort:false};
 json(out+'/logs/normal-launch.json',entry);await scene('L01-normal','展開した実行ファイルを通常起動','一般ユーザー・引数なし・/tmpから起動。Nodeを含まないPATHで画面表示');
 command('wmctrl',['-ic',win.split(' ')[0]],{env:e});for(let n=0;n<60&&fs.existsSync('/proc/'+pid);n++)await pause(250);expect(fs.existsSync('/proc/'+pid)).toBe(false);
}
if(phase==='generate'){
 let a;try{a=await connect(9430);}catch{launch(bin,['--remote-debugging-port=9430'],'observed-app.log');a=await waitConnect(9430);}const p=a.page;
 try{
 await btn(p,'作る').click();await btn(p,'保存先を決める').waitFor();await expect(p.locator('.version')).toHaveText('LOCAL EDITION 0.4.4');
 await btn(p,'学ぶ').click();await p.getByRole('navigation',{name:'章の一覧'}).getByRole('button',{name:'最初の一歩',exact:true}).click();await expect(p.locator('.markdown')).toContainText('初期構成処理が正常終了');await p.getByRole('heading',{name:/初期構成の正常終了を待つ/}).scrollIntoViewIfNeeded();await scene('L02-lesson','同梱のF2教材を読む','0.4.4の教材に初期構成の正常終了を待つ手順が表示される');
 await btn(p,'作る画面へ戻る').click();await btn(p,'保存先を決める').click();
 const server=net.createServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));const port=server.address().port;await new Promise(r=>server.close(r));
 const parent=runtime+'/projects';fs.mkdirSync(parent,{recursive:true});const folder='F2 日本語 空白 044';const destination=parent+'/'+folder;
 await p.getByLabel('親フォルダ',{exact:true}).fill(parent);await p.getByLabel('新しいフォルダ名',{exact:true}).fill(folder);await p.locator('.advanced summary').click();await p.getByLabel('ホストポート',{exact:true}).fill(String(port));await btn(p,'作成内容を確認').click();await btn(p,'プロジェクトを作成').click();await btn(p,'この構成の「最初の一歩」を読む').waitFor();
 await p.getByText('初期構成の正常終了を待つ',{exact:true}).scrollIntoViewIfNeeded();await scene('L03-completion','新規F2を生成し完了画面を読む','完了画面にも「準備完了」と正常終了を待つ手順がある');
 const guide=fs.readFileSync(destination+'/START_HERE.md','utf8');fs.writeFileSync(out+'/logs/F2-START_HERE.md',guide);
 const beforeVolumes=command('docker',['volume','ls','--format','{{.Name}}']).split('\n');
 json(out+'/F2-project.json',{bin,destination,port,folder,artifact:sha(archive),productCommit:JSON.parse(fs.readFileSync(unpack+'/tsukuhako-linux-x64-0.4.4/resources/app/build-info.json')).sourceCommit,sourceHash:sha(destination+'/app/page.tsx'),guideSha256:sha(destination+'/START_HERE.md'),beforeVolumes});
 await btn(p,'この構成の「最初の一歩」を読む').click();await expect(p.locator('.markdown')).toContainText(destination);await expect(p.locator('.markdown')).toContainText('初期構成処理が正常終了');await btn(p,'作る画面へ戻る').click();
 await btn(p,'VS Codeで開く ↗').click();await scene('L04-open-code','生成結果からVS Codeへ渡す','通常のVS Codeへ新規プロジェクトを渡した');
 }finally{await a.browser.close();}
}
if(phase==='connect'){
 const project=JSON.parse(fs.readFileSync(out+'/F2-project.json'));const a=await connect(9431),p=a.page;
 try{
 const signin=p.getByRole('button',{name:'Continue without Signing In',exact:true});if(await signin.count())await signin.click();
 await chooseCommand(p,'Dev Containers: Reopen in Container');await pause(600);const trust=p.getByRole('button',{name:'Trust Folder & Continue',exact:true});if(await trust.count())await trust.click();await scene('L05-reopen','Reopen in Containerで初回構成','新規プロジェクトから新しい依存ボリュームを作る');
 await expect.poll(()=>p.locator('.statusbar').innerText(),{timeout:600000,intervals:[2000]}).toContain('Dev Container: ツクハコ F2');
 await expect.poll(async()=>{const row=p.locator('.monaco-list-row').filter({hasText:/^\s*Configuring\.\.\.\s*$/});if(await row.count())await row.last().click();return p.locator('.terminal-wrapper.active').innerText()},{timeout:300000,intervals:[2000]}).toContain('準備完了');
 // VS Code's Dev Containers log records the actual postCreate exit. Do not infer success from the badge/tab.
 await expect(p.locator('.terminal-wrapper.active')).toContainText('Done. Press any key to close the terminal.');
 let successLog='';
 await expect.poll(()=>{const logs=command('rg',['-l','scripts/doctor.mjs',runtime+'/code-profile/logs']).split('\n');for(const f of logs){const t=fs.readFileSync(f,'utf8');if(t.includes('準備完了')&&/Stop .*Run in container:.*npm ci --no-audit --no-fund && node scripts\/doctor\.mjs/.test(t)&&!t.includes('postCreateCommand from devcontainer.json failed')){successLog=f;return true;}}return false;},{timeout:120000,intervals:[1500]}).toBe(true);
 const text=fs.readFileSync(successLog,'utf8');fs.writeFileSync(out+'/logs/F2-postcreate.log',text);await scene('L06-ready','構成ターミナル本文と正常終了を確認','準備完了の本文を確認。Dev ContainersログでもpostCreateの終了を確認してから次へ');
 const id=command('docker',['ps','-q','--filter','label=devcontainer.local_folder='+project.destination]);const details=JSON.parse(command('docker',['inspect',id]))[0];const volumes=details.Mounts.filter(m=>m.Type==='volume'&&m.Destination!=='/vscode').map(m=>({name:m.Name,destination:m.Destination}));expect(volumes.length).toBeGreaterThan(0);expect(volumes.every(v=>!project.beforeVolumes.includes(v.name))).toBe(true);
 await chooseCommand(p,'Terminal: Create New Terminal');await pause(1000);await terminal(p,'npm run dev');await expect.poll(async()=>{try{return(await fetch('http://127.0.0.1:'+project.port)).status}catch{return 0;}},{timeout:180000,intervals:[1500]}).toBe(200);await scene('L07-server','構成の正常終了後にnpm run dev','新しいターミナルでReady表示とHTTP 200を確認');
 json(out+'/logs/F2-startup.json',{status:'PASS',category:'REAL_HOST',artifact:project.artifact,container:id,volumes,freshVolumes:true,postCreateLog:'F2-postcreate.log',sourceHash:sha(project.destination+'/app/page.tsx'),port:project.port,hostImageCache:'existing',extension:'0.469.0',postCreateFinishedBeforeNpmRunDev:true});
 }finally{await a.browser.close();}
}
if(phase==='resume'){
 const project=JSON.parse(fs.readFileSync(out+'/F2-project.json'));const win=command('wmctrl',['-lp'],{env:e}).split('\n').find(l=>l.includes('ツクハコ | 作る'));if(!win)throw Error('App window not found for restart');const pid=win.trim().split(/\s+/)[2];command('wmctrl',['-ic',win.split(' ')[0]],{env:e});for(let n=0;n<60&&fs.existsSync('/proc/'+pid);n++)await pause(250);expect(fs.existsSync('/proc/'+pid)).toBe(false);
 launch(bin,['--remote-debugging-port=9434'],'restart-app.log');const b=await waitConnect(9434);await btn(b.page,'学ぶ').click();await expect(b.page.locator('.markdown')).toContainText('初期構成処理が正常終了');await scene('L08-restart','アプリを終了して教材を再開','0.4.4の教材を再表示。既存プロジェクトを再生成しない');await b.browser.close();
 const c=await connect(9431);await c.page.keyboard.press('Control+p');await c.page.locator('.quick-input-widget input').fill('START_HERE.md');await pause(700);await c.page.keyboard.press('Enter');await pause(1000);expect(sha(project.destination+'/START_HERE.md')).toBe(project.guideSha256);await scene('L09-project-resume','VS Codeから生成済みSTART_HERE.mdを開く','保存先の手順が保持され、生成済みプロジェクトから再開できる');await c.browser.close();
}
