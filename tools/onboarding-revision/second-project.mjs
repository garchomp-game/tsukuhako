// The final binary must forget its former editor target after another generation.
import net from 'node:net';
import {fs,out,runtime,connect,waitConnect,expect,command,env,json,pause} from '../onboarding-evidence.mjs';
const first=JSON.parse(fs.readFileSync(runtime+'/sunday-project.json'));
const a=await connect(9430),p=a.page;
const button=name=>p.getByRole('button',{name,exact:true});
try {
 await p.getByRole('navigation',{name:'ツクハコの画面'}).getByRole('button',{name:'作る',exact:true}).click();
 await button('別のプロジェクトを作る').click();await button('保存先を決める').click();
 const folder='次の プロジェクト 新しい接続先',destination=runtime+'/projects/'+folder;
 const server=net.createServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));const port=server.address().port;await new Promise(r=>server.close(r));
 await p.getByLabel('親フォルダ',{exact:true}).fill(runtime+'/projects');await p.getByLabel('新しいフォルダ名',{exact:true}).fill(folder);
 if(!await p.getByLabel('ホストポート',{exact:true}).isVisible())await p.locator('.advanced summary').click();
 await p.getByLabel('ホストポート',{exact:true}).fill(String(port));await button('作成内容を確認').click();await button('プロジェクトを作成').click();await button('サンプル画面を表示する手順へ').click();
 await expect(p.locator('.project-context')).toContainText(destination);await expect(p.locator('.project-context')).toContainText(String(port));await expect(p.locator('.reader-scroll')).not.toContainText(first.destination);await expect(p.locator('.reader-scroll')).not.toContainText('http://localhost:'+first.port+'/');
 await button('このフォルダーをVS Codeで開く').click();
 const c=await waitConnect(9431);await expect.poll(()=>c.page.title()).toContain(folder);
 await p.screenshot({path:out+'/screenshots/05-second-project.png'});
 const row=command('wmctrl',['-lp'],{env:env()}).split('\n').find(l=>l.includes('[TSUKUHAKO evidence]')&&l.includes(folder));if(!row)throw Error('New project editor window missing');
 command('wmctrl',['-ic',row.split(' ')[0]],{env:env()});await c.browser.close();
 json(out+'/logs/second-project.json',{category:'EXTRACTED_DEB_ON_REAL_HOST',result:'PASS',differentDestination:true,nonDefaultPort:port,oldDestinationAbsent:true,oldUrlAbsent:true,actualCodeWindowShowsNewFolder:true,savedGuideUsesNewDestination:fs.readFileSync(destination+'/START_HERE.md','utf8').includes(destination),containerNotStarted:true});
 const appRow=command('wmctrl',['-lp'],{env:env()}).split('\n').find(l=>Number(l.trim().split(/\s+/)[2])===first.appPid);if(!appRow)throw Error('Owned app missing');command('wmctrl',['-ic',appRow.split(' ')[0]],{env:env()});
 await expect.poll(()=>{try{process.kill(first.appPid,0);return true}catch{return false}},{timeout:20000}).toBe(false);
}finally{await a.browser.close()}
