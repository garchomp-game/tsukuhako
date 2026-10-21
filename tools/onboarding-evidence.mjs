// Small, local capture helpers. No product IPC is replaced. Large runtime/media stay in runs/.
import fs from 'node:fs';
import path from 'node:path';
import {spawn, spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {chromium, expect} from '@playwright/test';
export {fs,path,spawn,spawnSync,chromium,expect};
export const root=path.resolve(import.meta.dirname,'..');
export const out=path.resolve(process.env.ONBOARDING_OUT||root+'/validation/onboarding-0.4.2/20261021T0919-JST');
export const runtime=out+'/runs';
export const stamp=()=>new Date().toLocaleString('sv-SE',{timeZone:'Asia/Tokyo'}).replace(' ','T')+'+09:00';
export const sha=file=>createHash('sha256').update(fs.readFileSync(file)).digest('hex');
export const json=(file,value)=>fs.writeFileSync(file,JSON.stringify(value,null,2)+'\n');
export function command(exe,args=[],options={}){const r=spawnSync(exe,args,{encoding:'utf8',...options});if(r.status!==0)throw Error(`${exe}: ${r.status}: ${r.stderr||r.stdout}`);return r.stdout.trim()}
export const env=()=>({...process.env,...JSON.parse(fs.readFileSync(runtime+'/desktop-env.json'))});
export const pause=ms=>new Promise(r=>setTimeout(r,ms));
export async function connect(port){const browser=await chromium.connectOverCDP(`http://127.0.0.1:${port}`);const page=browser.contexts()[0].pages()[0];page.setDefaultTimeout(15000);return {browser,page,context:browser.contexts()[0]};}
export async function waitConnect(port){for(let i=0;i<60;i++){try{return await connect(port)}catch{await pause(1000)}}throw Error(`No CDP on ${port}`)}
export const btn=(page,name)=>['作る','学ぶ','困ったとき'].includes(name)?page.getByRole('navigation',{name:'ツクハコの画面'}).getByRole('button',{name,exact:true}):page.getByRole('button',{name,exact:true});
export function x(args){return command('xdotool',args,{env:env()})}
export function start(exe,args,log){const fd=fs.openSync(runtime+'/'+log,'a');const e=env();delete e.ELECTRON_RUN_AS_NODE;const p=spawn(exe,args,{env:e,stdio:['ignore',fd,fd],detached:true});p.unref();return p.pid}
export async function screen(file){command('ffmpeg',['-hide_banner','-loglevel','error','-f','x11grab','-video_size','1600x900','-i',':91','-frames:v','1','-y',file]);}
export async function scene(id,action,actual,extra={}){
 const now=Date.now();const video=fs.existsSync(runtime+'/recording.json')?JSON.parse(fs.readFileSync(runtime+'/recording.json')):null;
 await pause(650);const screenshot=`screenshots/${id}.png`;await screen(out+'/'+screenshot);
 const step={id,time:stamp(),status:'PASS',executionType:'REAL_HOST',interaction:'AUTOMATED',action,expected:actual,actual,place:'Linux Mint host / dedicated Xephyr X11 desktop',screenshot,video:video?{path:video.path,offsetSeconds:Number(((now-video.start)/1000).toFixed(2))}:null,...extra};
 fs.appendFileSync(out+'/steps.ndjson',JSON.stringify(step)+'\n');console.log(JSON.stringify(step));return step;
}
export async function recordStart(name){
 const folder=runtime+'/media';fs.mkdirSync(folder,{recursive:true});const file=folder+'/'+name+'.mp4';if(fs.existsSync(file))throw Error('Recording already exists: '+file);
 const fd=fs.openSync(out+'/logs/'+name+'-ffmpeg.txt','w');const p=spawn('ffmpeg',['-hide_banner','-nostdin','-f','x11grab','-framerate','12','-video_size','1600x900','-draw_mouse','1','-i',':91','-an','-c:v','libx264','-preset','ultrafast','-crf','20','-pix_fmt','yuv420p','-movflags','+faststart',file],{stdio:['ignore',fd,fd],detached:true});p.unref();
 const info={pid:p.pid,start:Date.now(),startJST:stamp(),path:file};json(runtime+'/recording.json',info);await pause(1200);return info;
}
export async function recordStop(){const f=runtime+'/recording.json';if(!fs.existsSync(f))return;const r=JSON.parse(fs.readFileSync(f));process.kill(r.pid,'SIGINT');for(let i=0;i<60;i++){try{process.kill(r.pid,0);await pause(200)}catch{break}}
 const probe=JSON.parse(command('ffprobe',['-v','error','-show_format','-show_streams','-of','json',r.path]));json(r.path+'.json',{...r,endJST:stamp(),bytes:fs.statSync(r.path).size,sha256:sha(r.path),probe});fs.unlinkSync(f);return probe;
}
export async function palette(page,name){await page.bringToFront();await page.keyboard.press('Escape');await page.keyboard.press('Control+Shift+p');await page.locator('.quick-input-widget input').fill('>'+name);await page.locator('.quick-input-widget a').filter({hasText:new RegExp('^'+name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'$')}).first().click();}
export async function terminal(page,text){await page.locator('.terminal.xterm .xterm-helper-textarea').last().focus();await page.keyboard.type(text,{delay:18});await page.keyboard.press('Enter');}
export async function edit(page,file,before,after){await page.bringToFront();await page.keyboard.press('Escape');await page.keyboard.press('Control+p');await page.locator('.quick-input-widget input').fill(file);await pause(800);await page.keyboard.press('Enter');await pause(500);await page.locator('.part.editor [role="textbox"]').first().focus();await page.keyboard.press('Control+h');const f=page.locator('.find-widget');await f.getByRole('textbox',{name:'Find',exact:true}).fill(before);await f.getByRole('textbox',{name:'Replace',exact:true}).fill(after);await expect(f).toContainText('1 of 1');await f.getByRole('button',{name:'Replace (Enter)',exact:true}).click();await page.keyboard.press('Escape');await page.keyboard.press('Control+s');}

if(process.argv[2]==='record-start')await recordStart(process.argv[3]);
if(process.argv[2]==='record-stop')console.log(await recordStop());
if(process.argv[2]==='screen')await screen(process.argv[3]);
