import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { zipSync, strToU8 } from 'fflate';
import { create, hash } from '../src/generator.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
function fixture(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tsukuhako-generator-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  return dir;
}

test('必須6構成を日本語・空白パスへ生成し、カタログの版とフォルダ識別を保持する', (t) => {
  const dir = fixture(t);
  const entries = JSON.parse(fs.readFileSync(path.join(root, 'catalog.json'))).templates;
  for (const id of ['F1', 'F2', 'B1', 'S1', 'S2', 'I1']) {
    const target = path.join(dir, `${id} 新規 教材`);
    const result = create(root, id, target, { name: 'study', port: id === 'I1' ? 55499 : 34999 });
    const item = entries.find((entry) => entry.id === id);
    const metadata = JSON.parse(fs.readFileSync(path.join(target, id === 'I1' ? 'template.json' : 'VERSION.json')));
    assert.equal(metadata.version, item.implementationVersion);
    assert.ok(fs.existsSync(path.join(target, '.devcontainer/devcontainer.json')));
    assert.match(fs.readFileSync(path.join(target, '.env'), 'utf8'), new RegExp(`PROJECT_NAME=${result.project}`));
    assert.equal(fs.statSync(path.join(target, '.env')).mode & 0o777, 0o600);
    if (id === 'I1') {
      const checked = spawnSync('bash', ['scripts/configure.sh'], { cwd: target, encoding: 'utf8' });
      assert.equal(checked.status, 0, checked.stderr);
    }
    t.diagnostic(`${id}: version ${metadata.version}, ZIP SHA256 ${item.packageSha256}, Japanese/space path PASS`);
  }
});

test('既存の空フォルダ・ファイル・symlink親は拒否し保持する', (t) => {
  const dir = fixture(t);
  fs.mkdirSync(path.join(dir, 'exists'));
  fs.writeFileSync(path.join(dir, 'keep'), 'keep');
  fs.symlinkSync(path.join(dir, 'exists'), path.join(dir, 'link'));
  for (const [dest,code] of [['exists','DESTINATION_EXISTS'], ['keep','DESTINATION_EXISTS'], ['link/new','UNSAFE_DESTINATION']]) {
    assert.throws(() => create(root, 'F1', path.join(dir, dest)), {code});
  }
  assert.equal(fs.readFileSync(path.join(dir, 'keep'), 'utf8'), 'keep');
  assert.deepEqual(fs.readdirSync(path.join(dir, 'exists')), []);
});

test('名前・ポート・構成・DBポートの不正値で出力を作らない', (t) => {
  const dir = fixture(t); const target = path.join(dir, 'new');
  for (const [id, opts] of [['F1', { name: '../bad' }], ['F1', { port: 80 }], ['F1', { dbBase: 54320 }], ['S2', { port: 54321 }], ['S2', { dbBase: 65534 }], ['S3', {}]]) assert.throws(() => create(root, id, target, opts));
  assert.equal(fs.existsSync(target), false);
});

test('カタログSHA256不一致を展開前に拒否する', (t) => {
  const dir = fixture(t); const fake = path.join(dir, 'package'); fs.mkdirSync(fake); fs.mkdirSync(path.join(fake, 'dist'));
  const cat = JSON.parse(fs.readFileSync(path.join(root, 'catalog.json')));
  fs.writeFileSync(path.join(fake, 'catalog.json'), JSON.stringify(cat));
  fs.writeFileSync(path.join(fake, cat.templates.find((x) => x.id === 'F1').packagePath), 'tampered');
  assert.throws(() => create(fake, 'F1', path.join(dir, 'new')), /SHA256/);
  assert.equal(fs.existsSync(path.join(dir, 'new')), false);
});

test('ZIPの上位パスと実.envを拒否する', (t) => {
  const dir = fixture(t); const fake = path.join(dir, 'package'); fs.mkdirSync(fake); fs.mkdirSync(path.join(fake, 'dist'));
  for (const name of ['F1/../escaped.txt', 'F1/.env', '/absolute.txt']) {
    const bytes = zipSync({ [name]: strToU8('unsafe') });
    const cat = JSON.parse(fs.readFileSync(path.join(root, 'catalog.json')));
    cat.templates.find((x) => x.id === 'F1').packageSha256 = hash(bytes);
    fs.writeFileSync(path.join(fake, 'catalog.json'), JSON.stringify(cat));
    fs.writeFileSync(path.join(fake, cat.templates.find((x) => x.id === 'F1').packagePath), bytes);
    assert.throws(() => create(fake, 'F1', path.join(dir, 'new')), /パス|実設定/);
  }
  assert.equal(fs.existsSync(path.join(dir, 'escaped.txt')), false);
});

test('コミット途中の失敗は作成物とstageを戻す', (t) => {
  const dir = fixture(t); const target = path.join(dir, 'new');
  assert.throws(() => create(root, 'F1', target, {}, { afterFile(_p, n) { if (n === 4) throw new Error('injected disk failure'); } }), /injected/);
  assert.deepEqual(fs.readdirSync(dir), []);
});

test('確定直前に出力先が作成された競合を拒否し、他の内容を残す', (t) => {
  const dir = fixture(t); const target = path.join(dir, 'new');
  assert.throws(() => create(root, 'F1', target, {}, { beforeCommit(p) { fs.mkdirSync(p); fs.writeFileSync(path.join(p, 'user.txt'), 'keep'); } }), /EEXIST/);
  assert.equal(fs.readFileSync(path.join(target, 'user.txt'), 'utf8'), 'keep');
  assert.deepEqual(fs.readdirSync(dir), ['new']);
});

test('失敗時でも作成中に利用者が変更したファイルを削除しない', (t) => {
  const dir = fixture(t); const target = path.join(dir, 'new'); let changed;
  assert.throws(() => create(root, 'F1', target, {}, { afterFile(p) { changed=p; fs.writeFileSync(p, 'user change'); throw new Error('interrupted'); } }), /interrupted/);
  assert.equal(fs.readFileSync(changed, 'utf8'), 'user change');
  assert.equal(fs.readdirSync(dir).some((x) => x.startsWith('.tsukuhako-stage')), false);
});
