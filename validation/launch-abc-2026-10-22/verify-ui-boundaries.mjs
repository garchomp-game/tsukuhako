import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../../', import.meta.url));
const { chromium, expect } = createRequire(process.env.PLAYWRIGHT_PACKAGE || path.join(root, 'tools/package.json'))('@playwright/test');
const base = process.env.PREVIEW_URL || 'http://127.0.0.1:5183';
assert.ok(['127.0.0.1', 'localhost'].includes(new URL(base).hostname));
const browser = await chromium.launch({ headless: true, channel: process.env.BROWSER_CHANNEL || 'chrome' });
const checks = [];
try {
  const page = await browser.newPage({ viewport: { width: 360, height: 800 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(base + '/start');
  await page.getByRole('heading', { name: 'ツクハコを使い始める前に' }).waitFor();
  await expect(page.locator('main .waiting', { hasText: 'Brainの商品記事（設定待ち）' })).toBeVisible();
  assert.equal(await page.locator('main a[href=""]').count(), 0);
  assert.equal(await page.getByRole('link', { name: 'Brainの商品記事' }).count(), 0);
  await page.getByRole('link', { name: '準備の確認ガイド', exact: true }).click();
  await page.waitForURL(base + '/guides/setup-check');
  await page.locator('main h1').waitFor();
  checks.push({ name: 'Unconfigured Brain destination is visibly pending and not clickable; the configured local guide works', result: 'PASS' });

  await page.route('**/api/confirm/status?*', route => route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: '確認ページの通信失敗を試しています。' }) }), { times: 1 });
  await page.goto(base + '/mail/confirm?token=' + 'a'.repeat(64));
  await page.getByRole('heading', { name: '確認できませんでした', exact: true }).waitFor();
  await expect(page.getByRole('alert')).toContainText('通信失敗');
  await page.getByRole('button', { name: 'もう一度確認する', exact: true }).click();
  await page.getByRole('heading', { name: 'このリンクは使えません', exact: true }).waitFor();
  checks.push({ name: 'A confirmation status transport error leaves loading, explains the problem, and can be retried', result: 'PASS' });
  assert.deepEqual(errors, []);
  checks.push({ name: 'Both recovery paths complete without unhandled browser errors', result: 'PASS' });
  const result = { category: 'LOCAL_BROWSER_FIXTURE', result: 'PASS', browser: browser.version(), checks, subscriptionMutationPerformed: false };
  await writeFile(path.join(root, 'validation/launch-abc-2026-10-22/logs/ui-boundaries.json'), JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify({ result: 'PASS', checks: checks.length }));
} finally { await browser.close(); }
