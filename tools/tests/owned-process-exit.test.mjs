import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {closeOwnedProcess} from '../owned-process-exit.mjs';

async function readyChild(source) {
  const child=spawn(process.execPath,['-e',source+`;process.stdout.write('ready\\n')`],{stdio:['pipe','pipe','pipe']});
  await once(child.stdout,'data');return child;
}
async function cleanup(child) {
  if(child.exitCode===null&&child.signalCode===null) {
    const exited=once(child,'exit');child.kill('SIGKILL');await exited;
  }
}
test('a fast requested exit is observed before the close callback and must be code 0',async()=>{
  const child=await readyChild('process.stdin.once("data",()=>process.exit(0))');
  try {
    const r=await closeOwnedProcess(child,()=>{
      assert.ok(child.listenerCount('exit')>0,'exit observation precedes the close request');
      child.stdin.end('quit');
    });
    assert.equal(r.status,'PASS');assert.equal(r.exitCode,0);assert.equal(r.signal,null);
    assert.equal(r.timedOut,false);assert.deepEqual(r.cleanup,[]);assert.equal(r.cleanupComplete,true);
  } finally { await cleanup(child); }
});
test('nonzero exit is a failure, even though the process exits promptly',async()=>{
  const child=await readyChild('process.stdin.once("data",()=>process.exit(7))');
  try { const r=await closeOwnedProcess(child,()=>child.stdin.end('quit'));assert.equal(r.status,'FAIL');assert.equal(r.reason,'NONZERO_EXIT');assert.equal(r.exitCode,7);assert.equal(r.signal,null); }
  finally { await cleanup(child); }
});
test('termination by signal cannot be reported as graceful exit',async()=>{
  const child=await readyChild('setInterval(()=>{},1000)');
  try { const r=await closeOwnedProcess(child,()=>child.kill('SIGTERM'));assert.equal(r.status,'FAIL');assert.equal(r.reason,'SIGNAL_EXIT');assert.equal(r.exitCode,null);assert.equal(r.signal,'SIGTERM'); }
  finally { await cleanup(child); }
});
test('exit before the close request is detected without waiting for an event that already occurred',async()=>{
  const child=await readyChild('process.stdin.once("data",()=>process.exit(0))');
  try {
    const exited=once(child,'exit');child.stdin.end('quit');await exited;
    const r=await closeOwnedProcess(child,()=>assert.fail('must not issue a stale close request'));
    assert.equal(r.status,'FAIL');assert.equal(r.reason,'EXITED_BEFORE_REQUEST');assert.equal(r.requestIssued,false);assert.equal(r.exitCode,0);
  } finally { await cleanup(child); }
});
test('timeout stays failed after forced cleanup and leaves an unrelated child running',async()=>{
  const owned=await readyChild('process.on("SIGTERM",()=>{});setInterval(()=>{},1000)');
  const unrelated=await readyChild('setInterval(()=>{},1000)');
  try {
    const r=await closeOwnedProcess(owned,()=>{}, {timeoutMs:100,cleanupMs:150});
    assert.equal(r.status,'FAIL');assert.equal(r.reason,'TIMEOUT');assert.equal(r.timedOut,true);
    assert.equal(r.signal,'SIGKILL');assert.equal(r.cleanupComplete,true);
    assert.deepEqual(r.cleanup.map(c=>c.signal),['SIGTERM','SIGKILL']);
    assert.equal(unrelated.exitCode,null);assert.equal(unrelated.signalCode,null);process.kill(unrelated.pid,0);
  } finally { await cleanup(owned);await cleanup(unrelated); }
});
test('a failed close request is reported and its owned child is cleaned up',async()=>{
  const child=await readyChild('setInterval(()=>{},1000)');
  try {
    const r=await closeOwnedProcess(child,()=>{throw Error('fixture: no window')},{cleanupMs:300});
    assert.equal(r.status,'FAIL');assert.equal(r.reason,'EXIT_REQUEST_FAILED');assert.match(r.error,/fixture: no window/);assert.equal(r.cleanupComplete,true);
  } finally { await cleanup(child); }
});
