// Version-only release smoke: extracted deb, real generation and a copied prior
// reading setting. No installed app, VS Code, Docker or public service is changed.
import {fs,path,out,runtime,waitConnect,env,command,json,expect,sha,spawn} from '../onboarding-evidence.mjs';
import {closeOwnedProcess} from '../owned-process-exit.mjs';
import net from 'node:net';
const binary=process.env.TSUKUHAKO_TEST_BINARY,previous=process.env.TSUKUHAKO_PREVIOUS_READING;
if(!binary||!path.isAbsolute(binary)||!fs.existsSync(binary)||!previous||!fs.existsSync(previous))throw Error('Supply final extracted binary and prior reading.json');
const info=JSON.parse(fs.readFileSync(path.dirname(binary)+'/resources/app/build-info.json'));
const previousHash=sha(previous),previousReading=JSON.parse(fs.readFileSync(previous));
expect(previousReading.guideMode).toBe('quick');expect(info.dirty).toBe(false);
const profile=runtime+'/version-profile',parent=runtime+'/projects';
if(fs.existsSync(profile))throw Error('Use a fresh profile');
fs.mkdirSync(profile);fs.mkdirSync(parent,{recursive:true});fs.mkdirSync(out+'/screenshots',{recursive:true});
fs.copyFileSync(previous,profile+'/reading.json');
const port=9433,s=net.createServer();await new Promise((resolve,reject)=>s.once('error',reject).listen(port,'127.0.0.1',resolve));await new Promise(resolve=>s.close(resolve));
const e=env();delete e.ELECTRON_RUN_AS_NODE;
const fd=fs.openSync(runtime+'/version-app.log','a');
const child=spawn(binary,['--user-data-dir='+profile,'--remote-debugging-port='+port,'--remote-debugging-address=127.0.0.1'],{env:e,stdio:['ignore',fd,fd]});fs.closeSync(fd);
let c,failure,closure;const errors=[],checks=[];
try{
 c=await waitConnect(port);const p=c.page;p.on('pageerror',error=>errors.push(error.message));await c.context.setOffline(true);
 const b=name=>p.getByRole('button',{name,exact:true}),nav=name=>p.getByRole('navigation',{name:'ツクハコの画面'}).getByRole('button',{name,exact:true});
 await expect(p.locator('.version b')).toHaveText(info.productVersion);
 await nav('作る').click();await expect(p.getByRole('radio',{name:'必要な操作だけ進める',exact:true})).toBeChecked();
 await p.screenshot({path:out+'/screenshots/01-version-and-preference.png'});
 checks.push('New version displayed; copied 0.4.8 reading preference retained');
 await nav('ガイド').click();await p.getByRole('navigation',{name:'章の一覧'}).getByRole('button',{name:'はじめに',exact:true}).click();
 await expect(p.locator('.markdown')).toContainText('ツクハコ'+info.productVersion);
 checks.push('Bundled guide identifies the new version offline');
 await nav('作る').click();await b('はじめてのWeb画面で始める').click();
 await expect(p.locator('#generator-title')).toHaveText('プロジェクトの置き場所を決めます。');
 const name='版確認 日本語のWeb画面',destination=path.join(parent,name);
 await p.getByLabel('親フォルダ',{exact:true}).fill(parent);await p.getByLabel('新しいフォルダ名').fill(name);
 await b('作成内容を確認').click();await expect(p.locator('.preview .port b')).toHaveText('3000');await b('プロジェクトを作成').click();
 await expect(p.locator('.created-actions button')).toHaveCount(1);await p.locator('.created-actions button').click();
 await expect(p.locator('.project-context')).toContainText(destination);await expect(p.locator('.project-context')).toContainText('http://localhost:3000/');
 await expect(p.locator('.project-context + .project-editor-action').getByRole('button',{name:'このフォルダーをVS Codeで開く',exact:true})).toBeVisible();
 await expect(p.getByRole('radio',{name:'必要な操作だけ進める',exact:true})).toBeChecked();
 expect(fs.readFileSync(destination+'/.env','utf8')).toMatch(/^HOST_PORT=3000$/m);
 const guide=fs.readFileSync(destination+'/START_HERE.md','utf8');expect(guide).toContain(destination);expect(guide).toContain('http://localhost:3000/');expect(guide).toContain('同じフォルダーから再開する');
 await p.screenshot({path:out+'/screenshots/02-generated-project.png'});
 checks.push('Real F2 generation, default 3000, immediate editor action, quick preference and complete saved guide');
 expect(sha(previous)).toBe(previousHash);expect(errors).toEqual([]);
}catch(error){failure=String(error);await c?.page.screenshot({path:runtime+'/failure.png',timeout:3000}).catch(()=>{});}
finally{
 closure=await closeOwnedProcess(child,()=>{const row=command('wmctrl',['-lp'],{env:e}).split('\n').find(row=>Number(row.trim().split(/\s+/)[2])===child.pid);if(!row)throw Error('Owned app window missing');command('wmctrl',['-ic',row.split(' ')[0]],{env:e})});
 await c?.browser.close().catch(()=>{});
 if(closure.status!=='PASS')failure||='Application did not exit normally';
 json(out+'/logs/version-smoke.json',{category:'EXTRACTED_DEB_ON_REAL_HOST',result:failure?'FAIL':'PASS',...info,checks,rendererErrors:errors,closure,previousReadingSha256:previousHash,previousReadingUnchanged:sha(previous)===previousHash,sandbox:'ENABLED',installation:'NOT_RUN',codeDockerAndSampleRuntime:'NOT_RUN',...(failure?{error:failure}:{})});
 if(failure)throw Error(failure);console.log('PASS version-only final artifact smoke');
}
