// Final deb, real IPC and real X clipboard. A second mode checks target replacement.
import {fs,out,runtime,connect,expect,command,env,json,sha,pause,spawnSync} from '../onboarding-evidence.mjs';
const a=await connect(Number(process.env.TSUKUHAKO_APP_PORT||9430)),p=a.page;
const button=name=>p.getByRole('button',{name,exact:true});
const nav=name=>p.getByRole('navigation',{name:'ツクハコの画面'}).getByRole('button',{name,exact:true});
try {
 const project=JSON.parse(fs.readFileSync(runtime+'/sunday-project.json'));
 const guide=fs.readFileSync(project.destination+'/START_HERE.md','utf8');
 await nav('作る').click();await button('サンプル画面を表示する手順へ').click();
 await expect(p.locator('.project-context')).toContainText(project.destination);
 await p.locator('.project-context summary').click();await button('手順全体をコピー').click();
 expect(spawnSync('xclip',['-selection','clipboard','-o'],{env:env(),encoding:'utf8'}).stdout).toBe(guide);
 await button('URLをコピー').click();expect(spawnSync('xclip',['-selection','clipboard','-o'],{env:env(),encoding:'utf8'}).stdout).toBe('http://localhost:'+project.port+'/');
 await a.context.setOffline(true);await nav('困ったとき').click();
 await p.locator('.markdown').getByRole('button',{name:'初期処理の状態を確認する',exact:true}).click();
 await expect(p.locator('#初期処理が終わらない')).toBeFocused();
 await p.locator('.markdown').getByRole('button',{name:'開発サーバーを起動する',exact:true}).click();
 await expect(p.locator('#開発サーバーを起動する')).toBeFocused();
 await expect(p.locator('.project-context')).toContainText(project.destination);
 const row=command('wmctrl',['-lp'],{env:env()}).split('\n').find(l=>Number(l.trim().split(/\s+/)[2])===project.appPid);
 if(!row)throw Error('Owned app window missing');
 command('wmctrl',['-ir',row.split(' ')[0],'-e','0,0,0,860,700'],{env:env()});await pause(350);
 await p.locator('.project-context').scrollIntoViewIfNeeded();
 expect(await p.evaluate(()=>({body:document.body.scrollWidth>innerWidth,reader:document.querySelector('.reader-scroll').scrollWidth>document.querySelector('.reader-scroll').clientWidth}))).toEqual({body:false,reader:false});
 await p.screenshot({path:out+'/screenshots/03-long-path-narrow.png'});
 await button('目次を開く').focus();await p.keyboard.press('Enter');await expect(p.getByLabel('教材・ガイドを選ぶ')).toBeFocused();await p.keyboard.press('Escape');await expect(button('目次を開く')).toBeFocused();
 command('wmctrl',['-ir',row.split(' ')[0],'-e','0,0,0,1150,850'],{env:env()});
 await a.context.setOffline(false);
 json(out+'/logs/current-project.json',{category:'EXTRACTED_DEB_ON_REAL_HOST',result:'PASS',guideCopiedExactly:true,guideSha256:sha(project.destination+'/START_HERE.md'),urlCopiedExactly:true,helpRoundTrip:true,offlineSymptomAndRecoveryAnchors:true,narrowWindowWidth:860,noHorizontalOverflow:true,keyboardTocFocus:true});
}finally{await a.browser.close()}
