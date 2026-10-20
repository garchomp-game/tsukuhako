import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium, expect } from '../../tools/node_modules/@playwright/test/index.mjs';

const [id, workspace, url, mode='baseline'] = process.argv.slice(2);
const info = {
 F1: { file:'src/App.tsx', text:'ことばの鏡', path:'/' },
 S1: { file:'app/practice/page.tsx', text:'ことばを送ってみる', path:'/practice' },
 B1: { file:'app/api/health/route.ts', text:'{ status: "ok" }', path:'/api/health' },
}[id];
const source = join(workspace,info.file);
const marker = `${info.text}（変更確認）`;
const changed = mode === 'hmr' || mode === 'preserved';
if (id === 'B1') {
 await expect.poll(async () => { try { return (await fetch(url + info.path)).status; } catch { return 0; } }, {timeout:30000}).toBe(200);
 if (mode === 'hmr') await writeFile(source,(await readFile(source,'utf8')).replace(info.text,'{ status: "ok", lesson: "変更確認" }'));
 await expect.poll(async () => await (await fetch(url + info.path)).json(), {timeout:30000}).toEqual(changed ? {status:'ok',lesson:'変更確認'} : {status:'ok'});
 console.log(JSON.stringify({template:id,mode,url,observed:changed?'API source edit reflected without manual restart':'HTTP health healthy',status:'PASS'}));
} else {
 const browser = await chromium.launch({executablePath:'/usr/bin/google-chrome'});
 try {
  const page = await browser.newPage({viewport:{width:1280,height:900}});
  await expect.poll(async () => { try { return (await fetch(url + info.path)).status; } catch { return 0; } }, {timeout:30000}).toBe(200);
  await page.goto(url + info.path);
  if (mode === 'hmr') {
   await expect(page.getByRole('heading',{name:info.text,exact:true})).toBeVisible();
   await page.evaluate(() => { window.__hmrPageProof='same-browser-document'; });
   await writeFile(source,(await readFile(source,'utf8')).replace(info.text,marker));
  }
  await expect(page.getByRole('heading',{name:changed?marker:info.text,exact:true})).toBeVisible({timeout:30000});
  if (mode === 'hmr') assert.equal(await page.evaluate(()=>window.__hmrPageProof),'same-browser-document');
  if (id === 'F1') { await page.getByLabel('表示することば').fill('こんにちは、明鏡。'); await expect(page.getByTestId('preview')).toHaveText('こんにちは、明鏡。'); }
  if (id === 'S1') { await page.getByLabel('送信することば').fill('  こんにちは、明鏡。  '); await page.getByRole('button',{name:'プレビューを送信'}).click(); await expect(page.getByTestId('preview-result')).toHaveText('こんにちは、明鏡。'); }
  await mkdir('validation/frontend-api/screenshots',{recursive:true});
  await page.screenshot({path:`validation/frontend-api/screenshots/${id}-${mode}.png`,fullPage:true});
  console.log(JSON.stringify({template:id,mode,url,browser:await browser.version(),observed:changed?'Edited heading present; actual input action succeeded':'UI input and display succeeded',hmrSameDocument:mode==='hmr',status:'PASS'}));
 } finally { await browser.close(); }
}
