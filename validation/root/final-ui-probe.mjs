import assert from 'node:assert/strict';
import { chromium, expect } from '../../tools/node_modules/@playwright/test/index.mjs';
const [id, rawPort] = process.argv.slice(2);
const url = `http://localhost:${rawPort}`;
await expect.poll(async () => { try { return (await fetch(url + (id === 'B1' ? '/api/health' : '/'))).status; } catch { return 0; } }, { timeout: 45000 }).toBe(200);
if (id === 'B1') {
  assert.deepEqual(await (await fetch(url + '/api/health')).json(), {status:'ok'});
  const r = await fetch(url + '/api/preview', {method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({text:'  最終ZIP😀  '})});
  assert.equal(r.status,200); assert.deepEqual(await r.json(), {text:'最終ZIP😀',length:6});
} else {
  const browser = await chromium.launch({executablePath:'/usr/bin/google-chrome'});
  try {
    const page = await browser.newPage();
    await page.goto(url + (id === 'S1' || id === 'F2' ? '/practice' : '/'));
    if (id === 'F1') { await page.getByLabel('表示することば').fill('最終ZIPの入力'); await expect(page.getByTestId('preview')).toHaveText('最終ZIPの入力'); }
    if (id === 'S1') { await page.getByLabel('送信することば').fill('  最終ZIPの入力  '); await page.getByRole('button',{name:'プレビューを送信'}).click(); await expect(page.getByTestId('preview-result')).toHaveText('最終ZIPの入力'); }
    if (id === 'F2') { await page.getByLabel('つくりたいもの').fill('最終ZIPの入力'); await expect(page.getByRole('status')).toContainText('最終ZIPの入力'); await page.getByRole('button',{name:'クリア'}).click(); await expect(page.getByLabel('つくりたいもの')).toHaveValue(''); }
  } finally { await browser.close(); }
}
console.log(JSON.stringify({id,url,status:'PASS',scope:'Final canonical ZIP actual main function / host Chrome'}));
