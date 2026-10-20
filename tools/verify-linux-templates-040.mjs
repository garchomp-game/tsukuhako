import {chromium,expect} from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {setTimeout as delay} from 'node:timers/promises';
import {createHash} from 'node:crypto';
const run=promisify(execFile),root=path.resolve(import.meta.dirname,'..');
const out=root+'/validation/learning-0.4.0',selected=process.argv[2];const results=selected&&fs.existsSync(out+'/linux-template-startup.json')?JSON.parse(fs.readFileSync(out+'/linux-template-startup.json')).filter(r=>r.id!==selected):[];
for(const id of ['F1','B1','S1','I1'].filter(id=>!selected||id===selected)){
  const project=out+(id==='F1'?'/runs/f1-013/':'/runs/gui-verified/')+id+' IPC.dir 日本語 & literal';
  const result={id,status:'RUNNING',steps:[],scope:'0.4.0 shared core (F1 revised CLI output; others packaged GUI output); Linux Mint x64; real Dev Container CLI, source edit and browser/SQL. VS Code UI not exercised for this row.'};
  const command=async(label,exe,args)=>{
    const started=Date.now();
    const r=await run(exe,args,{cwd:project,timeout:600000,maxBuffer:4*1024*1024});
    result.steps.push({label,status:'PASS',elapsedMs:Date.now()-started});
    return r.stdout;
  };
  const inside=(label,args)=>command(label,root+'/tools/node_modules/.bin/devcontainer',['exec','--workspace-folder',project,...args]);
  let browser;
  try{
    await command('Dev Container up + postCreate dependencies',root+'/tools/node_modules/.bin/devcontainer',['up','--workspace-folder',project]);
    if(id==='I1'){
      await inside('DB setup',['bash','scripts/db.sh','setup']);
      await inside('DB check',['bash','scripts/db.sh','check']);
      const file=project+'/sql/practice.sql',original=fs.readFileSync(file,'utf8');
      expect(await inside('SQL original',['bash','scripts/db.sh','query','sql/practice.sql'])).toContain('SQLの練習');
      try{
        fs.writeFileSync(file,original.replace('SQLの練習','在庫を調べる'));
        expect(await inside('SQL changed',['bash','scripts/db.sh','query','sql/practice.sql'])).toContain('在庫を調べる');
      }finally{fs.writeFileSync(file,original)}
      expect(await inside('SQL restored',['bash','scripts/db.sh','query','sql/practice.sql'])).toContain('SQLの練習');
      result.restoredSha256=createHash('sha256').update(fs.readFileSync(file)).digest('hex');
    }else{
      await inside('npm test',['npm','test']);
      await inside('npm run check',['npm','run','check']);
      await inside('npm run build',['npm','run','build']);
      await command('Start development server','docker',['compose','exec','-d','--user','node','app','npm','run','dev']);
      const base='http://localhost:3865',url=base+(id==='B1'?'/api/health':id==='S1'?'/practice':'/');
      let ready=false;
      for(let n=0;n<90;n++){try{ready=(await fetch(url,{signal:AbortSignal.timeout(1500)})).ok;if(ready)break}catch{}await delay(400)}
      expect(ready).toBe(true);
      browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,chromiumSandbox:true});
      const page=await browser.newPage({viewport:{width:1200,height:900}});await page.goto(url);
      const source=id==='F1'?'src/App.tsx':id==='B1'?'app/api/health/route.ts':'app/practice/page.tsx';
      const file=project+'/'+source,original=fs.readFileSync(file,'utf8');
      const before=id==='F1'?'表示することば':id==='B1'?'status: "ok"':'ことばを送ってみる';
      const after=id==='F1'?'今日のことば':id==='B1'?'status: "ok", lesson: "preview"':'今日の便り';
      const changed=original.replace(before,after);expect(changed).not.toBe(original);
      const check=async modified=>{
        if(id==='B1'){await expect.poll(async()=>await(await fetch(url)).json(),{timeout:20000}).toEqual(modified?{status:'ok',lesson:'preview'}:{status:'ok'});await page.reload()}
        else await expect(page.getByText(modified?after:before,{exact:true})).toBeVisible({timeout:20000});
      };
      await check(false);
      try{fs.writeFileSync(file,changed);await check(true);await page.screenshot({path:out+'/screenshots/'+id+'-changed.png'})}
      finally{fs.writeFileSync(file,original)}
      await check(false);await page.screenshot({path:out+'/screenshots/'+id+'-restored.png'});
      result.steps.push({label:'Original → source change → browser/API reflection → byte restoration',status:'PASS'});
      result.restoredSha256=createHash('sha256').update(fs.readFileSync(file)).digest('hex');
    }
    result.status='PASS';
  }catch(error){result.status='FAIL';result.error=(String(error)+'\n'+(error.stdout||'')+'\n'+(error.stderr||'')).slice(-6000).replaceAll(root,'<PROJECT>')}
  finally{
    await browser?.close();
    await command('Stop/remove only this test Compose project; retain volumes','docker',['compose','down']).catch(e=>{result.cleanupError=String(e).slice(0,500)});
    results.push(result);fs.writeFileSync(out+'/linux-template-startup.json',JSON.stringify(results,null,2)+'\n');console.log(id,result.status);
  }
}
if(results.some(r=>r.status!=='PASS'))process.exitCode=1;
