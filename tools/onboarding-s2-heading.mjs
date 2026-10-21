// QA supplement: the first S2 capture verified h1 text in DOM while scrolled to notes.
// This run records the actual heading in view before/change/restore.
import {fs,out,runtime,connect,waitConnect,start,palette,terminal,edit,command,env,x,expect,pause,sha,json,scene,recordStart,recordStop} from './onboarding-evidence.mjs';
const project=JSON.parse(fs.readFileSync(out+'/S2-project.json'));
const attempt='S2-heading-'+Date.now(),file=project.destination+'/'+project.exercise.file;
const original=fs.readFileSync(file,'utf8');expect(sha(file)).toBe(project.sourceHash);
const host=command('wmctrl',['-lp'],{env:env()}).split('\n').find(l=>l.includes('TSUKUHAKO S2 HOST')).split(' ')[0];
const hostLog=out+'/logs/S2-host.typescript';
function hostRun(s){x(['windowactivate','--sync',host]);x(['type','--clearmodifiers','--delay','15',s]);x(['key','Return'])}
const shot=(id,action,actual,extra={})=>scene(id,action,actual,{attempt,...extra});
let c,b;
await recordStart(attempt);
try{
 hostRun('bash scripts/db.sh start; echo HEADING_DB_READY=$?');
 await expect.poll(()=>fs.readFileSync(hostLog,'utf8'),{timeout:120000,intervals:[1000]}).toContain('HEADING_DB_READY=0');
 start('code',[project.destination],'S2-heading-code.log');
 c=await waitConnect(9431);await palette(c.page,'Dev Containers: Reopen in Container');
 await expect.poll(()=>c.page.locator('.statusbar').innerText(),{timeout:120000,intervals:[1000]}).toContain('Dev Container: ツクハコ S2');
 await palette(c.page,'Terminal: Create New Terminal');await pause(800);await terminal(c.page,'npm run dev');
 await expect.poll(async()=>{try{return(await fetch('http://localhost:'+project.port,{signal:AbortSignal.timeout(2000)})).status}catch{return 0}},{timeout:120000,intervals:[1000]}).toBe(200);
 b=await connect(9432);const p=b.page;await p.bringToFront();await p.goto('http://localhost:'+project.port);await p.locator('h1').scrollIntoViewIfNeeded();
 await expect(p.locator('h1')).toHaveText(project.exercise.before);await shot('S2-heading-before','S2を再開し見出しを画面内に表示','元の「ローカル学習メモ」を確認');
 await edit(c.page,project.exercise.file,project.exercise.before,project.exercise.after);await expect.poll(()=>fs.readFileSync(file,'utf8')).toBe(original.replace(project.exercise.before,project.exercise.after));
 await shot('S2-heading-editor','実エディタで見出しを変更して保存','app/page.tsxの見出しだけを変更');
 await p.bringToFront();await p.locator('h1').scrollIntoViewIfNeeded();await expect(p.locator('h1')).toHaveText(project.exercise.after);await shot('S2-heading-changed','ブラウザで見出し変更を確認','わたしの学習メモ を画面内に表示');
 await edit(c.page,project.exercise.file,project.exercise.after,project.exercise.before);await expect.poll(()=>sha(file)).toBe(project.sourceHash);
 await p.bringToFront();await p.locator('h1').scrollIntoViewIfNeeded();await expect(p.locator('h1')).toHaveText(project.exercise.before);await shot('S2-heading-restored','実エディタで復元してブラウザを確認','ローカル学習メモ に戻り、元のSHA-256も一致',{sha256:sha(file)});
 await c.page.close();await c.browser.close();c=null;await pause(800);
 hostRun('bash scripts/app.sh stop && bash scripts/db.sh stop; echo HEADING_STOPPED=$?');
 await expect.poll(()=>fs.readFileSync(hostLog,'utf8'),{timeout:60000,intervals:[500]}).toContain('HEADING_STOPPED=0');
 await shot('S2-heading-stop','補足確認後にS2だけ通常停止','ソースとDB volumeを保持');
 json(out+'/logs/S2-heading.json',{result:'PASS',attempt,beforeHash:project.sourceHash,afterRestoreHash:sha(file),reason:'First browser screenshots were scrolled to notes, so heading was out of view despite DOM assertions. This supplement captures h1 in view.',stopped:true});
}catch(error){await shot('S2-heading-failure','補足撮影の停止点',String(error),{status:'FAIL'});throw error}
finally{if(c)await c.browser.close();if(b)await b.browser.close();await recordStop()}
