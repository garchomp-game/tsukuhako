import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import MarkdownIt from 'markdown-it';
import {ContentLibrary,ReadingSettings} from '../lib/content.mjs';
import {validatePayload} from '../security.mjs';
import {resolveChapter} from '../src/links.ts';
import {helpChapter} from '../src/flow.ts';

const root=path.resolve(import.meta.dirname,'../..');
const version=JSON.parse(fs.readFileSync(root+'/generator-desktop/package.json','utf8')).version;
const sources=[['start','START_HERE.md'],['first-run','FIRST-RUN.md'],['troubleshooting','TROUBLESHOOTING.md'],['next-step','NEXT-STEP.md'],['feedback','FEEDBACK.md']];
const chapters=sources.map(([id,source])=>{
 const bytes=fs.readFileSync(path.join(root,'docs/launch/sunday-pack',source));
 return{id,title:bytes.toString().split('\n')[0].replace(/^# /,''),source,file:`guide/${source}`,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')};
});
const manifest={version,appVersion:version,lessons:[...JSON.parse(fs.readFileSync(root+'/curriculum/manifest.json')).lessons.filter(l=>l.id==='setup'),{id:'guide',title:'はじめて使う',version:'2026-10-24-r4',templateVersion:null,chapters}],assets:[]};

test('Guide: existing content API loads five canonical chapters and resolves their uppercase source links',async()=>{
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'tsukuhako-guide-'));
 try{
  fs.mkdirSync(path.join(temp,'guide'));
  fs.cpSync(path.join(root,'curriculum/setup'),path.join(temp,'setup'),{recursive:true});
  fs.writeFileSync(path.join(temp,'manifest.json'),JSON.stringify(manifest));
  for(const chapter of chapters)fs.copyFileSync(path.join(root,'docs/launch/sunday-pack',chapter.source),path.join(temp,chapter.file));
  const library=new ContentLibrary(temp),parser=new MarkdownIt();
  for(const chapter of chapters){
   const {text}=await library.chapter('guide',chapter.id);
   assert.equal(text,fs.readFileSync(path.join(root,'docs/launch/sunday-pack',chapter.source),'utf8'));
   const tokens=parser.parse(text,{}).flatMap(t=>t.children||[]);
   for(const token of tokens.filter(t=>t.type==='link_open')){
    const href=token.attrGet('href');
    if(href.startsWith('https:'))assert.equal(await library.external('guide',chapter.id,href),href);
    else assert.ok(resolveChapter(manifest,'guide',chapter.id,href),`${chapter.source} -> ${href}`);
   }
  }
  await assert.rejects(library.chapter('guide','../../etc'));
  assert.deepEqual(helpChapter(manifest,'guide'),{lessonId:'guide',chapterId:'troubleshooting'});
 }finally{fs.rmSync(temp,{recursive:true,force:true})}
});

test('Guide: the unchanged settings and chapter IPC contracts preserve a guide chapter, position and WSL selection',async()=>{
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'tsukuhako-guide-reading-'));
 try{
  const settings=new ReadingSettings(path.join(temp,'reading.json'));
  const existing={view:'learn',lessonId:'F2',chapterId:'first',scroll:240,distroId:'abc0123456789def'};
  await settings.save(validatePayload('saveSettings',existing));
  assert.deepEqual(await settings.read(),existing);
  for(const chapter of chapters){
   const reading={...existing,lessonId:'guide',chapterId:chapter.id,scroll:642};
   assert.deepEqual(validatePayload('readChapter',{lessonId:'guide',chapterId:chapter.id}),{lessonId:'guide',chapterId:chapter.id});
   await settings.save(validatePayload('saveSettings',reading));
   assert.deepEqual(await settings.read(),reading);
  }
  assert.throws(()=>validatePayload('saveSettings',{...existing,view:'guide'}));
 }finally{fs.rmSync(temp,{recursive:true,force:true})}
});
