// Verify the final ZIP extraction in an offline browser; never use a dev server.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {chromium} from '@playwright/test';
import MarkdownIt from '../../generator-desktop/node_modules/markdown-it/dist/markdown-it.mjs';
import {root,guides} from './config.mjs';
import {hash} from '../package-delivery-bundle.mjs';
const evidence=path.resolve(process.argv[2]||'validation/sunday-bundle-2026-10-25');
const artifacts=JSON.parse(fs.readFileSync(evidence+'/delivery/artifacts.json'));
const parser=new MarkdownIt({html:false,linkify:false,typographer:false,breaks:true});
const normalize=s=>s.replace(/\s+/g,' ').trim();
const browser=await chromium.launch({channel:'chrome',headless:true});
const records=[];
fs.mkdirSync(evidence+'/screenshots',{recursive:true});fs.mkdirSync(evidence+'/logs',{recursive:true});
try{
 for(const artifact of artifacts.files){
  const archive=path.resolve(root,artifact.localPath),folder=path.resolve(root,artifact.extractedPath);
  assert.equal(hash(archive),artifact.sha256);assert.match(folder,/新規 展開 /);
  const entry=pathToFileURL(folder+'/00_START_HERE.html').href;
  const context=await browser.newContext({offline:true,viewport:{width:1280,height:900}});
  const requests=[],errors=[];context.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url());});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  let linksChecked=0,inlineChecks=0,codeBlocks=0;
  const checkLinks=async()=>{
   const links=await page.locator('a').evaluateAll(as=>as.map(a=>({raw:a.getAttribute('href'),url:a.href})));
   for(const link of links){
    const url=new URL(link.url);if(url.protocol==='https:')continue;
    assert.equal(url.protocol,'file:');const file=fileURLToPath(url);assert.ok(fs.statSync(file).isFile());
    if(url.hash&&file===fileURLToPath(new URL(page.url())))assert.ok(await page.evaluate(id=>!!document.getElementById(id),decodeURIComponent(url.hash.slice(1))),link.raw);
    linksChecked++;
   }
   assert.equal(await page.locator('script,link,img,iframe,form,button').count(),0);
  };
  const checkWidth=async(width)=>{
   await page.setViewportSize({width,height:900});
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`overflow ${artifact.platform} ${width}`);
   assert.equal(await page.locator('pre,table').evaluateAll(nodes=>nodes.filter(n=>n.scrollWidth>n.clientWidth+1).length),0);
  };
  await page.goto(entry);assert.equal(await page.title(),`ツクハコを始める｜${artifact.platform==='linux'?'Linux':'Windows'} x64`);
  await checkLinks();await checkWidth(1280);await page.screenshot({path:evidence+'/screenshots/'+artifact.platform+'-entry-wide.png',fullPage:true});
  await checkWidth(360);await page.screenshot({path:evidence+'/screenshots/'+artifact.platform+'-entry-narrow.png',fullPage:true});await checkWidth(320);
  const popupPromise=page.waitForEvent('popup');await page.getByRole('link',{name:'本体の導入手順を開く（別タブ）',exact:true}).click();
  const popup=await popupPromise;await popup.waitForLoadState();
  assert.equal(fileURLToPath(popup.url()),folder+'/app/START_HERE.txt');assert.ok((await popup.locator('body').innerText()).length>1000);await popup.close();
  await page.getByRole('link',{name:'F2の初回手順へ',exact:true}).click();assert.equal(new URL(page.url()).hash,'#first-run');
  assert.ok(await page.locator('#first-run').isVisible());await checkLinks();
  for(const guide of guides){
   const text=fs.readFileSync(folder+'/guide/'+guide.file,'utf8');
   const tokens=parser.parse(text,{}),body=normalize(await page.locator('#'+guide.id).innerText());
   for(const token of tokens.filter(t=>t.type==='inline')){
    const expected=normalize(token.children.map(t=>['text','code_inline'].includes(t.type)?t.content:['softbreak','hardbreak'].includes(t.type)?' ':'').join(''));
    if(expected){assert.ok(body.includes(expected),guide.file+': '+expected.slice(0,100));inlineChecks++;}
   }
   const expectedCodes=tokens.filter(t=>t.type==='fence'||t.type==='code_block').map(t=>t.content.trimEnd());
   assert.deepEqual(await page.locator('#'+guide.id+' pre code').allTextContents().then(v=>v.map(t=>t.trimEnd())),expectedCodes);codeBlocks+=expectedCodes.length;
  }
  assert.ok((await page.locator('#first-run').innerText()).includes('本文に「準備完了」があり、初期構成処理がエラーなく終了していること。'));
  await checkWidth(1280);await page.locator('#first-run').scrollIntoViewIfNeeded();await page.screenshot({path:evidence+'/screenshots/'+artifact.platform+'-first-run-wide.png'});
  await checkWidth(360);await page.locator('#first-run').scrollIntoViewIfNeeded();await page.screenshot({path:evidence+'/screenshots/'+artifact.platform+'-first-run-narrow.png'});await checkWidth(320);
  const selection=await page.locator('#first-run pre code').first().evaluate(el=>{const range=document.createRange();range.selectNodeContents(el);const s=window.getSelection();s.removeAllRanges();s.addRange(range);return s.toString();});
  assert.equal(selection,'docker version\ndocker compose version\n');
  for(const id of ['troubleshooting','next-step','feedback']){
   await page.goto(entry);await page.locator('a[href="guide/index.html#'+id+'"]').click();assert.equal(new URL(page.url()).hash,'#'+id);assert.ok(await page.locator('#'+id).isVisible());
  }
  await page.getByRole('link',{name:'商品一式の入口へ戻る',exact:true}).click();assert.equal(page.url(),entry);
  assert.deepEqual(requests,[]);assert.deepEqual(errors,[]);
  records.push({platform:artifact.platform,zipSha256:artifact.sha256,extractedPath:artifact.extractedPath,offlineFileBrowser:'PASS',appInstructionsPopup:'PASS',navigation:'PASS',linksChecked,markdownInlineChecks:inlineChecks,codeBlocks,commandSelection:'PASS',widths:[1280,360,320],horizontalOverflow:false,httpRequests:requests,scriptErrors:errors});
  await context.close();
 }
 const result={category:'LOCAL_BROWSER',interaction:'AUTOMATED',result:'PASS',browser:'Chrome '+browser.version(),os:'Linux (both OS packages inspected here; not Windows execution)',checkedAt:new Date().toISOString(),records};
 fs.writeFileSync(evidence+'/logs/offline-browser.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
}finally{await browser.close();}
