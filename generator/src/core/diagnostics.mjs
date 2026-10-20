import fs from 'node:fs';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { loadCatalog } from './catalog.mjs';
import { archiveFiles, planGeneration } from './plan.mjs';

const active = new Set();
process.once('exit', () => { for (const pid of active) { try { process.kill(process.platform === 'win32' ? pid : -pid, 'SIGKILL'); } catch {} } });

export function runProbe(executable, args, timeout = 5000) {
  return new Promise(resolve => {
    let output = '', finished = false, timedOut = false, force;
    const child = spawn(executable, args, { shell: false, detached: process.platform !== 'win32', stdio: ['ignore', 'pipe', 'ignore'] });
    if (child.pid) active.add(child.pid);
    const signal = name => { try { process.kill(process.platform === 'win32' ? child.pid : -child.pid, name); } catch { /* already exited */ } };
    const timer = setTimeout(() => { timedOut = true; signal('SIGTERM'); force = setTimeout(() => signal('SIGKILL'), 300); }, timeout);
    child.stdout.on('data', chunk => {
      output += chunk.toString();
      if (output.length > 256000) { output = output.slice(0, 256000); signal('SIGKILL'); }
    });
    const done = ok => {
      if (finished) return;
      finished = true; clearTimeout(timer); clearTimeout(force); signal('SIGKILL'); active.delete(child.pid);
      resolve({ ok: ok && !timedOut, output, timedOut });
    };
    child.once('error', () => done(false));
    child.once('close', code => done(code === 0));
  });
}
export function probePort(port) {
  return new Promise(resolve => {
    const server = createServer();
    server.once('error', () => resolve(false));
    server.listen({ host: '127.0.0.1', port, exclusive: true }, () => server.close(() => resolve(true)));
  });
}
export async function diagnoseHost(root, request, { scope = 'all', runner = runProbe, portProbe = probePort } = {}) {
  const checks = [];
  const add = (id, group, status, message, nextAction) => checks.push({ id, scope: group, status, message, ...(nextAction ? { nextAction } : {}) });
  add('node', 'generation', Number(process.versions.node.split('.')[0]) >= 22 ? 'PASS' : 'FAIL', `実行基盤 Node ${process.versions.node}`);
  add('cksum', 'generation', 'PASS', '同梱のPOSIX cksum実装を利用します。');
  try {
    const catalog = loadCatalog(root);
    for (const template of catalog.templates.filter(t => t.generatorEligible && t.id !== 'S3')) archiveFiles(root, template);
    add('bundle', 'generation', 'PASS', 'カタログと配布ZIPの整合を確認しました。');
  } catch (error) { add('bundle', 'generation', 'FAIL', error.message, '完全な配布物を展開し直してください。'); }
  let plan;
  if (request) {
    try {
      plan = planGeneration(root, request);
      fs.accessSync(plan.parentIdentity.path, fs.constants.W_OK);
      add('destination', 'generation', 'PASS', '入力・保存先・親フォルダを確認しました。書込み成功の保証ではありません。');
    } catch (error) { add('destination', 'generation', 'FAIL', error.code ? error.message : '親フォルダへの書込権限を確認できません。', '入力と保存先の権限を確認してください。'); }
  } else add('destination', 'generation', 'NOT_CHECKED', '保存先が未入力のため、生成先の条件は未確認です。');
  if (scope !== 'generation') {
    const commands = [
      ['docker', 'Docker daemon', 'docker', ['version', '--format', '{{.Server.Version}}']],
      ['compose', 'Docker Compose', 'docker', ['compose', 'version', '--short']],
      ['bash', 'bash', 'bash', ['--version']],
      ['code', 'VS Code', 'code', ['--version']],
      ['devcontainers-extension', 'Dev Containers拡張', 'code', ['--list-extensions']],
    ];
    if (request?.templateId === 'S2') for (const executable of ['curl', 'tar', 'sha256sum', 'timeout', 'awk', 'sed']) {
      commands.push([`s2-${executable}`, `S2: ${executable}`, executable, executable === 'awk' ? ['BEGIN {exit 0}'] : ['--version']]);
    }
    await Promise.all(commands.map(async ([id, label, executable, args]) => {
      const result = await runner(executable, args);
      const ok = result.ok && (id !== 'devcontainers-extension' || result.output.split(/\r?\n/).includes('ms-vscode-remote.remote-containers'));
      add(id, 'runtime', ok ? 'PASS' : 'FAIL', `${label}: ${ok ? '確認済み' : result.timedOut ? '時間内に確認できませんでした' : '未導入・未接続または未確認'}`, ok ? undefined : 'ファイルの作成はできます。コンテナを開く前にREADMEの準備手順を確認してください。');
    }));
    if (plan) {
      for (const [name, port] of Object.entries(plan.ports)) {
        const available = await portProbe(port);
        add(`port-${name}`, 'runtime', available ? 'PASS' : 'FAIL', `${name} ${port}: ${available ? '現在は利用可能（予約なし）' : '使用中または確認不可'}`, available ? undefined : '詳細設定で未使用のポートへ変更してください。');
      }
    } else add('ports', 'runtime', 'NOT_CHECKED', '構成と保存先が未確定のため、ポートは未確認です。');
  } else add('runtime', 'runtime', 'NOT_CHECKED', '起動準備の診断は指定範囲外です。');
  checks.sort((a, b) => a.id.localeCompare(b.id));
  const ready = group => {
    const rows = checks.filter(c => c.scope === group);
    return rows.some(c => c.status === 'FAIL') ? false : rows.some(c => c.status === 'NOT_CHECKED') ? null : true;
  };
  return { generationReady: ready('generation'), runtimeReady: ready('runtime'), checks };
}
