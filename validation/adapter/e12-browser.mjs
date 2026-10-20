import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium, expect } from '../../tools/node_modules/@playwright/test/index.mjs';

const source = fileURLToPath(new URL('./runs/単一Next fixture/app/page.tsx', import.meta.url));
const original = await readFile(source, 'utf8');
const before = '小さく変えて、';
const after = '既存環境の変更を確認、';
assert.ok(original.includes(before));
const url = 'http://localhost:3091';
const started = Date.now();
await expect.poll(async () => { try { return (await fetch(url)).status; } catch { return 0; } }, { timeout: 45000 }).toBe(200);
const readyMs = Date.now() - started;
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
let page;
try {
  page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(url);
  await expect(page.getByRole('heading', { level: 1 })).toContainText(before);
  await page.evaluate(() => { window.__adapterHmrProof = 'same-document'; });
  await writeFile(source, original.replace(before, after));
  await expect(page.getByRole('heading', { level: 1 })).toContainText(after, { timeout: 30000 });
  assert.equal(await page.evaluate(() => window.__adapterHmrProof), 'same-document');
  await page.screenshot({ path: fileURLToPath(new URL('./e12-hmr.png', import.meta.url)), fullPage: true });
  await writeFile(source, original);
  await expect(page.getByRole('heading', { level: 1 })).toContainText(before, { timeout: 30000 });
  await page.getByRole('link', { name: '練習画面へ →' }).click();
  await expect(page).toHaveURL(`${url}/practice`);
  await page.getByLabel('つくりたいもの').fill('既存アプリの確認 😀');
  await expect(page.getByRole('status')).toContainText('既存アプリの確認 😀');
  await page.getByRole('button', { name: 'クリア' }).click();
  await expect(page.getByLabel('つくりたいもの')).toHaveValue('');
  console.log(JSON.stringify({ id: 'E12', status: 'PASS', url, browser: await browser.version(), readyMs, sameDocumentHmr: true, sourceRestored: true, interaction: 'navigation, Unicode input, clear' }));
} finally {
  await writeFile(source, original);
  await browser.close();
}
