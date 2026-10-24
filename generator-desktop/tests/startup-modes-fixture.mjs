// Actual catalog, chapter text and guide generation; mocked host/process IPC.
export const source=String.raw`
const {app,BrowserWindow,ipcMain}=require('electron');
const fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
const root=process.env.TSUKUHAKO_UI_ROOT;
app.setPath('userData',process.env.TSUKUHAKO_UI_PROFILE);
app.disableHardwareAcceleration();
const fixture=globalThis.fixture={platform:'linux',saved:{view:'create',lessonId:'F2',chapterId:'',scroll:0},helper:false,editorError:true,opened:[],openPayloads:[],distros:[{id:'aaaaaaaaaaaaaaaa',name:'Ubuntu A',generation:2,state:'Stopped'}]};
async function main(){
 const [{getTemplates},{nextSteps,startHere},{validatePayload}]=await Promise.all([
  import(pathToFileURL(root+'/generator/src/core/catalog.mjs').href),
  import(pathToFileURL(root+'/generator/src/core/next-steps.mjs').href),
  import(pathToFileURL(root+'/generator-desktop/security.mjs').href)
 ]);
 const catalog={...getTemplates(root),version:'fixture',defaultParent:'/home/student'};
 const index=JSON.parse(fs.readFileSync(root+'/curriculum/manifest.json','utf8'));
 const preparation=p=>({platform:fixture.platform,arch:'x64',distros:fixture.distros,helperReady:fixture.helper,target:fixture.helper?{distro:'Ubuntu A',distroId:p.distroId,user:'student',home:'/home/student'}:undefined,checkedAt:new Date().toISOString(),checks:[],dockerReady:true});
 const handlers={
  getLearningIndex:()=>index,readSettings:()=>fixture.saved,saveSettings:p=>(fixture.saved=p,{saved:true}),
  getTemplates:()=>catalog,getPreparation:()=>({platform:fixture.platform,arch:'x64',distros:fixture.distros}),
  checkPreparation:p=>preparation(p),prepareWSL:p=>(fixture.helper=true,preparation(p)),cancelPreparation:()=>({cancelled:true}),
  readChapter:p=>{const chapter=index.lessons.find(l=>l.id===p.lessonId).chapters.find(c=>c.id===p.chapterId);return{text:fs.readFileSync(root+'/curriculum/'+chapter.file,'utf8')}},
  readAsset:()=>'',openLessonLink:()=>({opened:false}),chooseParentDirectory:()=>'/home/student',exportDiagnostic:()=>({saved:false}),
  plan:p=>{
   fixture.last=undefined;if(!p){fixture.plan=undefined;return null}
   const t=catalog.templates.find(t=>t.id===p.templateId),ports=p.templateId==='I1'?{database:p.port??t.defaultPort}:{app:p.port??t.defaultPort};
   if(p.templateId==='S2'){const base=p.dbBase??54320;Object.assign(ports,{shadow:base,api:base+1,database:base+2,studio:base+3})}
   return fixture.plan={planId:'a'.repeat(64),request:p,destination:p.parent+'/'+p.folder,templateVersion:t.version,projectName:p.name||'study',ports,files:[],nextSteps:nextSteps(p.templateId,ports,{platform:fixture.platform})};
  },
  diagnose:()=>({generationReady:true,runtimeReady:true,checks:[]}),
  apply:()=>{const p=fixture.plan;return fixture.last={status:'created',destination:p.destination,templateId:p.request.templateId,templateVersion:p.templateVersion,projectName:p.projectName,ports:p.ports,readme:'README.md',startHere:'START_HERE.md',readmeText:'# README',nextSteps:p.nextSteps,guide:startHere(p,{platform:fixture.platform})}},
  openInVSCode:p=>{fixture.openPayloads.push(p===undefined?'no-payload':p);if(fixture.editorError)throw {code:'EDITOR_UNAVAILABLE',message:'VS Codeへ接続を渡せませんでした。',nextAction:'VS Codeの「フォルダーを開く」で保存先を選んでください。',details:{}};fixture.opened.push(fixture.last.destination);return{opened:true}}
 };
 for(const [name,fn]of Object.entries(handlers))ipcMain.handle('tsukuhako:'+name,(_event,input)=>{try{return{ok:true,value:fn(validatePayload(name,input))}}catch(error){return{ok:false,error:{code:error.code||'FIXTURE_ERROR',message:error.message||'fixture failed',nextAction:error.nextAction||'fixture failed',details:{}}}}});
 await app.whenReady();const window=new BrowserWindow({show:true,width:1150,height:900,webPreferences:{preload:root+'/generator-desktop/preload.cjs',contextIsolation:true,sandbox:true,nodeIntegration:false,backgroundThrottling:false}});await window.loadFile(root+'/generator-desktop/build/index.html');
}
main().catch(error=>{console.error(error);app.exit(1)});
app.on('window-all-closed',()=>app.quit());
`;
