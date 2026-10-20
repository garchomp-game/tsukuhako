// Verify actual generated instructions against shipped source and the pre-existing lessons.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const root=path.resolve(import.meta.dirname,'..'),e=path.join(root,'validation/brand-0.3.0');
const cli=JSON.parse(fs.readFileSync(path.join(e,'cli-bundle.json')));
const cases={
  F1:['src/App.tsx','表示することば','今日のことば','docs/EXERCISES.md','/'],
  F2:['app/page.tsx','小さく変えて、<br />動きを確かめよう。','わたしの練習室','docs/EXERCISES.md','/'],
  B1:['app/api/health/route.ts','{ status: "ok" }','lesson: "preview"','docs/EXERCISES.md','/api/health'],
  S1:['app/practice/page.tsx','ことばを送ってみる','今日の便り','docs/EXERCISES.md','/practice'],
  S2:['app/page.tsx','ローカル学習メモ','わたしの学習メモ','docs/EXERCISES.md','/'],
  I1:['sql/practice.sql','SQLの練習','在庫を調べる','docs/learning.md',null],
};
const records=[];
for(const item of cli.records){
  const [file,before,after,lesson,route]=cases[item.id],folder=item.generation.destination;
  const source=fs.readFileSync(path.join(folder,file),'utf8'),exercise=fs.readFileSync(path.join(folder,lesson),'utf8');
  const guide=fs.readFileSync(path.join(folder,'START_HERE.md'),'utf8');
  assert.ok(source.includes(before),item.id+' source text');
  const normalized=text=>text.replace(/["`\s]/g,'');
  assert.ok(exercise.includes(file)&&[before,after].some(text=>normalized(exercise).includes(normalized(text))),item.id+' lesson target');
  assert.ok(guide.startsWith('# ツクハコ — ここから始める'));
  for(const text of [file,after,lesson,'元へ戻','変更前','準備'])assert.ok(guide.includes(text),item.id+' '+text);
  for(const [,target] of guide.matchAll(/\]\(([^)]+)\)/g)){
    if(target.startsWith('http://')){
      assert.equal(new URL(target).port,String(item.generation.ports.app));
    }else assert.ok(fs.existsSync(path.join(folder,target)),item.id+' '+target);
  }
  if(route)assert.ok(guide.includes(`http://localhost:${item.generation.ports.app}${route}`));
  if(item.id==='B1')assert.ok(guide.includes('契約テストが失敗'));
  if(item.id==='I1')assert.ok(guide.includes('保存だけでは結果は変わりません')&&guide.includes("'scripts/db.sh' 'query' 'sql/practice.sql'"));
  records.push({id:item.id,status:'PASS',file,before,after,lesson,route,templateVersion:item.version,
    guideSha256:createHash('sha256').update(guide).digest('hex')});
}
const report={status:'PASS',scope:'Final relocated CLI output: six guides, literal source targets, existing first exercises, restoration instructions, actual files and selected ports.',records};
fs.writeFileSync(path.join(e,'guide-alignment.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
