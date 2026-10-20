import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { inspect, preview, applyPlan, undo, stable } from '../src/adapter.mjs';

const sha = value => createHash('sha256').update(value).digest('hex');
function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'otoka-adapter-revision-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const pkg = { name: 'optional-fixture', version: '1.0.0', private: true, scripts: { dev: 'next dev' }, dependencies: { next: '16.4.2', react: '19.3.1', 'react-dom': '19.3.1' } };
  const packages = Object.fromEntries(Object.entries(pkg.dependencies).map(([name, version]) => [`node_modules/${name}`, { version, resolved: `https://registry.npmjs.org/${name}/-/fixture.tgz`, integrity: 'sha512-fixture-metadata-only' }]));
  fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify(pkg, null, 2));
  fs.writeFileSync(path.join(root, 'package-lock.json'), JSON.stringify({ name: pkg.name, version: pkg.version, lockfileVersion: 3, packages: { '': { name: pkg.name, version: pkg.version, dependencies: pkg.dependencies }, ...packages } }, null, 2));
  fs.mkdirSync(path.join(root, 'app'));
  fs.writeFileSync(path.join(root, 'app/page.tsx'), 'import helper from "local-helper"; export default function Page(){return <p>{helper}</p>}\n');
  return root;
}
function optional(root, spec, resolved = { version: '1.0.0', resolved: 'https://registry.npmjs.org/local-helper/-/local-helper-1.0.0.tgz', optional: true }, dependencySpec) {
  const pkgPath = path.join(root, 'package.json'); const lockPath = path.join(root, 'package-lock.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath)); const lock = JSON.parse(fs.readFileSync(lockPath));
  if (dependencySpec) pkg.dependencies['local-helper'] = dependencySpec;
  pkg.optionalDependencies = { 'local-helper': spec };
  lock.packages[''].optionalDependencies = pkg.optionalDependencies;
  // npm stores the effective optional declaration separately from dependencies.
  delete lock.packages[''].dependencies['local-helper'];
  if (resolved) lock.packages['node_modules/local-helper'] = resolved;
  else delete lock.packages['node_modules/local-helper'];
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2)); fs.writeFileSync(lockPath, JSON.stringify(lock, null, 2));
}
function hashes(root, includeSettings = true) {
  const result = {};
  const visit = dir => { for (const item of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
    if (!includeSettings && !dir && item.name === '.devcontainer') continue;
    const name = path.join(dir, item.name);
    if (item.isDirectory()) { result[`${name}/`] = 'directory'; visit(name); }
    else result[name] = sha(fs.readFileSync(path.join(root, name)));
  } };
  visit(''); return result;
}
function refreshPlan(plan, root) {
  const result = { ...plan, snapshot: inspect(root).snapshot }; delete result.planId;
  return { ...result, planId: sha(stable(result)) };
}

test('R1: local optional dependency is refused by inspect, preview and explicit apply without writes', t => {
  const root = fixture(t); const oldPlan = preview(root);
  optional(root, 'file:../local-helper', { resolved: '../local-helper', link: true });
  const before = hashes(root);
  const result = inspect(root);
  assert.equal(result.applySupported, false);
  assert.ok(result.reasons.some(r => r.code === 'UNSUPPORTED_DEPENDENCY' && r.evidence.includes('local-helper')));
  assert.throws(() => preview(root), { code: 'MANUAL_REQUIRED' });
  assert.throws(() => applyPlan(root, refreshPlan(oldPlan, root)), { code: 'NO_LONGER_SUPPORTED' });
  assert.deepEqual(hashes(root), before);
});

test('R1: optional file/link/workspace/git/URL and local lock resolutions are out of scope', t => {
  for (const spec of ['file:../local-helper', 'link:../local-helper', 'workspace:*', 'git+https://example.invalid/helper.git', 'github:example/helper', 'example/helper', 'https://example.invalid/helper.tgz']) {
    const root = fixture(t); optional(root, spec); const before = hashes(root);
    assert.equal(inspect(root).applySupported, false, spec);
    assert.throws(() => preview(root), { code: 'MANUAL_REQUIRED' }); assert.deepEqual(hashes(root), before);
  }
  for (const resolved of [{ version: '1.0.0', resolved: 'file:../local-helper' }, { version: '1.0.0', resolved: '../local-helper' }, { version: '1.0.0', resolved: 'git+https://example.invalid/helper.git' }, { version: '1.0.0', link: true }]) {
    const root = fixture(t); optional(root, '1.0.0', resolved);
    assert.equal(inspect(root).applySupported, false);
  }
});

