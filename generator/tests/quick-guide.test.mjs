import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {nextSteps,quickStart,startHere,quoteArg,commandText} from '../src/core/next-steps.mjs';

const slug=title=>title.toLowerCase().trim().replace(/[^\p{L}\p{N}\s_-]/gu,'').replace(/\s+/g,'-');
const headings=text=>[...text.matchAll(/^#{1,6} (.+)$/gm)].map(m=>slug(m[1]));
function plan(id,port=3000) {
  const ports=id==='I1'?{database:port===3000?55432:port}:{app:port};
  if(id==='S2')Object.assign(ports,{shadow:54320,api:54321,database:54322,studio:54323});
  return {request:{templateId:id},destination:'/home/student/日本語の保存先',ports,templateVersion:'test',projectName:'test'};
}

for(const id of ['F1','F2','B1','S1','S2','I1']) {
  test(`quick guide: ${id} preserves required actions, current values and full-guide targets`,()=>{
    for(const port of [3000,3311])for(const platform of ['linux','win32']) {
      const p=plan(id,port),steps=nextSteps(id,p.ports,{platform}),required=steps.filter(s=>s.phase==='required');
      const quick=quickStart(p,{platform}),full=startHere(p,{platform});
      const fullHeads=headings(full),quickHeads=headings(quick);
      assert.ok(required.every(s=>typeof s.summary==='string'&&s.summary.length>0));
      assert.equal(required[0].key,'prepare');
      assert.equal(required.at(-1).key,'verify');
      let previousQuick=-1,previousFull=-1;
      for(const [index,step] of required.entries()) {
        const quickPos=quick.indexOf(`## ${step.title}\n`),fullPos=full.indexOf(`## ${step.title}\n`);
        assert.ok(quickPos>previousQuick);assert.ok(fullPos>previousFull);
        previousQuick=quickPos;previousFull=fullPos;
        assert.ok(quick.includes(step.summary));
        assert.ok(full.includes(`${index+1}. [${step.title}](#${slug(step.title)}) — ${step.summary}`));
        assert.ok(quick.includes(step.expected));
        if(step.command)assert.ok(quick.includes(commandText(step.command)));
        if(step.url)assert.ok(quick.includes(step.url));
      }
      assert.equal(new Set(quickHeads).size,quickHeads.length);
      for(const [,anchor] of quick.matchAll(/\]\(#([^)]+)\)/g))assert.ok(fullHeads.includes(anchor),anchor);
      assert.doesNotMatch(quick,/## 任意の練習|一か所変える|EXERCISES\.md|<details>/);
      assert.ok(full.indexOf('## 今回のプロジェクト\n')<full.indexOf('## まず行う操作\n'));
      assert.ok(full.indexOf('## まず行う操作\n')<full.indexOf('## 準備を確認する\n'));
      assert.ok(quick.includes(p.destination));
      assert.match(quick,/初期処理の正常終了|初期処理が正常終了/);
      assert.match(quick,/処理中・エラー時は次へ進みません/);
      assert.match(quick,/信頼の確認が出た場合/);
      assert.match(quick,/接続済みなら次へ進みます/);
      if(id==='I1') {
        assert.doesNotMatch(quick,/http:\/\/|npm|ブラウザー/);
        assert.ok(quick.includes(`localhost:${p.ports.database}`));
        assert.ok(required.findIndex(s=>s.key==='databaseSetup')<required.findIndex(s=>s.key==='verify'));
      } else {
        assert.ok(quick.includes(`http://localhost:${port}`));
        assert.equal(quick.includes('ターミナルに「3000」と表示されても正常'),port!==3000);
        if(id==='B1')assert.match(quick,/起動後に確認するAPIのURL/);
      }
      if(id==='S2')assert.ok(required.findIndex(s=>s.key==='databaseStart')<required.findIndex(s=>s.key==='connect'));
      if(platform==='win32') {
        assert.match(quick,/生成時に選択したWSLの通常ユーザー/);
        assert.match(quick,/選択したWSLのターミナル（PowerShellでは実行しません）/);
        assert.doesNotMatch(quick,/Linuxのターミナル|macOS|Cmd\+Shift\+P/);
      } else assert.doesNotMatch(quick,/Windows|WSL|PowerShell|macOS/);
    }
  });
}

test('quick guide: compact renderer can supply context while retaining the title, working path and actions',()=>{
  const p=plan('F2',3311),quick=quickStart(p,{platform:'linux',includeContext:false});
  assert.ok(quick.startsWith('# はじめてのWeb画面：サンプル画面を表示する\n'));
  assert.doesNotMatch(quick,/## 今回のプロジェクト/);
  assert.ok(quick.includes(`cd -- ${quoteArg(p.destination)}`));
  assert.ok(quick.includes('http://localhost:3311/'));
  assert.match(quick,/## 準備を確認する/);
  assert.match(quick,/\]\(#終了する\)/);
  assert.match(quick,/\]\(#同じフォルダーから再開する\)/);
});

test('quick guide: unusual paths stay one quoted directory and cannot break the command fence',t=>{
  const base=fs.mkdtempSync(path.join(os.tmpdir(),'tsukuhako-quick-'));
  t.after(()=>fs.rmSync(base,{recursive:true,force:true}));
  const p=plan('F2');p.destination=path.join(base,"日本語 app's $(touch INJECTED) ; & ```");fs.mkdirSync(p.destination);
  const guide=quickStart(p,{platform:'linux'}),command=`cd -- ${quoteArg(p.destination)}\npwd`;
  assert.ok(guide.includes('````sh\n'+command+'\n````'));
  const run=spawnSync('bash',['-c',command],{cwd:base,encoding:'utf8'});
  assert.equal(run.status,0,run.stderr);assert.equal(run.stdout.trimEnd(),p.destination);
  assert.equal(fs.existsSync(path.join(base,'INJECTED')),false);
});

test('quick guide: macOS retains its reference-only scope and shortcut',()=>{
  const quick=quickStart(plan('F2'),{platform:'darwin'});
  assert.match(quick,/macOSは今回の配布・実機確認の対象外/);
  assert.match(quick,/macOSのターミナル/);assert.match(quick,/Cmd\+Shift\+P/);
  assert.doesNotMatch(quick,/Windows|WSL|PowerShell|Ctrl\+Shift\+P/);
});
