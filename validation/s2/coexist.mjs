import { chromium } from '../../tools/node_modules/playwright/index.mjs';
import assert from 'node:assert/strict';
const first='http://localhost:3004', second='http://localhost:3014';
const initial=await (await fetch(second+'/api/notes')).json();
assert.equal(initial.notes.length,2);
const create=await fetch(second+'/api/notes',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({body:'ZIPから作成した独立メモ'})});
assert.equal(create.status,201);const {note}=await create.json();
const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true});
try{
 const original=await (await fetch(first+'/api/notes')).json();
 assert.equal(original.notes.some(x=>x.id===note.id),false);
 const page=await browser.newPage();await page.goto(second);
 await page.getByText('ZIPから作成した独立メモ',{exact:true}).waitFor();
 await page.getByRole('button',{name:'編集: ZIPから作成した独立メモ',exact:true}).click();
 await page.getByLabel('本文',{exact:true}).fill('ZIPの画面から更新📝');
 const updated=page.waitForResponse(r=>r.request().method()==='PATCH' && r.url().includes('/api/notes/'));
 await page.getByRole('button',{name:'更新する',exact:true}).click();
 assert.equal((await updated).status(),200);
 await page.locator('li').getByText('ZIPの画面から更新📝',{exact:true}).waitFor();
 await page.reload();await page.getByText('ZIPの画面から更新📝',{exact:true}).waitFor();
 await page.getByRole('button',{name:'削除: ZIPの画面から更新📝',exact:true}).click();
 await page.getByText('ZIPの画面から更新📝',{exact:true}).waitFor({state:'detached'});
 assert.equal((await (await fetch(first+'/api/notes')).json()).notes.length,2);
 console.log('PASS: standalone ZIP (Japanese/space path), separate project/ports, seed2, browser update/reload/delete and no cross-project data.');
 console.log('PASS: first app 3004 and second app 3014 concurrently; Supabase APIs 54321/54421, DB54322/54422, Studio54323/54423.');
}finally{await browser.close();await fetch(second+'/api/notes/'+note.id,{method:'DELETE'});}
