// Local viewer QA only: does not upload traces or start product projects.
import {fs,path,root,out,runtime,start,connect,pause,expect,json} from './onboarding-evidence.mjs';
const cases=[['electron','recovery-input-display-trace.zip',9437],['code','F2-editor-trace-02.zip',9438],['browser','F2-browser-trace-02.zip',9439]];
const servers=[];const results=[];const b=await connect(9432);
try{
 for(const [kind,file,port] of cases){
  const pid=start(process.execPath,[root+'/tools/node_modules/playwright/cli.js','show-trace','--host','127.0.0.1','--port',String(port),runtime+'/media/'+file],`trace-viewer-${kind}.log`);servers.push({pid,kind,port});
  const p=await b.context.newPage();
  for(let i=0;i<30;i++){try{await p.goto('http://127.0.0.1:'+port);break}catch(err){if(i===29)throw err;await pause(300)}}
  await expect.poll(()=>p.getByRole('treeitem').count(),{timeout:20000}).toBeGreaterThan(0);
  const actions=await p.getByRole('treeitem').count();
  await p.getByRole('treeitem').nth(kind==='electron'?actions-1:Math.min(7,actions-1)).click();await pause(800);
  const screenshot=`screenshots/QA-trace-${kind}-${Date.now()}.png`;await p.screenshot({path:out+'/'+screenshot});
  results.push({kind,file,actions,url:p.url(),screenshot,viewerLoaded:true,visualReview:'pending'});
 }
 const steps=fs.readFileSync(out+'/steps.ndjson','utf8').trim().split('\n').map(s=>JSON.parse(s));
 const step=steps.find(s=>s.id==='M19');const p=await b.context.newPage();
 await p.goto('file://'+step.video.path);
 await expect.poll(()=>p.locator('video').evaluate(v=>v.readyState)).toBeGreaterThanOrEqual(2);
 await p.locator('video').evaluate(async(v,t)=>{v.currentTime=t;await v.play()},step.video.offsetSeconds);
 await pause(1500);await p.locator('video').evaluate(v=>v.pause());
 const video=await p.locator('video').evaluate(v=>({duration:v.duration,currentTime:v.currentTime,readyState:v.readyState,width:v.videoWidth,height:v.videoHeight,error:v.error?.message??null}));
 expect(video.error).toBe(null);expect(video.currentTime).toBeGreaterThan(step.video.offsetSeconds);
 const screenshot=`screenshots/QA-video-F2-${Date.now()}.png`;await p.screenshot({path:out+'/'+screenshot});
 json(out+'/logs/trace-viewer-validation.json',{results,servers,limitations:'Electron app:// and Code custom-protocol resources may not replay styling; desktop recording remains the visual source of truth. Review each screenshot before interpreting layout.'});
 json(out+'/logs/video-playback-validation.json',{status:'PASS',video,screenshot,file:step.video.path,seek:step.video.offsetSeconds});
 console.log(JSON.stringify({results,video,screenshot}));
}finally{json(runtime+'/trace-viewer-servers.json',servers);await b.browser.close()}
