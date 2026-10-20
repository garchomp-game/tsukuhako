import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium, expect } from '@playwright/test';

const root = resolve(import.meta.dirname, '..');
const cwd = resolve(root, 'starter-templates/F2');
const output = resolve(root, 'validation/root/f2-lifecycle');
mkdirSync(output, { recursive: true });
const results = [];
const hash = text => createHash('sha256').update(text).digest('hex');
function command(id, exe, args) {
  const start = Date.now();
  const p = spawnSync(exe, args, { cwd, timeout: 180000, encoding: 'utf8' });
  writeFileSync(resolve(output, id + '.log'), (p.stdout || '') + (p.stderr || ''));
  results.push({ id, at: new Date().toISOString(), command: [exe,...args], exitCode: p.status, elapsedMs: Date.now()-start, result: p.status === 0 ? 'PASS' : 'FAIL' });
  if (p.status !== 0) throw new Error(`${id} failed: ${p.stderr || p.error}`);
  return p.stdout;
}
const docker = (id, ...args) => command(id, 'docker', ['compose', ...args]);
const cli = (id, ...args) => command(id, resolve(root,'tools/node_modules/.bin/devcontainer'), args);
async function ready() {
  for (let i=0;i<100;i++) {
    try { if ((await fetch('http://localhost:3001/', { signal: AbortSignal.timeout(1500) })).ok) return; } catch {}
    await delay(300);
  }
  throw new Error('Server readiness timeout');
}
async function start(id) {
  docker(id, 'exec', '-d', 'app', 'sh', '-c', 'echo $$ > /tmp/otoka-f2-next.pid; exec node node_modules/next/dist/bin/next dev --hostname 0.0.0.0 --port 3000 > /tmp/otoka-f2-next.log 2>&1');
  await ready();
}
const path = resolve(cwd,'app/page.tsx');
const original = readFileSync(path,'utf8');
const changed = original.replace('小さく変えて、','編集保持の確認、');
const browser = await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true});
try {
  await start('01-start');
  const page = await browser.newPage({viewport:{width:1200,height:850}});
  await page.goto('http://localhost:3001/');
  await expect(page.getByRole('heading',{level:1})).toContainText('小さく変えて');
  let reloads = 0;
  page.on('load',()=>reloads++);
  writeFileSync(path,changed);
  await expect(page.getByRole('heading',{level:1})).toContainText('編集保持の確認',{timeout:15000});
  results.push({id:'02-hmr',result:'PASS',observation:'保存後に同じブラウザ画面へ反映。手動reload/server restartなし', automaticPageLoads:reloads,sourceHash:hash(changed)});
  docker('03-process-stop','exec','app','sh','-c','kill "$(cat /tmp/otoka-f2-next.pid)"');
  await delay(500);
  await start('04-process-restart');
  await page.goto('http://localhost:3001/');
  await expect(page.getByRole('heading',{level:1})).toContainText('編集保持の確認');
  docker('05-compose-stop','stop');
  cli('06-container-resume','up','--workspace-folder','.');
  await start('07-resume-dev');
  await page.goto('http://localhost:3001/');
  await expect(page.getByRole('heading',{level:1})).toContainText('編集保持の確認');
  const oldId=docker('08-old-container','ps','-q','app').trim();
  docker('09-compose-down','down');
  cli('10-container-recreate','up','--workspace-folder','.');
  const newId=docker('11-new-container','ps','-q','app').trim();
  expect(newId).not.toBe(oldId);
  expect(readFileSync(path,'utf8')).toBe(changed);
  await start('12-recreated-dev');
  await page.goto('http://localhost:3001/');
  await expect(page.getByRole('heading',{level:1})).toContainText('編集保持の確認');
  results.push({id:'13-rebuild-retention',result:'PASS',oldContainer:oldId,newContainer:newId,sourceHash:hash(readFileSync(path)),observation:'コンテナを削除・再作成し編集済みソースが保持、HTTP/画面一致。DBは非搭載のため対象外。'});
  writeFileSync(path,original);
  await expect(page.getByRole('heading',{level:1})).toContainText('小さく変えて',{timeout:15000});
  await page.screenshot({path:resolve(output,'desktop.png'),fullPage:true});
  await page.getByRole('link',{name:'練習画面へ'}).click();
  await page.getByLabel('つくりたいもの').fill('自分の学習ノート');
  await expect(page.getByRole('status')).toHaveText('自分の学習ノート');
  await page.setViewportSize({width:390,height:844});
  await page.screenshot({path:resolve(output,'mobile.png'),fullPage:true});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  results.push({id:'14-browser-visual',result:'PASS',browser:'Google Chrome 155.0.8059.84 / automated',observation:'日本語UI 1200px/390px screenshot、横スクロールなし。人間の試用は未実施。'});
} finally {
  writeFileSync(path,original);
  await browser.close();
  writeFileSync(resolve(output,'results.json'),JSON.stringify(results,null,2)+'\n');
}
console.log(JSON.stringify(results,null,2));
