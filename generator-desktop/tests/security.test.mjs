import { test } from 'node:test';
import assert from 'node:assert/strict';
import { UI_URL, METHODS, validateSender, validatePayload } from '../security.mjs';
test('G13 IPC: exact sender, main frame and local URL are all required', () => {
  const frame = { url: UI_URL }, contents = { mainFrame: frame };
  const win = { isDestroyed:()=>false, webContents:contents };
  const good = { sender: contents, senderFrame: frame };
  assert.doesNotThrow(()=>validateSender(good,win));
  for (const event of [{...good,sender:{}},{...good,senderFrame:{url:UI_URL}},{}]) assert.throws(()=>validateSender(event,win),{code:'INVALID_SENDER'});
  for (const url of ['https://example.org',UI_URL+'?untrusted','app://tsukuhako.evil/index.html']) {frame.url=url;assert.throws(()=>validateSender(good,win),{code:'INVALID_SENDER'})}
  frame.url=UI_URL;assert.throws(()=>validateSender(good,{...win,isDestroyed:()=>true}),{code:'INVALID_SENDER'});
});
test('G13 IPC: fixed methods, strict bounded arguments; shell/root/files/hooks cannot be supplied', () => {
  assert.equal(METHODS.length,17);
  const request={templateId:'F2',parent:'/tmp',folder:'日本語 ; $(touch nope)'};
  assert.deepEqual(validatePayload('plan',request),request);
  assert.equal(validatePayload('plan',null),null);
  for(const payload of [{...request,bundleRoot:'/tmp'},{...request,hooks:{}},{...request,shell:'touch nope'},{...request,templateId:'S3'},{...request,name:'UPPER'},{...request,port:'3001'},{...request,port:65536},{...request,dbBase:54320},{...request,parent:'x'.repeat(4097)},{...request,folder:'x\n'},null,[]]) {
    if(payload!==null) assert.throws(()=>validatePayload('plan',payload),{code:'INVALID_OPTIONS'});
  }
  for(const method of ['apply','diagnose']) {
    assert.deepEqual(validatePayload(method,{planId:'a'.repeat(64)}),{planId:'a'.repeat(64)});
    for(const bad of [{planId:'x'},{planId:'a'.repeat(64),destination:'/tmp'},null])assert.throws(()=>validatePayload(method,bad),{code:'INVALID_OPTIONS'});
  }
  for(const method of ['getTemplates','chooseParentDirectory','openInVSCode'])assert.throws(()=>validatePayload(method,{destination:'/tmp'}),{code:'INVALID_OPTIONS'});
  assert.throws(()=>validatePayload('shell','id'),{code:'INVALID_OPTIONS'});
});
