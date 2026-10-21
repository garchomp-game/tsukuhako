import {_electron as electron,expect} from '@playwright/test';
import {fs,root,out,runtime,env,command,scene,json,sha,pause,btn} from './onboarding-evidence.mjs';
const folder=runtime+'/before 日本語 空白';fs.mkdirSync(folder,{recursive:true});
const archive=root+'/dist/tsukuhako-linux-x64-0.4.3.tar.gz';
command('tar',['-xzf',archive,'-C',folder]);
const e=env();delete e.ELECTRON_RUN_AS_NODE;
const app=await electron.launch({executablePath:folder+'/tsukuhako-linux-x64-0.4.3/tsukuhako',args:['--user-data-dir='+runtime+'/before-profile'],cwd:'/tmp',env:e,chromiumSandbox:true});
const p=await app.firstWindow();p.setDefaultTimeout(15000);const measurements=[];
try{
 await btn(p,'学ぶ').click();await p.getByLabel('教材を選ぶ').selectOption('S2');await p.getByRole('navigation',{name:'章の一覧'}).getByRole('button',{name:'最初の一歩',exact:true}).click();await expect(p.locator('.markdown h1')).toHaveText('S2：最初の一歩');
 for(const [name,width,height,zoom] of [['wide',1150,880,1],['narrow',860,780,1],['200percent',1150,880,2]]){
  await app.evaluate(({BrowserWindow},{width,height,zoom})=>{const w=BrowserWindow.getAllWindows()[0];w.setBounds({x:20,y:0,width,height});w.webContents.setZoomFactor(zoom);},{width,height,zoom});await pause(500);
  const dims=await p.evaluate(()=>({viewport:{width:innerWidth,height:innerHeight},windowScroll:{client:document.documentElement.clientHeight,content:document.documentElement.scrollHeight},areas:[...document.querySelectorAll('.curriculum-toc,.reader-scroll')].map(el=>({class:el.className,height:el.clientHeight,content:el.scrollHeight,overflow:getComputedStyle(el).overflowY}))}));
  measurements.push({name,zoom,method:'Electron webContents.setZoomFactor',bounds:await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].getBounds()),...dims});await scene('UX-before-'+name,'0.4.3の教材表示','変更前の実表示・スクロール領域を記録');
 }
 json(out+'/logs/reader-before.json',{category:'REAL_HOST',version:'0.4.3',artifactSha256:sha(archive),measurements});
}finally{await app.close();}
