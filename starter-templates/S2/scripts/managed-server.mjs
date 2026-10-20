import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { setTimeout as delay } from 'node:timers/promises';

export async function assertPortFree(port) {
  const probe = createServer();
  await new Promise((resolve, reject) => {
    probe.once('error', reject);
    probe.listen({ host: '0.0.0.0', port, exclusive: true }, resolve);
  });
  await new Promise((resolve, reject) => probe.close(error => error ? reject(error) : resolve()));
}

function groupExists(pid) {
  try { process.kill(-pid, 0); return true; }
  catch (error) { if (error.code === 'ESRCH') return false; throw error; }
}

async function waitUntil(check, milliseconds) {
  const deadline = Date.now() + milliseconds;
  do { if (await check()) return true; await delay(100); } while (Date.now() < deadline);
  return false;
}

// Linux/WSL: own one process group, including the children forked by Next.
export async function withManagedServer(run, {
  port = 3000,
  args = ['node_modules/next/dist/bin/next', 'dev', '--hostname', '0.0.0.0', '--port', String(port)],
  readyPath = '/api/notes',
} = {}) {
  if (process.platform === 'win32') throw new Error('この試験はLinux/WSL内で実行してください。');
  await assertPortFree(port).catch(error => { throw new Error(`試験用ポート${port}を使用中です。既存サーバーは再利用しません。`, { cause: error }); });
  const server = spawn(process.execPath, args, { detached: true, stdio: 'inherit' });
  let spawnError;
  server.on('error', error => { spawnError = error; });
  const closed = new Promise(resolve => server.once('close', resolve));
  const pid = server.pid;
  let cleanupPromise;
  function cleanup() {
    return cleanupPromise ??= (async () => {
      if (pid && groupExists(pid)) {
        process.kill(-pid, 'SIGTERM');
        if (!await waitUntil(() => !groupExists(pid), 10000)) {
          process.kill(-pid, 'SIGKILL');
          if (!await waitUntil(() => !groupExists(pid), 10000)) throw new Error(`試験サーバーのプロセスグループ${pid}が終了しません。`);
        }
      }
      await closed;
      const portFree = await waitUntil(async () => {
        try { await assertPortFree(port); return true; } catch { return false; }
      }, 5000);
      if (!portFree) throw new Error(`試験用ポート${port}が解放されません。buildへは進みません。`);
      console.log(JSON.stringify({ event: 'managed-server-stopped', pid, processGroupTerminated: true, port, portBindable: true }));
    })();
  }
  const onInt = () => { void cleanup().then(() => process.exit(130), error => { console.error(error); process.exit(1); }); };
  const onTerm = () => { void cleanup().then(() => process.exit(143), error => { console.error(error); process.exit(1); }); };
  process.once('SIGINT', onInt);
  process.once('SIGTERM', onTerm);
  try {
    console.log(JSON.stringify({ event: 'managed-server-started', pid, port, reused: false }));
    const ready = await waitUntil(async () => {
      if (spawnError) throw spawnError;
      if (server.exitCode !== null || server.signalCode !== null) throw new Error('試験サーバーが準備前に終了しました。');
      try { return (await fetch(`http://127.0.0.1:${port}${readyPath}`, { signal: AbortSignal.timeout(1500) })).ok; }
      catch { return false; }
    }, 120000);
    if (!ready) throw new Error('試験サーバーが120秒で準備できませんでした。DBの起動と設定を確認してください。');
    return await run({ pid, port });
  } finally {
    try { await cleanup(); }
    finally { process.removeListener('SIGINT', onInt); process.removeListener('SIGTERM', onTerm); }
  }
}
