import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {ReadingSettings} from '../lib/content.mjs';
import {validatePayload} from '../security.mjs';

test('guide preference: legacy reading records and both modes preserve WSL and reading position',async t=>{
 const folder=fs.mkdtempSync(path.join(os.tmpdir(),'tsukuhako-guide-mode-'));
 t.after(()=>fs.rmSync(folder,{recursive:true,force:true}));
 const settings=new ReadingSettings(path.join(folder,'reading.json'));
 const reading={view:'learn',lessonId:'F2',chapterId:'first',scroll:123,distroId:'aaaaaaaaaaaaaaaa'};
 for(const value of [reading,{...reading,guideMode:'quick'},{...reading,guideMode:'guided'}]) {
  await settings.save(validatePayload('saveSettings',value));
  assert.deepEqual(await settings.read(),value);
 }
 for(const guideMode of [null,1,'expert','',{},['quick']])assert.throws(()=>validatePayload('saveSettings',{...reading,guideMode}));
 assert.throws(()=>validatePayload('saveSettings',{...reading,guideMode:'quick',destination:'/tmp/project'}));
});
