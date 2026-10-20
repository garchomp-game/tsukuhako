// 0.2.1 changes shared version/catalog resources. Exercise the relocated release.
import { _electron as electron, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const root = path.resolve(import.meta.dirname, '..');
const evidence = path.join(root, 'validation/revision-0.2.1');
const output = path.join(evidence, 'gui');
const base = path.join(evidence, 'runs/gui-relocated/別の 場所');
expect(fs.existsSync(base)).toBe(false);
fs.mkdirSync(base, { recursive: true });
fs.mkdirSync(output, { recursive: true });
const archive = path.join(root, 'dist/meikyo-generator-linux-x64-0.2.1.tar.gz');
const extracted = spawnSync('tar', ['-xzf', archive, '-C', base], { encoding: 'utf8' });
expect(extracted.status, extracted.stderr).toBe(0);
const packaged = path.join(base, 'meikyo-generator-linux-x64-0.2.1');
const cli = path.join(evidence, 'runs/cli-relocated/別の 場所/meikyo-generator-cli-0.2.1-linux/generator/cli.mjs');
const bin = path.join(base, 'bin');
fs.mkdirSync(bin);
fs.symlinkSync('/usr/bin/cksum', path.join(bin, 'cksum'));
const env = { ...process.env, PATH: bin, NODE_PATH: '', NODE_OPTIONS: '' };
delete env.ELECTRON_RUN_AS_NODE;
const sha = data => createHash('sha256').update(data).digest('hex');
const records = [], errors = [];
const add = (id, detail) => records.push({ id, status: 'PASS', ...detail });
function snapshot(dir) {
  const files = {};
  function walk(parent) {
    for (const entry of fs.readdirSync(parent, { withFileTypes: true })) {
      const file = path.join(parent, entry.name);
      if (entry.isDirectory()) walk(file);
      else files[path.relative(dir, file)] = sha(fs.readFileSync(file));
    }
  }
  walk(dir);
  return files;
}
const app = await electron.launch({
  executablePath: path.join(packaged, 'meikyo-generator'),
  args: [`--user-data-dir=${path.join(base, 'profile')}`],
  env, chromiumSandbox: true, timeout: 30000,
});
let page;
try {
  page = await app.firstWindow();
  page.on('pageerror', e => errors.push(e.message));
  await expect(page.getByRole('button', { name: '保存先へ進む →' })).toBeEnabled();
  await expect(page.locator('.version')).toContainText('0.2.1');
  const metadata = await app.evaluate(({ app, BrowserWindow }) => ({
    version: app.getVersion(),
    electron: process.versions.electron,
    node: process.versions.node,
    appPath: app.getAppPath(),
    visible: BrowserWindow.getAllWindows()[0].isVisible(),
    preferences: BrowserWindow.getAllWindows()[0].webContents.getLastWebPreferences(),
    arguments: process.argv,
  }));
  expect(metadata.version).toBe('0.2.1');
  expect(metadata.visible).toBe(true);
  expect(metadata.appPath).toBe(path.join(packaged, 'resources/app'));
  expect(metadata.preferences.sandbox).toBe(true);
  expect(metadata.preferences.contextIsolation).toBe(true);
  expect(metadata.preferences.nodeIntegration).toBe(false);
  expect(metadata.arguments).not.toContain('--no-sandbox');
  const exposed = await page.evaluate(() => ({
    require: typeof window.require, process: typeof window.process, methods: Object.keys(window.meikyo).sort(),
  }));
  expect(exposed.require).toBe('undefined');
  expect(exposed.process).toBe('undefined');
  expect(exposed.methods).toEqual(['apply', 'chooseParentDirectory', 'diagnose', 'getTemplates', 'openInVSCode', 'plan']);
  const catalog = await page.evaluate(() => window.meikyo.getTemplates());
  expect(catalog.ok).toBe(true);
  expect(catalog.value.version).toBe('0.2.1');
  add('packaged-version-and-isolation', { metadata, exposed, hostPathContains: ['cksum'] });
  await page.screenshot({ path: path.join(output, '01-purpose.png'), fullPage: true });

  for (const id of ['F1', 'F2', 'B1', 'S1', 'S2', 'I1']) {
    const folder = `${id} planのみ`, destination = path.join(base, folder);
    const gui = await page.evaluate(request => window.meikyo.plan(request), { templateId: id, parent: base, folder });
    expect(gui.ok).toBe(true);
    const explicit = spawnSync(process.execPath, [cli, 'plan', id, destination, '--json'], {
      encoding: 'utf8', cwd: '/tmp', env: { ...process.env, NODE_PATH: '', NODE_OPTIONS: '' },
    });
    expect(explicit.status, explicit.stderr).toBe(0);
    const planned = JSON.parse(explicit.stdout);
    expect(planned.generatorVersion).toBe('0.2.1');
    expect(gui.value).toEqual(planned);
    expect(fs.existsSync(destination)).toBe(false);
    add(`plan-parity-${id}`, { entirePlanEqual: true, noWrites: true, generatorVersion: planned.generatorVersion });
  }

  const folder = 'GUI 日本語 ; $(touch injected)', destination = path.join(base, folder);
  await page.getByRole('button', { name: '保存先へ進む →' }).click();
  await page.getByLabel('親フォルダ', { exact: true }).fill(base);
  await page.getByLabel('新しいフォルダ名', { exact: true }).fill(folder);
  await page.locator('summary').filter({ hasText: '詳細設定' }).click();
  await page.getByLabel('識別ラベル（任意）').fill('custom');
  await page.getByLabel('ホストポート', { exact: true }).fill('3409');
  await page.getByRole('button', { name: '内容を確認 →' }).click();
  await expect(page.getByRole('heading', { name: 'この内容で作成します。' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'この内容で作成', exact: true })).toBeEnabled();
  expect(fs.existsSync(destination)).toBe(false);
  await expect(page.locator('.notice')).toContainText('ファイルの作成はできます');
  await expect(page.locator('.preview')).toContainText('3409');
  await page.screenshot({ path: path.join(output, '02-preview.png'), fullPage: true });
  await page.getByRole('button', { name: 'この内容で作成', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'プロジェクトのファイルを作成しました。' })).toBeVisible();
  await page.screenshot({ path: path.join(output, '03-created.png'), fullPage: true });
  expect(fs.readFileSync(path.join(destination, 'START_HERE.md'), 'utf8')).toContain('3409');
  expect(fs.existsSync(path.join(base, 'injected'))).toBe(false);
  const guiFiles = snapshot(destination);
  expect(Object.keys(guiFiles)).toHaveLength(44);
  // Only the just-created fixture is removed, then recreated at the same path.
  fs.rmSync(destination, { recursive: true });
  const repeated = spawnSync(process.execPath, [cli, 'create', 'F2', destination, '--name', 'custom', '--port', '3409', '--json'], {
    encoding: 'utf8', cwd: '/tmp', env: { ...process.env, NODE_PATH: '', NODE_OPTIONS: '' },
  });
  expect(repeated.status, repeated.stderr).toBe(0);
  expect(snapshot(destination)).toEqual(guiFiles);
  add('actual-window-f2-generation', {
    files: Object.keys(guiFiles).length, allBytesMatchCli: true, customPort: 3409,
    noWritesBeforeApply: true, hostNodeDockerCodeAbsent: true, commandSubstitutionNotExecuted: true,
  });
  expect(errors).toEqual([]);
} catch (error) {
  errors.push(error.stack);
  if (page) await page.screenshot({ path: path.join(output, 'failure.png'), fullPage: true }).catch(() => {});
  throw error;
} finally {
  await app.close();
  const report = {
    status: errors.length ? 'FAIL' : 'PASS',
    scope: '0.2.1 rebuilt GUI: relocated sandboxed window, version, six plans, one actual F2 creation. Historical G01-G15 suite is not rerun here.',
    archive: path.basename(archive), sha256: sha(fs.readFileSync(archive)),
    records, errors,
  };
  fs.writeFileSync(path.join(output, 'result.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ status: report.status, checks: records.length, sha256: report.sha256, errors }));
}
