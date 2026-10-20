import { chromium } from '../../tools/node_modules/playwright/index.mjs';
import assert from 'node:assert/strict';
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', headless: true });
try {
 const page = await browser.newPage({viewport:{width:1280,height:900},timezoneId:'Asia/Tokyo'});
 await page.goto('http://localhost:3004');
 await page.getByRole('heading',{name:'ローカル学習メモ',exact:true}).waitFor();
 await page.getByText('架空の学習メモ: 画面からメモを追加してみる',{exact:true}).waitFor();
 await page.screenshot({path:new URL('./ui-desktop.png',import.meta.url).pathname,fullPage:true});
 await page.setViewportSize({width:390,height:844});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 await page.screenshot({path:new URL('./ui-mobile.png',import.meta.url).pathname,fullPage:true});
 console.log('PASS host Chrome 155: desktop/mobile screenshots, no horizontal overflow.');
} finally { await browser.close(); }
