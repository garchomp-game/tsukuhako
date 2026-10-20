import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';

test('2ページのHTTP応答と存在しないページ', { timeout: 90000 }, async t => {
  const port = process.env.TEST_PORT || '3100';
  const server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'dev', '--hostname', '127.0.0.1', '--port', port], { stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1' } });
  let log = '';
  server.stdout.on('data', x => { log += x; });
  server.stderr.on('data', x => { log += x; });
  t.after(async () => { if (server.exitCode === null) { server.kill('SIGTERM'); await new Promise(resolve => server.once('exit', resolve)); } });
  const base = `http://127.0.0.1:${port}`;
  let ready = false;
  for (let i = 0; i < 90; i++) {
    if (server.exitCode !== null) throw new Error(log);
    try { if ((await fetch(base, { signal: AbortSignal.timeout(1500) })).ok) { ready = true; break; } } catch {}
    await delay(500);
  }
  assert.ok(ready, log);
  for (const [path, expected] of [['/', '小さく変えて'], ['/practice', '今、つくりたいものは']]) {
    const response = await fetch(base + path);
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type'), /text\/html/);
    assert.ok((await response.text()).includes(expected));
  }
  assert.equal((await fetch(`${base}/does-not-exist`)).status, 404);
  assert.equal((await fetch(`${base}/api/health`)).status, 404, '独自APIを含めない');
});
