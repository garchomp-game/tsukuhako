// V01/V02 on the extracted final deb, with real IPC and generated local files.
// No host installation, package changes, project runtime or external publication.
import {fs,out,runtime,start,waitConnect,env,command,json,expect,sha} from '../onboarding-evidence.mjs';
import path from 'node:path';
import net from 'node:net';
const binary=process.env.TSUKUHAKO_TEST_BINARY;
if(!binary||!path.isAbsolute(binary)||!fs.existsSync(binary))throw Error('Supply the extracted final deb binary');
const info=JSON.parse(fs.readFileSync(path.dirname(binary)+'/resources/app/build-info.json'));
const parent=runtime+'/projects';fs.mkdirSync(parent,{recursive:true});
const pid=start(binary,['--remote-debugging-port=9433','--remote-debugging-address=127.0.0.1'],'review-app.log');
const c=await waitConnect(9433),p=c.page,records=[];
const button=name=>p.getByRole('button',{name,exact:true});
const nav=name=>p.getByRole('navigation',{name:'ツクハコの画面'}).getByRole('button',{name,exact:true});
const escaped=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
async function snapshot(name){await p.screenshot({path:out+'/screenshots/'+name+'.png'})}
async function help(id,name,heading,entry=nav('困ったとき')){
 await entry.click();await expect(p.getByLabel('教材・ガイドを選ぶ')).toHaveValue(id);
 await expect(p.locator('.markdown h1')).toHaveText(name+'を作る前に困ったとき');await expect(p.locator('[id="'+heading+'"]')).toBeFocused();
 await expect(p.locator('.markdown')).not.toContainText('npm run dev');await expect(p.locator('.markdown').getByRole('button',{name:'Linuxの準備',exact:true})).toHaveCount(1);
}
try{
 await expect(button('はじめてのWeb画面で始める')).toBeEnabled();await expect(p.locator('.version')).toContainText(info.productVersion);
 const catalog=(await p.evaluate(()=>window.tsukuhako.getTemplates())).value;
 await c.context.setOffline(true);
 await button('全体の流れを読む').click();await p.getByRole('navigation',{name:'章の一覧'}).getByRole('button',{name:'サンプル画面を表示する',exact:true}).click();
 await expect(p.locator('.markdown')).toContainText('保存先を決める');await expect(p.locator('.markdown')).toContainText('プロジェクトの置き場所を決めます。');await snapshot('01-corrected-first-guide');
 await nav('作る').click();await button('はじめてのWeb画面で始める').click();await expect(p.locator('#preparation-title')).toBeFocused();await expect(p.getByLabel('親フォルダ',{exact:true})).toBeHidden();await snapshot('02-start-preparation');
 await button('保存先を決める').click();await expect(p.locator('#generator-title')).toHaveText('プロジェクトの置き場所を決めます。');await expect(p.getByLabel('親フォルダ',{exact:true})).toBeVisible();await snapshot('03-destination');
 records.push({id:'V01',result:'PASS',guideReadOffline:true,recommendedSelection:true,preparationFocused:true,explicitDestinationButton:true});
 await button('← 戻る').click();
 for(const id of ['F2','I1','S2']){
  const t=catalog.templates.find(t=>t.id===id),goal=catalog.goals.find(g=>g.templates.includes(id));
  await p.getByRole('button',{name:new RegExp(escaped(goal.title))}).click();
  await help(id,t.name,'準備を確認する');await snapshot('04-'+id+'-preparation-help');
  await p.locator('.markdown').getByRole('button',{name:'Linuxの準備',exact:true}).click();await expect(p.locator('.markdown h1')).toHaveText('Linuxの準備');await button('準備チェックへ戻る').click();await expect(p.locator('#preparation-title')).toBeFocused();
  await button('保存先を決める').click();await p.getByLabel('親フォルダ',{exact:true}).fill(parent);const folder=id+' 入力を保持';await p.getByLabel('新しいフォルダ名').fill(folder);
  await help(id,t.name,'保存先を確認する');await button('作る画面へ戻る').click();await expect(p.getByLabel('新しいフォルダ名')).toHaveValue(folder);
  const destination=path.join(parent,folder);fs.mkdirSync(destination);
  await button('作成内容を確認').click();await expect(button('困ったときの手順を読む')).toBeVisible();
  await help(id,t.name,'保存先を確認する',button('困ったときの手順を読む'));await button('作る画面へ戻る').click();
  // Our empty directory is removed so planning can succeed; a new one then
  // simulates a competing creation between preview and apply.
  fs.rmdirSync(destination);await button('作成内容を確認').click();await expect(button('プロジェクトを作成')).toBeEnabled();
  await help(id,t.name,'作成内容を確認する');await button('作る画面へ戻る').click();
  fs.mkdirSync(destination);await button('プロジェクトを作成').click();await expect(button('困ったときの手順を読む')).toBeVisible();
  await help(id,t.name,'作成に失敗したとき',button('困ったときの手順を読む'));await snapshot('05-'+id+'-generation-error-help');await button('作る画面へ戻る').click();
  await help(id,t.name,'作成に失敗したとき');await button('作る画面へ戻る').click();await expect(p.locator('.preview')).toContainText(destination);
  records.push({id:'V02',templateId:id,result:'PASS',os:'linux',preparationLink:true,returnedPreparationFocus:true,topNavigationStages:['selection','destination','confirmation','generation-error'],realPlanError:'existing directory',realApplyError:'directory created after preview',valuesRetained:true});
  await button('← 戻る').click();await button('← 戻る').click();
 }
 await button('はじめてのWeb画面で始める').click();await button('保存先を決める').click();await p.getByLabel('親フォルダ',{exact:true}).fill(parent);const folder='改訂版 日本語のプロジェクト';await p.getByLabel('新しいフォルダ名').fill(folder);
 const socket=net.createServer();await new Promise(r=>socket.listen(0,'127.0.0.1',r));const port=socket.address().port;await new Promise(r=>socket.close(r));
 await p.locator('.advanced summary').click();await p.getByLabel('ホストポート',{exact:true}).fill(String(port));await button('作成内容を確認').click();await button('プロジェクトを作成').click();await button('サンプル画面を表示する手順へ').click();
 const destination=path.join(parent,folder);await expect(p.locator('.project-context')).toContainText(destination);await expect(p.locator('.project-context')).toContainText('http://localhost:'+port+'/');
 expect(fs.existsSync(destination+'/.env')).toBe(true);expect(fs.readFileSync(destination+'/START_HERE.md','utf8')).toContain(destination);await snapshot('06-current-project');
 await nav('困ったとき').click();await expect(p.getByLabel('教材・ガイドを選ぶ')).toHaveValue('guide');await button('読んでいた手順へ戻る').click();await expect(p.locator('.project-context')).toContainText(destination);await expect(p.locator('.project-context')).toContainText(String(port));
 records.push({id:'generated-regression',result:'PASS',destination,port,savedGuideSha256:sha(destination+'/START_HERE.md'),envGenerated:true,realGeneration:true,helpReturn:true,sampleRuntime:'NOT_RUN in this revision; see historical 0.4.6 evidence'});
 const row=command('wmctrl',['-lp'],{env:env()}).split('\n').find(l=>Number(l.trim().split(/\s+/)[2])===pid);if(!row)throw Error('Owned app window missing');command('wmctrl',['-ic',row.split(' ')[0]],{env:env()});await expect.poll(()=>{try{process.kill(pid,0);return true}catch{return false}}).toBe(false);
 json(out+'/logs/review-smoke.json',{category:'EXTRACTED_DEB_ON_REAL_HOST',interaction:'AUTOMATED',result:'PASS',...info,checkedAt:new Date().toISOString(),records,appClosedNormally:true,hostInstallation:'NOT_RUN',humanAcceptance:'利用者確認待ち'});
 console.log('PASS final deb V01/V02 and real generation/current-project return');
}finally{await c.browser.close().catch(()=>{});try{process.kill(pid,'SIGTERM')}catch{}}
