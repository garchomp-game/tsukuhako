import {chromium, expect} from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import {setTimeout as delay} from 'node:timers/promises';
const [id,base]=process.argv.slice(2);
const output=path.resolve(import.meta.dirname,'../validation/brand-0.3.0/templates');
const endpoint=id==='B1'?'/api/health':'/';
let ready=false;
for(let n=0;n<90;n++){
  try{if((await fetch(base+endpoint,{signal:AbortSignal.timeout(2000)})).ok){ready=true;break}}catch{}
  await delay(400);
}
expect(ready).toBe(true);
if(id==='B1'){
  expect(await(await fetch(base+endpoint)).json()).toEqual({status:'ok'});
  console.log(JSON.stringify({id,status:'PASS',healthContractUnchanged:true}));
}else{
  const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,chromiumSandbox:true});
  try{
    const page=await browser.newPage({viewport:{width:1200,height:900}});
    await page.goto(base);
    await expect(page).toHaveTitle(/ツクハコ/);
    await expect(page.locator('body')).toContainText('ツクハコ');
    await expect(page.locator('body')).not.toContainText('明鏡');
    if(id==='F1'){
      const input=page.getByLabel('表示することば');
      await expect(input).toHaveAttribute('placeholder','こんにちは、ツクハコ。');
      await input.fill('こんにちは、ツクハコ。\n😀');
      await expect(page.getByTestId('preview')).toHaveText('こんにちは、ツクハコ。\n😀');
    }
    if(id==='S1'){
      await page.getByRole('link',{name:'練習画面へ'}).click();
      await expect(page.locator('body')).toContainText('ツクハコ');
      await expect(page.getByRole('heading',{level:1})).toHaveText('ことばを送ってみる');
    }
    if(id==='S3')await expect(page.getByRole('heading',{name:'接続設定から始めましょう'})).toBeVisible();
    await page.screenshot({path:path.join(output,id+'-brand.png'),fullPage:true});
    fs.writeFileSync(path.join(output,id+'-preview.json'),JSON.stringify({id,status:'PASS',title:await page.title(),scope:id==='S3'?'Unconfigured local page only; cloud NOT_RUN':'Changed template ZIP local preview'},null,2)+'\n');
    console.log(JSON.stringify({id,status:'PASS',title:await page.title()}));
  }finally{await browser.close()}
}
