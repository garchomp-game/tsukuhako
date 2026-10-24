// Extracted final deb on an isolated Xephyr desktop; not a host package/menu installation.
// Start tools/onboarding-desktop.sh with ONBOARDING_OUT, then provide TSUKUHAKO_TEST_BINARY.
import {fs,out,runtime,start,waitConnect,env,command,json,expect,pause,sha} from '../onboarding-evidence.mjs';
import path from 'node:path';
const binary=process.env.TSUKUHAKO_TEST_BINARY;
if(!binary||!path.isAbsolute(binary)||!fs.existsSync(binary))throw Error('An extracted deb binary must be supplied');
const info=JSON.parse(fs.readFileSync(path.dirname(binary)+'/resources/app/build-info.json'));
const results={category:'EXTRACTED_DEB_ON_REAL_HOST',interaction:'AUTOMATED',...info,binarySha256:sha(binary),menuInstallation:'NOT_RUN',offlineGuide:false,chapters:[],restart:false};
const launched=[];
async function launch(){const pid=start(binary,['--remote-debugging-port=9430','--remote-debugging-address=127.0.0.1'],'deb-ui.log');launched.push(pid);const c=await waitConnect(9430);return{...c,pid};}
async function close(c){
 const row=command('wmctrl',['-lp'],{env:env()}).split('\n').find(l=>Number(l.trim().split(/\s+/)[2])===c.pid);
 if(!row)throw Error('Owned app window missing');
 command('wmctrl',['-ic',row.split(' ')[0]],{env:env()});
 await expect.poll(()=>{try{process.kill(c.pid,0);return true}catch{return false}},{timeout:20000}).toBe(false);
 await c.browser.close();
}
let current;
try {
 current=await launch();const p=current.page;
 await expect(p.getByRole('button',{name:'はじめて使う',exact:true})).toBeVisible();
 await expect(p.getByLabel('Next.js：画面とページ移動の練習（初期候補）',{exact:true})).toBeChecked();
 await expect(p.locator('.version')).toContainText(info.productVersion);
 await p.screenshot({path:out+'/screenshots/00-first-screen.png'});
 await current.context.setOffline(true);
 await p.getByRole('button',{name:'はじめて使う',exact:true}).click();
 await expect(p.locator('.markdown h1')).toBeVisible();
 await expect(p.locator('.markdown')).toContainText('tsukuhako-linux-amd64-0.4.5.deb');
 await p.screenshot({path:out+'/screenshots/01-offline-guide.png'});
 const chapters=['入口と準備','F2の初回手順','困ったとき・再開','任意：変更と復元','記録票'];
 for(const name of chapters){await p.getByRole('navigation',{name:'章の一覧',exact:true}).getByRole('button',{name,exact:true}).click();await expect(p.locator('.markdown h1')).toBeVisible();await expect(p.getByRole('alert')).toHaveCount(0);results.chapters.push({name,heading:await p.locator('.markdown h1').innerText()});}
 results.offlineGuide=true;
 await p.getByRole('navigation',{name:'章の一覧',exact:true}).getByRole('button',{name:'F2の初回手順',exact:true}).click();
 await expect(p.locator('.markdown h1')).toHaveText('F2を一つ作り、最初の画面まで進む');
 await p.locator('.reader-scroll').evaluate(e=>{e.scrollTop=450});await pause(800);
 const position=JSON.parse(fs.readFileSync(runtime+'/xdg-config/tsukuhako/reading.json','utf8'));
 expect(position.lessonId).toBe('guide');expect(position.chapterId).toBe('first-run');expect(position.scroll).toBeGreaterThan(0);
 await close(current);current=await launch();
 await expect(current.page.locator('.markdown h1')).toHaveText('F2を一つ作り、最初の画面まで進む');
 await expect.poll(()=>current.page.locator('.reader-scroll').evaluate(e=>e.scrollTop)).toBeGreaterThan(0);
 results.restart=true;results.savedReading=position;
 await current.page.screenshot({path:out+'/screenshots/02-reading-restored.png'});
 await current.page.getByRole('navigation',{name:'ツクハコの画面'}).getByRole('button',{name:'作る',exact:true}).click();
 await close(current);current=undefined;
 results.result='PASS';json(out+'/logs/ui-guide.json',results);
} finally {
 if(current)await current.browser.close().catch(()=>{});
 // Only processes launched by this runner; successful runs already closed through the WM.
 for(const pid of launched)try{process.kill(pid,'SIGTERM')}catch{}
}
