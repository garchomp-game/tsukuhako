// Focused UX-loop fixture: actual renderer, mocked IPC; no host changes.
import {_electron as electron,expect} from '../../tools/node_modules/@playwright/test/index.mjs';
import {source} from './onboarding-fixture.mjs';
import fs from 'node:fs';import path from 'node:path';import os from 'node:os';
const root=path.resolve(import.meta.dirname,'../..'),run=fs.mkdtempSync(path.join(os.tmpdir(),'tsukuhako-start-ux-'));
const entry=run+'/fixture.cjs';fs.writeFileSync(entry,source);
const env={...process.env,TSUKUHAKO_UI_ROOT:root,TSUKUHAKO_UI_PROFILE:run+'/profile',TSUKUHAKO_UI_VISIBLE:'1'};delete env.ELECTRON_RUN_AS_NODE;
let app;const records=[];
try{
 app=await electron.launch({executablePath:root+'/generator-desktop/node_modules/electron/dist/electron',args:[entry],env});const p=await app.firstWindow();p.setDefaultTimeout(10000);
 const b=name=>p.getByRole('button',{name,exact:true}),nav=name=>p.getByRole('navigation',{name:'ツクハコの画面'}).getByRole('button',{name,exact:true});
 await p.setViewportSize({width:1148,height:900});await expect(b('はじめてのWeb画面で始める')).toBeEnabled();await p.screenshot({path:run+'/before.png'});
 await b('はじめてのWeb画面で始める').click();await expect(p.locator('#generator-title')).toBeFocused();await expect(p.locator('#generator-title')).toHaveText('プロジェクトの置き場所を決めます。');await expect(p.locator('.first-use')).toHaveCount(0);await expect(p.locator('.preparation')).toBeHidden();await expect(p.locator('.destination-context')).toContainText('はじめてのWeb画面');
 const geometry=await p.evaluate(()=>{const nodes=['#generator-title','#parent','#folder','button[form="destination"]'];return Object.fromEntries(nodes.map(selector=>{const r=document.querySelector(selector).getBoundingClientRect();return[selector,{top:r.top,bottom:r.bottom,fullyVisible:r.top>=0&&r.bottom<=innerHeight}]}))});
 console.log(JSON.stringify(geometry));await p.screenshot({path:run+'/after.png'});
 for(const [name,r] of Object.entries(geometry))expect(r.fullyVisible,name).toBe(true);
 records.push({scenario:'one click reveals recommended destination and next action without scrolling',result:'PASS',viewport:'1148x900',geometry});
 await p.getByLabel('新しいフォルダ名').fill('入力を保持');await b('準備の状態を確認').click();await expect(p.locator('#preparation-title')).toBeFocused();await expect(p.getByLabel('親フォルダ',{exact:true})).toBeHidden();await nav('困ったとき').click();await expect(p.locator('#準備を確認する')).toBeFocused();await b('作る画面へ戻る').click();await expect(p.locator('#preparation-title')).toBeFocused();await b('作成に戻る').first().click();await expect(p.getByLabel('新しいフォルダ名')).toHaveValue('入力を保持');await expect(p.locator('#generator-title')).toBeFocused();
 await nav('困ったとき').click();await expect(p.locator('#保存先を確認する')).toBeFocused();await b('作る画面へ戻る').click();await expect(p.getByLabel('新しいフォルダ名')).toHaveValue('入力を保持');records.push({scenario:'preparation and help return preserve destination input and focus',result:'PASS'});
 await b('← 戻る').click();await expect(p.getByLabel('はじめてのWeb画面（おすすめ）',{exact:true})).toBeChecked();await b('保存先を決める').click();await expect(p.getByLabel('新しいフォルダ名')).toHaveValue('入力を保持');records.push({scenario:'configuration selection remains available',result:'PASS'});
 await p.setViewportSize({width:390,height:844});expect(await p.evaluate(()=>document.body.scrollWidth<=innerWidth)).toBe(true);await b('作成内容を確認').scrollIntoViewIfNeeded();await expect(b('作成内容を確認')).toBeVisible();await p.screenshot({path:run+'/narrow.png'});records.push({scenario:'390px layout does not overflow and next action is reachable',result:'PASS'});
 await p.setViewportSize({width:1148,height:900});await app.evaluate(()=>{Object.assign(globalThis.fixture,{platform:'win32',helper:false,saved:{view:'create',lessonId:'F2',chapterId:'',scroll:0}})});await p.reload();await expect(b('はじめてのWeb画面で始める')).toBeEnabled();await b('はじめてのWeb画面で始める').click();await expect(p.locator('#preparation-title')).toBeFocused();await expect(b('保存先へ進む').first()).toBeDisabled();await expect(p.getByLabel('親フォルダ',{exact:true})).toBeHidden();
 await p.getByLabel('開発するWSL').selectOption('aaaaaaaaaaaaaaaa');await b('もう一度確認').click();await expect(b('保存先へ進む').first()).toBeDisabled();await b('WSL用ファイルを準備').click();await expect(b('保存先へ進む').first()).toBeEnabled();await b('保存先へ進む').first().click();await expect(p.locator('#generator-title')).toBeFocused();await expect(p.getByLabel('親フォルダ',{exact:true})).toBeVisible();records.push({scenario:'Windows selected-WSL/helper gate remains enforced before direct destination',result:'PASS'});
 fs.writeFileSync(run+'/result.json',JSON.stringify({scope:'FIXTURE',result:'PASS',records},null,2));console.log('PASS; Evidence: '+run);
}catch(e){console.error('Evidence: '+run);throw e}finally{await app?.close()}
