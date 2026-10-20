import {chromium,expect} from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {setTimeout as delay} from 'node:timers/promises';
const root=path.resolve(import.meta.dirname,'..'),e=path.join(root,'validation/brand-0.3.0');
const id=process.argv[2];if(!['F2','S2'].includes(id))throw Error('F2/S2 required');
const folder=path.join(e,`runs/startup/${id} 学習`),output=path.join(e,'startup');
fs.mkdirSync(output,{recursive:true});
const env=Object.fromEntries(fs.readFileSync(path.join(folder,'.env'),'utf8').trim().split('\n').map(line=>line.split('=')));
const base=`http://localhost:${env.HOST_PORT}`,guide=fs.readFileSync(path.join(folder,'START_HERE.md'),'utf8');
expect(guide).toContain("'npm' 'run' 'dev'");
const started=spawnSync('docker',['compose','exec','-d','--user','node','app','sh','-c','exec npm run dev > /tmp/tsukuhako-030-dev.log 2>&1'],{cwd:folder,encoding:'utf8'});
expect(started.status,started.stderr).toBe(0);
let ready=false;for(let i=0;i<90;i++){try{if((await fetch(base,{signal:AbortSignal.timeout(2000)})).ok){ready=true;break}}catch{}await delay(400)}
expect(ready).toBe(true);
const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,chromiumSandbox:true});
const sha=data=>createHash('sha256').update(data).digest('hex');
const record={id,base,status:'PASS',project:env.PROJECT_NAME,guideSha256:sha(guide),
  origin:id==='F2'?'Final packaged GUI, actual window':'Final standalone CLI',
  scope:'Real generated project, Dev Container CLI and browser. VS Code UI NOT_RUN.'};
try{
  const page=await browser.newPage({viewport:{width:1200,height:900}});
  await page.goto(base);
  await expect(page).toHaveTitle(id==='F2'?'ツクハコ｜画面づくりの練習':'ツクハコ｜ローカル学習メモ');
  await expect(page.locator('body')).toContainText('ツクハコ');await expect(page.locator('body')).not.toContainText('明鏡');
  record.title=await page.title();
  if(id==='F2'){
    await expect(page.locator('footer')).toHaveText('学習用スターター · 0.1.1');
    const h1=page.getByRole('heading',{level:1});
    await expect(h1).toContainText('小さく変えて、');
    await page.screenshot({path:path.join(output,'F2-before.png'),fullPage:true});
    const file=path.join(folder,'app/page.tsx'),original=fs.readFileSync(file);
    const before='小さく変えて、<br />動きを確かめよう。',after='わたしの練習室';
    expect(original.toString()).toContain(before);expect(guide).toContain(after);expect(guide).toContain('元へ戻');
    try{
      fs.writeFileSync(file,original.toString().replace(before,after));
      await expect(h1).toHaveText(after,{timeout:20000});
      await page.screenshot({path:path.join(output,'F2-changed.png'),fullPage:true});
    }finally{fs.writeFileSync(file,original)}
    await expect(h1).toContainText('小さく変えて、',{timeout:20000});
    expect(fs.readFileSync(file)).toEqual(original);
    await page.screenshot({path:path.join(output,'F2-restored.png'),fullPage:true});
    record.firstExercise={file:'app/page.tsx',before,after,reflection:'PASS: HMR without reloading or restarting',restoration:'PASS: exact original bytes and heading',sourceSha256:sha(original)};
    record.guiEvidence=JSON.parse(fs.readFileSync(path.join(e,'gui-generated-f2.json')));
    expect(record.guiEvidence.guideSha256).toBe(sha(guide));
  }else{
    await expect(page.getByRole('heading',{name:'ローカル学習メモ',exact:true})).toBeVisible();
    const response=await fetch(base+'/api/notes');expect(response.status).toBe(200);
    const data=await response.json();expect(data.notes).toHaveLength(2);
    await expect(page.getByRole('button',{name:/^編集:/})).toHaveCount(2);
    await page.screenshot({path:path.join(output,'S2-brand.png'),fullPage:true});
    record.database='Fresh dedicated local Supabase, seed 2 notes loaded. Full CRUD suite not rerun for branding.';
  }
}catch(error){record.status='FAIL';record.error=error.stack;throw error}
finally{await browser.close();fs.writeFileSync(path.join(output,id+'-browser.json'),JSON.stringify(record,null,2)+'\n');console.log(JSON.stringify(record,null,2))}
