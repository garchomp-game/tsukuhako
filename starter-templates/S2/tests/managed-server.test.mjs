import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:net';
import { withManagedServer, assertPortFree } from '../scripts/managed-server.mjs';

async function availablePort() {
  const listener = createServer();
  await new Promise(resolve => listener.listen(0, '0.0.0.0', resolve));
  const port = listener.address().port;
  await new Promise(resolve => listener.close(resolve));
  return port;
}
test('callback failure still stops owned server and releases its port', async () => {
  const port = await availablePort();
  let pid;
  const childCode = `import http from 'node:http'; http.createServer((q,s)=>s.end('ready')).listen(${port},'0.0.0.0');`;
  const args = ['--input-type=module', '-e', `import {spawn} from 'node:child_process'; spawn(process.execPath,['--input-type=module','-e',${JSON.stringify(childCode)}],{stdio:'inherit'}); setInterval(()=>{},1000);`];
  await assert.rejects(withManagedServer(async state => { pid = state.pid; throw new Error('intentional test failure'); }, { port, args, readyPath: '/' }), /intentional test failure/);
  assert.throws(() => process.kill(pid, 0), { code: 'ESRCH' });
  await assertPortFree(port);
});
test('an occupied port is refused without reusing or stopping its owner', async () => {
  const listener = createServer();
  await new Promise(resolve => listener.listen(0, '0.0.0.0', resolve));
  const port = listener.address().port;
  try {
    await assert.rejects(withManagedServer(() => assert.fail('must not reuse'), { port }), /既存サーバーは再利用しません/);
    assert.equal(listener.listening, true);
  } finally { await new Promise(resolve => listener.close(resolve)); }
});
