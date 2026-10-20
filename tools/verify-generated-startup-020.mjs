import { chromium, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
const root=path.resolve(import.meta.dirname,'..');
const id=process.argv[2];if(!['F2','S2'].includes(id))throw Error('F2/S2 required');
const folder=path.join(root,`validation/generator-0.2.0/runs/startup/${id} 学習`);
const output=path.join(root,'validation/generator-0.2.0/startup');fs.mkdirSync(output,{recursive:true});
const base=`http://localhost:${id==='F2'?3661:3664}`;
const command=spawnSync('docker',['compose','exec','-d','--user','node','app','sh','-c','exec node node_modules/next/dist/bin/next dev --hostname 0.0.0.0 --port 3000 > /tmp/generator-020-dev.log 2>&1'],{cwd:folder,encoding:'utf8'});if(command.status!==0)throw Error(command.stderr);
let ready=false;for(let n=0;n<90;n++){try{if((await fetch(base,{signal:AbortSignal.timeout(2000)})).ok){ready=true;break}}catch{}await delay(400)}if(!ready)throw Error('HTTP timeout');
const records=[];
const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,chromiumSandbox:true});
try{
 const page=await browser.newPage({viewport:{width:1200,height:900}});await page.goto(base);
 if(id==='F2'){
  await expect(page.getByRole('heading',{level:1})).toContainText('小さく変えて');
  const source=path.join(folder,'app/page.tsx'),original=fs.readFileSync(source,'utf8');
  try{fs.writeFileSync(source,original.replace('小さく変えて、','生成した環境から、'));await expect(page.getByRole('heading',{level:1})).toContainText('生成した環境から',{timeout:20000});records.push('Source edit reflected in running Dev Container by HMR');}finally{fs.writeFileSync(source,original)}
  await expect(page.getByRole('heading',{level:1})).toContainText('小さく変えて',{timeout:15000});
  await page.getByRole('link',{name:'練習画面へ'}).click();await page.getByLabel('つくりたいもの').fill('明鏡から始めるノート');await expect(page.getByRole('status')).toHaveText('明鏡から始めるノート');
  await page.getByRole('button',{name:'クリア'}).click();await expect(page.getByLabel('つくりたいもの')).toHaveValue('');records.push('Two-page navigation, input and clear');
 }else{
  await expect(page.getByRole('heading',{name:'ローカル学習メモ'})).toBeVisible();
  const initial=await(await fetch(base+'/api/notes')).json();expect(initial.notes).toHaveLength(2);
  const text='ジェネレーター0.2.0の保存確認 📝';await page.getByLabel('本文',{exact:true}).fill('　'+text+'　');const post=page.waitForResponse(r=>r.request().method()==='POST'&&r.url().endsWith('/api/notes'));await page.getByRole('button',{name:'保存する',exact:true}).click();const response=await post;expect(response.status()).toBe(201);const {note}=await response.json();expect(note.body).toBe(text);
  await page.getByRole('button',{name:`編集: ${text}`,exact:true}).click();await page.getByLabel('本文',{exact:true}).fill(text+' 更新済み');const update=page.waitForResponse(r=>r.request().method()==='PATCH');await page.getByRole('button',{name:'更新する',exact:true}).click();expect((await update).status()).toBe(200);await page.reload();await expect(page.getByText(text+' 更新済み',{exact:true})).toBeVisible();
  await page.screenshot({path:path.join(output,'S2-persisted.png'),fullPage:true});
  const deletion=page.waitForResponse(r=>r.request().method()==='DELETE');await page.getByRole('button',{name:`削除: ${text} 更新済み`,exact:true}).click();expect((await deletion).status()).toBe(204);await page.reload();expect((await(await fetch(base+'/api/notes')).json()).notes).toHaveLength(2);records.push('Fresh database seed2; browser Unicode create201/trim/update200/reload persistence/delete204; seed2 retained');
 }
 await page.screenshot({path:path.join(output,`${id}-desktop.png`),fullPage:true});await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:path.join(output,`${id}-mobile.png`),fullPage:true});
 const result={status:'PASS',id,base,records,screenshots:true,scope:'Final standalone generator output, real Dev Container CLI and browser; VS Code UI is NOT_RUN'};fs.writeFileSync(path.join(output,`${id}-browser.json`),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
}finally{await browser.close()}