test('R1: optional range mismatch and missing resolution require manual review', t => {
  for (const resolved of [null, { version: '2.0.0', optional: true }]) {
    const root = fixture(t); optional(root, '^1.0.0', resolved);
    assert.equal(inspect(root).applySupported, false);
    assert.throws(() => preview(root), { code: 'MANUAL_REQUIRED' });
  }
});

test('R1: normal registry and OS-limited optional packages remain supported', t => {
  for (const constraints of [{}, { os: ['darwin'], cpu: ['arm64'] }]) {
    const root = fixture(t);
    optional(root, '^1.0.0', { version: '1.2.0', resolved: 'https://registry.npmjs.org/local-helper/-/local-helper-1.2.0.tgz', optional: true, ...constraints });
    const before = hashes(root);
    assert.equal(inspect(root).applySupported, true);
    assert.equal(applyPlan(root, preview(root)).status, 'applied');
    assert.deepEqual(hashes(root, false), before);
  }
});

test('R1: npm optional override takes precedence over a same-name dependency', t => {
  const root = fixture(t);
  optional(root, '^2.0.0', { version: '2.1.0', resolved: 'https://registry.npmjs.org/local-helper/-/local-helper-2.1.0.tgz', optional: true }, '^1.0.0');
  assert.equal(inspect(root).applySupported, true);
  const blocked = fixture(t);
  optional(blocked, 'file:../local-helper', { resolved: '../local-helper', link: true }, '^1.0.0');
  assert.equal(inspect(blocked).applySupported, false);
});

test('P3: userNote added to the adapter record survives undo byte-for-byte', t => {
  const root = fixture(t); const before = hashes(root); const plan = preview(root); applyPlan(root, plan);
  const recordPath = path.join(root, '.devcontainer/.adapter-record.json');
  const record = JSON.parse(fs.readFileSync(recordPath)); record.userNote = '利用者が残したメモ 😀';
  fs.writeFileSync(recordPath, JSON.stringify(record, null, 2) + '\n'); const edited = fs.readFileSync(recordPath);
  assert.throws(() => applyPlan(root, plan), { code: 'OUTPUT_CONFLICT' });
  assert.deepEqual(fs.readFileSync(recordPath), edited);
  const result = undo(root);
  assert.equal(result.status, 'partial-preserved');
  assert.ok(result.preserved.includes('.devcontainer/.adapter-record.json'));
  assert.deepEqual(fs.readFileSync(recordPath), edited); assert.deepEqual(hashes(root, false), before);
  assert.equal(result.removed.length, 6);
});

test('P3: an interrupted-apply pending record with a note is preserved', t => {
  const root = fixture(t); applyPlan(root, preview(root));
  const complete = path.join(root, '.devcontainer/.adapter-record.json');
  const pending = path.join(root, '.devcontainer/.adapter-pending.json');
  const record = JSON.parse(fs.readFileSync(complete)); delete record.recordHash; record.state = 'pending';
  record.recordHash = sha(stable(record));
  fs.writeFileSync(pending, JSON.stringify(record, null, 2) + '\n'); fs.unlinkSync(complete);
  record.userNote = '復旧前のメモ'; fs.writeFileSync(pending, JSON.stringify(record, null, 2) + '\n');
  const edited = fs.readFileSync(pending); const result = undo(root);
  assert.equal(result.status, 'partial-preserved');
  assert.ok(result.preserved.includes('.devcontainer/.adapter-pending.json'));
  assert.deepEqual(fs.readFileSync(pending), edited);
});

test('P3: record formatting edits are preserved and a clean record is removed', t => {
  const root = fixture(t); applyPlan(root, preview(root));
  const record = path.join(root, '.devcontainer/.adapter-record.json'); fs.appendFileSync(record, '\n');
  const edited = fs.readFileSync(record); const result = undo(root);
  assert.equal(result.status, 'partial-preserved'); assert.deepEqual(fs.readFileSync(record), edited);
  const clean = fixture(t); const before = hashes(clean); applyPlan(clean, preview(clean));
  assert.equal(undo(clean).status, 'undone'); assert.deepEqual(hashes(clean), before);
});

test('P3: changing a managed record field stops undo without removing any file', t => {
  const root = fixture(t); applyPlan(root, preview(root));
  const filename = path.join(root, '.devcontainer/.adapter-record.json');
  const record = JSON.parse(fs.readFileSync(filename)); record.inputFingerprint = '0'.repeat(64);
  fs.writeFileSync(filename, JSON.stringify(record, null, 2) + '\n'); const before = hashes(root);
  assert.throws(() => undo(root), { code: 'RECORD_CHANGED' });
  assert.deepEqual(hashes(root), before);
});
