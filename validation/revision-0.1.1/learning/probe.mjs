import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, expect } from '../../../tools/node_modules/@playwright/test/index.mjs';

const [template, baseURL, mode] = process.argv.slice(2);
const observations = [];
const startedAt = new Date().toISOString();
const endpoint = mode === 'api' ? '/api/health' : '/';
await expect.poll(async () => {
  try { return (await fetch(baseURL+endpoint)).status; } catch { return 0; }
}, {timeout:60000}).toBe(200);

if (mode === 'api') {
  const health = await fetch(baseURL+'/api/health');
  assert.equal(health.status, 200);
  assert.deepEqual(await health.json(), {status:'ok'});
  const normal = await fetch(baseURL+'/api/preview', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({text:'  こんにちは  '})});
  assert.equal(normal.status, 200);
  assert.deepEqual(await normal.json(), {text:'こんにちは',length:5});
  const empty = await fetch(baseURL+'/api/preview', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({text:'   '})});
  assert.equal(empty.status, 400);
  assert.equal((await empty.json()).error.code, 'INVALID_INPUT');
  observations.push('health 200 with status only', 'real preview POST 200 with normalized text and length 5', 'whitespace input 400 INVALID_INPUT');
} else {
  const browser = await chromium.launch({executablePath:'/usr/bin/google-chrome'});
  try {
    observations.push('browser '+browser.version());
    const page = await browser.newPage({viewport:{width:1280,height:900}});
    await page.goto(baseURL);
    if (template === 'S1') {
      await page.getByRole('link',{name:'練習画面へ'}).click();
      await expect(page).toHaveURL(/\/practice$/);
      await page.getByLabel('送信することば').fill('  こんにちは  ');
      const received = page.waitForResponse(r=>r.url().endsWith('/api/preview') && r.request().method()==='POST');
      await page.getByRole('button',{name:'プレビューを送信'}).click();
      const response = await received;
      assert.equal(response.status(),200);
      assert.deepEqual(await response.json(),{text:'こんにちは',length:5});
      await expect(page.getByTestId('preview-result')).toHaveText('こんにちは');
      await expect(page.getByText('5 コードポイント',{exact:true})).toBeVisible();
      observations.push('navigation to /practice', 'real browser POST 200 and normalized preview', 'length 5 visible');
      await page.getByRole('button',{name:'クリア',exact:true}).click();
      await expect(page.getByLabel('送信することば')).toHaveValue('');
      await expect(page.getByTestId('preview-result')).toHaveCount(0);
      await page.getByRole('button',{name:'プレビューを送信'}).click();
      await expect(page.getByRole('region',{name:'プレビューの練習'}).getByRole('alert')).toHaveText('空白以外の文字を入力してください');
      await page.getByLabel('送信することば').fill('再送信');
      await page.getByRole('button',{name:'プレビューを送信'}).click();
      await expect(page.getByTestId('preview-result')).toHaveText('再送信');
      observations.push('clear removes input and result', 'empty input error then successful retry');
    } else {
      await expect(page.getByRole('heading',{name:'ことばの鏡'})).toBeVisible();
      await page.getByLabel('表示することば').fill('こんにちは、明鏡。');
      await expect(page.getByTestId('preview')).toHaveText('こんにちは、明鏡。');
      await page.getByRole('button',{name:'クリア',exact:true}).click();
      await expect(page.getByLabel('表示することば')).toHaveValue('');
      await page.getByLabel('表示することば').fill('再読み込み前');
      await page.reload();
      await expect(page.getByLabel('表示することば')).toHaveValue('');
      observations.push('input immediately reflected', 'clear resets input', 'reload resets state');
    }
    const directory = join(dirname(fileURLToPath(import.meta.url)),'screenshots');
    await mkdir(directory,{recursive:true});
    await page.screenshot({path:join(directory,template+'-assembled.png'),fullPage:true});
    if (template === 'S1') {
      await page.getByRole('link',{name:'← トップへ'}).click();
      await expect(page).toHaveURL(/\/$/);
      observations.push('return to home');
    }
  } finally { await browser.close(); }
}
console.log(JSON.stringify({template,baseURL,mode,startedAt,endedAt:new Date().toISOString(),result:'PASS',observations}));
