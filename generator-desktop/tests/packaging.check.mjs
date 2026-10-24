import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {verifyBundle} from '../../tools/verify-desktop-bundle.mjs';
const root=path.resolve(import.meta.dirname,'../..'),stage=path.join(root,'dist/desktop-app');
// Stage first. Deliberate corruption detects omissions and byte changes in actual bundles.
test('distribution: independent cwd and Unicode/space paths; missing helper and corrupt curriculum fail closed',async()=>{
  const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'tsukuhako-配布 test-'));
  const app=path.join(tmp,'日本語 app');
  try{
    fs.cpSync(stage,app,{recursive:true});
    const result=JSON.parse(execFileSync(process.execPath,[path.join(root,'tools/verify-desktop-bundle.mjs'),app],{cwd:os.tmpdir(),encoding:'utf8'}));
    assert.equal(result.status,'PASS');assert.equal(result.chapters,61); // 50 lessons + 5 first-run guides + 6 creation help chapters.
    const helper=path.join(app,'wsl-helper/helper.tar');fs.renameSync(helper,helper+'.held');
    await assert.rejects(verifyBundle(app));fs.renameSync(helper+'.held',helper);
    fs.appendFileSync(path.join(app,'bundle/curriculum/F2/first.md'),'corrupt');
    await assert.rejects(verifyBundle(app));
  }finally{fs.rmSync(tmp,{recursive:true,force:true});}
});
