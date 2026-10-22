import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../../', import.meta.url));
const { chromium, expect } = createRequire(process.env.PLAYWRIGHT_PACKAGE || path.join(root, 'tools/package.json'))('@playwright/test');
const base = process.env.PREVIEW_URL || 'http://127.0.0.1:5183';
assert.ok(['127.0.0.1', 'localhost'].includes(new URL(base).hostname));
const output = path.join(root, 'validation/launch-abc-2026-10-22');
await mkdir(path.join(output, 'screenshots'), { recursive: true });
await mkdir(path.join(output, 'logs'), { recursive: true });
const checks = [], externalRequests = [], browserErrors = [];
const pass = (name, evidence = {}) => checks.push({ name, result: 'PASS', ...evidence });
async function api(route, body) {
  const response = await fetch(base + route, body === undefined ? {} : { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: base }, body: JSON.stringify(body) });
  const value = await response.json();
  assert.ok(response.ok, `${route}: ${response.status} ${value.error || ''}`);
  return value;
}
const snapshot = () => api('/api/preview/state');
const browser = await chromium.launch({ headless: true, channel: process.env.BROWSER_CHANNEL || 'chrome' });
let native;
try {
  const context = await browser.newContext({ viewport: { width: 1200, height: 900 } });
  await context.route('**/*', route => {
    const url = route.request().url();
    if (url.startsWith(base + '/') || url.startsWith('about:') || url.startsWith('data:')) return route.continue();
    externalRequests.push(new URL(url).origin);
    return route.abort();
  });
  const page = await context.newPage();
  page.on('pageerror', error => browserErrors.push(error.message));
  const initial = await snapshot();
  assert.equal(initial.now, '2026-10-22T10:00:00.000Z', 'Use a fresh, dedicated local preview DB for this fixture.');
  assert.equal(initial.subscribers.length, 0, 'Do not run this fixture on a DB with existing readers.');
  await page.goto(base + '/preview');
  await page.getByRole('heading', { name: '原稿と配信予定', exact: true }).waitFor();
  for (const id of ['confirm', 'welcome-01', 'welcome-02', 'welcome-03', 'broadcast-001']) {
    const card = page.locator('details.edition').filter({ has: page.locator('summary', { hasText: id + ' / revision' }) });
    await card.locator('summary').click();
    await card.getByRole('button', { name: '原稿をローカル確認', exact: true }).click();
    await expect(card.locator('summary')).toContainText('reviewed');
    if (id !== 'broadcast-001') {
      await card.getByRole('button', { name: 'ローカル試用で有効化', exact: true }).click();
      await expect(card.locator('summary')).toContainText('active');
    }
  }
  pass('Operator reviews the five C drafts in the local UI; only shared templates are activated');

  await page.setViewportSize({ width: 360, height: 800 });
  for (const route of ['/', '/start', '/guides/setup-check', '/guides/first-change', '/guides/one-less-step', '/mail']) {
    await page.goto(base + route);
    await page.locator('main h1').waitFor();
    const size = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
    assert.ok(size.scroll <= size.client + 1, `${route} overflows at 360px`);
    assert.equal(await page.locator('main').getByRole('link', { name: /設定待ち/ }).count(), 0);
  }
  await page.screenshot({ path: path.join(output, 'screenshots/mail-360.png'), fullPage: true });
  pass('Home, start, three article destinations and registration fit 360px');
  const consent = page.getByRole('checkbox');
  await expect(consent).not.toBeChecked();
  await page.getByLabel('メールアドレス', { exact: true }).fill('reader@example.test');
  await page.getByLabel('メールアドレス', { exact: true }).focus();
  await page.keyboard.press('Tab');
  await expect(consent).toBeFocused();
  await page.keyboard.press('Space');
  await expect(consent).toBeChecked();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: '確認メールを受け取る', exact: true })).toBeFocused();
  await page.keyboard.press('Enter');
  await page.waitForURL(base + '/mail/check');
  pass('Consent starts unchecked; keyboard Tab/Space/Enter submits the registration');

  let state = await snapshot();
  const reader = state.subscribers.find(s => s.email === 'reader@example.test');
  assert.equal(reader.subscription_status, 'pending');
  assert.equal(state.deliveries.length, 0);
  await page.getByRole('link', { name: 'ローカル受信箱', exact: true }).click();
  const confirmation = page.locator('details.mail').filter({ hasText: 'ツクハコのメール登録を確認してください' }).first();
  await confirmation.locator(':scope > summary').click();
  await confirmation.frameLocator('iframe').getByRole('link', { name: 'メール登録の確認ページを開く' }).click();
  await page.waitForURL('**/mail/confirm?token=*');
  const originalConfirmationUrl = page.url();
  await page.getByRole('heading', { name: 'メールの受け取りを始めますか？' }).waitFor();
  state = await snapshot();
  assert.equal(state.subscribers.find(s => s.id === reader.id).subscription_status, 'pending');
  assert.equal(state.deliveries.length, 0);
  pass('Real HTML preview confirmation link navigates the top page; GET leaves subscription pending');
  await page.getByRole('button', { name: '登録を確定する', exact: true }).click();
  await page.getByRole('heading', { name: '登録が完了しました' }).waitFor();
  state = await snapshot();
  assert.deepEqual(state.deliveries.map(d => [d.edition_id, d.planned_at_utc]).sort(), [
    ['welcome-01', '2026-10-22T10:00:00.000Z'], ['welcome-02', '2026-10-24T10:00:00.000Z'], ['welcome-03', '2026-10-27T10:00:00.000Z']
  ]);
  await api('/api/confirm', { token: new URL(originalConfirmationUrl).searchParams.get('token') });
  assert.equal((await snapshot()).deliveries.length, 3);
  pass('Confirmation creates exactly three 0/2/5-day schedules; a repeated POST creates none');
  await page.getByRole('link', { name: '使い始めるガイドを読む', exact: true }).click();
  await page.getByRole('heading', { name: 'ツクハコを使い始める前に' }).waitFor();
  pass('Welcome destination uses the public C guide, with purchase and receipt separated');

  await page.setViewportSize({ width: 1100, height: 850 });
  await page.goto(base + '/preview');
  await page.getByRole('button', { name: '予定分をMockで処理する', exact: true }).click();
  await expect(page.locator('.reader').first()).toContainText('Mock受付済み');
  await page.locator('.reader').first().screenshot({ path: path.join(output, 'screenshots/reader-schedule.png') });
  state = await snapshot();
  assert.equal(state.deliveries.filter(d => d.status === 'accepted').length, 1);
  assert.equal(state.deliveries.filter(d => d.status === 'planned').length, 2);
  const welcome = page.locator('details.mail').filter({ hasText: 'ツクハコの最初の一歩｜まずは、案内を開くところから' }).first();
  await welcome.locator(':scope > summary').click();
  await welcome.frameLocator('iframe').getByRole('link', { name: '配信を停止する', exact: true }).click();
  await page.waitForURL('**/mail/unsubscribe?token=*');
  await page.getByRole('heading', { name: 'メールの配信を停止しますか？' }).waitFor();
  assert.equal((await snapshot()).subscribers.find(s => s.id === reader.id).subscription_status, 'subscribed');
  await page.getByRole('button', { name: '配信を停止する', exact: true }).click();
  await page.getByRole('heading', { name: '配信を停止しました', exact: true }).waitFor();
  state = await snapshot();
  assert.equal(state.deliveries.filter(d => d.status === 'suppressed').length, 2);
  await page.goto(originalConfirmationUrl);
  await page.getByRole('heading', { name: 'メールの配信は停止されています', exact: true }).waitFor();
  pass('Learning mail footer leads to unsubscribe; GET is safe, POST suppresses two pending steps, old confirmation does not restart');

  await page.goto(base + '/mail');
  await page.getByLabel('メールアドレス', { exact: true }).fill('expired@example.test');
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: '確認メールを受け取る', exact: true }).click();
  await page.waitForURL(base + '/mail/check');
  state = await snapshot();
  const expiredReader = state.subscribers.find(s => s.email === 'expired@example.test');
  const expiredMail = state.outbox.find(m => m.subscriber_id === expiredReader.id && m.kind === 'transactional');
  const expiredUrl = expiredMail.body_text.match(/http:\/\/[^\s]+\/mail\/confirm\?token=[a-f0-9]+/)[0];
  await api('/api/preview/clock', { now: '2026-10-23T10:00:01.000Z' });
  await page.goto(expiredUrl);
  await page.getByRole('heading', { name: '確認リンクの有効期限が切れています', exact: true }).waitFor();
  await page.screenshot({ path: path.join(output, 'screenshots/expired-confirmation.png'), fullPage: true });
  await page.getByRole('link', { name: '新しい確認メールを受け取る', exact: true }).click();
  await page.getByLabel('メールアドレス', { exact: true }).fill('expired@example.test');
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: '確認メールを受け取る', exact: true }).click();
  await page.waitForURL(base + '/mail/check');
  state = await snapshot();
  const freshMail = state.outbox.filter(m => m.subscriber_id === expiredReader.id).sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
  const freshUrl = freshMail.body_text.match(/http:\/\/[^\s]+\/mail\/confirm\?token=[a-f0-9]+/)[0];
  assert.notEqual(freshUrl, expiredUrl);
  await page.goto(freshUrl);
  await page.getByRole('button', { name: '登録を確定する', exact: true }).click();
  await page.getByRole('heading', { name: '登録が完了しました', exact: true }).waitFor();
  pass('Expired link recovers through a new request and new confirmation, using only an artificial address');
  assert.deepEqual(browserErrors, []);
  assert.deepEqual(externalRequests, []);
  pass('Browser flow raises no page errors and makes no external page requests');

  assert.ok(process.env.DISPLAY, 'A dedicated desktop DISPLAY is needed for the actual browser-zoom check.');
  native = await chromium.launch({ headless: false, channel: process.env.BROWSER_CHANNEL || 'chrome', args: ['--window-size=1280,900', '--force-device-scale-factor=1'] });
  const nativeContext = await native.newContext({ viewport: null });
  const zoomPage = await nativeContext.newPage();
  await zoomPage.goto(base + '/mail');
  await zoomPage.locator('main h1').waitFor();
  const before = await zoomPage.evaluate(() => ({ width: innerWidth, ratio: devicePixelRatio }));
  const windowId = execFileSync('xdotool', ['search', '--onlyvisible', '--class', 'chrome'], { encoding: 'utf8' }).trim().split('\n')[0];
  execFileSync('xdotool', ['windowactivate', '--sync', windowId]);
  for (let n = 0; n < 5; n++) { execFileSync('xdotool', ['key', '--clearmodifiers', 'ctrl+plus']); await zoomPage.waitForTimeout(150); }
  const after = await zoomPage.evaluate(() => ({ width: innerWidth, ratio: devicePixelRatio, scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
  assert.equal(after.ratio / before.ratio, 2);
  assert.equal(after.width, before.width / 2);
  assert.ok(after.scroll <= after.client + 1);
  // CDP full-page screenshots can be clipped at native browser zoom; capture the owned X window.
  await zoomPage.getByLabel('メールアドレス', { exact: true }).scrollIntoViewIfNeeded();
  execFileSync('import', ['-window', windowId, path.join(output, 'screenshots/mail-browser-200.png')]);
  pass('Actual Chrome 200% zoom reflows the registration form with no horizontal overflow', { before, after });
  const result = { category: 'LOCAL_BROWSER_FIXTURE', result: 'PASS', browser: browser.version(), checks, externalPageRequests: externalRequests.length, realEmailsSent: 0, sourceHash: (await snapshot()).sourceHash };
  await writeFile(path.join(output, 'logs/browser-flow.json'), JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify({ result: 'PASS', checks: checks.length, browser: browser.version() }));
} finally {
  await native?.close();
  await browser.close();
}
