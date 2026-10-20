import { chromium } from '../../tools/node_modules/playwright/index.mjs';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import path from 'node:path';
const [folder, baseURL='http://localhost:3005', mode='full'] = process.argv.slice(2);
const envFile=path.join(folder,'.env.local');
const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true});
const page=await browser.newPage({viewport:{width:1280,height:960}});
const errors=[]; page.on('pageerror',error=>errors.push(error.message));
const started=performance.now();
async function verifyText(text) {
  for(let attempt=0;attempt<30;attempt++) {
    await page.goto(baseURL,{waitUntil:'networkidle'});
    if((await page.getByRole('alert',{name:'接続案内'}).textContent()).includes(text)) return;
    await page.waitForTimeout(500);
  }
  throw new Error(`Expected connection message: ${text}`);
}
try {
  await verifyText('接続設定がまだありません');
  await page.getByRole('heading',{name:'接続設定から始めましょう'}).waitFor();
  assert.equal(await page.getByRole('main').getByRole('button').count(),1);
  await page.getByRole('button',{name:'一覧を再読込'}).click();
  await page.getByRole('heading',{name:'接続設定から始めましょう'}).waitFor();
  await page.screenshot({path:path.join(import.meta.dirname,'ui-desktop.png'),fullPage:true});
  await page.setViewportSize({width:390,height:844});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.screenshot({path:path.join(import.meta.dirname,'ui-mobile.png'),fullPage:true});
  console.log('PASS: missing configuration guidance, GET reload, mobile layout');
  if(mode==='full') {
    await fs.writeFile(envFile,'SUPABASE_URL=http://127.0.0.1:1\nSUPABASE_PUBLIC_KEY=sb_publishable_fixture_only_123\n',{flag:'wx',mode:0o600});
    await verifyText('接続できませんでした');
    assert.equal((await page.content()).includes('sb_publishable_fixture_only_123'),false);
    console.log('PASS: local unavailable endpoint produces safe failure UI; public fixture key absent from HTML');
    await fs.unlink(envFile);
    console.log('PASS: removed temporary local-only settings; dev restart is required after removing loaded environment variables');
  }
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({result:'PASS',baseURL,scope:'local missing/failure UI; live cloud BLOCKED',elapsedSeconds:Math.round((performance.now()-started)/10)/100}));
} finally { await browser.close(); }
