import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { inspect, recommend, preview, savePlan, applyPlan, undo, stable, satisfies } from '../src/adapter.mjs';

function temporary(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'otoka-adapter-fixture-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return root;
}
function fixture(t, changes = {}, parent) {
  const base = parent ?? temporary(t);
  const root = path.join(base, `project-${fs.readdirSync(base).length}`);
  fs.mkdirSync(root);
  const pkg = {
    name: 'fictional-next', version: '1.0.0', private: true,
    dependencies: { next: '16.4.2', react: '19.3.1', 'react-dom': '19.3.1' },
    scripts: { dev: 'next dev' }, engines: { node: '24.22.0', npm: '11.17.0' }, packageManager: 'npm@11.17.0', ...changes,
  };
  fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify(pkg, null, 2));
  const top = { name: pkg.name, version: pkg.version, dependencies: pkg.dependencies, devDependencies: pkg.devDependencies, optionalDependencies: pkg.optionalDependencies };
  const packages = Object.fromEntries(Object.entries({ ...pkg.dependencies, ...pkg.devDependencies }).map(([name, spec]) => [`node_modules/${name}`, { version: spec.replace(/^[~^]/, ''), resolved: `https://registry.npmjs.org/${name}/-/fixture.tgz`, integrity: 'sha512-fixture-metadata-only' }]));
  fs.writeFileSync(path.join(root, 'package-lock.json'), JSON.stringify({ name: pkg.name, version: pkg.version, lockfileVersion: 3, packages: { '': top, ...packages } }, null, 2));
  fs.writeFileSync(path.join(root, '.nvmrc'), '24.22.0\n');
  fs.mkdirSync(path.join(root, 'app'));
  fs.writeFileSync(path.join(root, 'app', 'page.tsx'), 'export default function Page(){return <p>fixture</p>}\n');
  fs.writeFileSync(path.join(root, 'tsconfig.json'), '{"compilerOptions":{"strict":true}}\n');
  fs.writeFileSync(path.join(root, '.env'), 'PRIVATE_SAMPLE=do-not-collect-this-sentinel\n');
  return root;
}
function tree(root, excludeGenerated = false) {
  const result = {};
  const visit = relative => {
    for (const entry of fs.readdirSync(path.join(root, relative), { withFileTypes: true })) {
      if (excludeGenerated && entry.name === '.devcontainer' && !relative) continue;
      const name = path.join(relative, entry.name);
      if (entry.isSymbolicLink()) result[name] = `symlink:${fs.readlinkSync(path.join(root, name))}`;
      else if (entry.isDirectory()) { result[`${name}/`] = 'directory'; visit(name); }
      else result[name] = createHash('sha256').update(fs.readFileSync(path.join(root, name))).digest('hex');
    }
  };
  visit(''); return result;
}
function reseal(plan) {
  const changed = structuredClone(plan); delete changed.planId;
  return { ...changed, planId: createHash('sha256').update(stable(changed)).digest('hex') };
}

test('E01: compatible single Next/npm has evidence and a bounded proposal', t => {
  const root = fixture(t);
  const found = inspect(root);
  assert.equal(found.detected, 'next'); assert.equal(found.applySupported, true);
  assert.equal(found.evidence.nextResolved, '16.4.2'); assert.equal(found.evidence.configurationEvaluated, false);
  assert.equal(recommend(root).candidates[0].id, 'existing-next-npm');
  const plan = preview(root, { port: 3091 });
  assert.equal(plan.files.length, 6);
  assert.ok(plan.files.every(f => f.path.startsWith('.devcontainer/')));
  assert.match(plan.files.find(f => f.path.endsWith('compose.yaml')).content, /127\.0\.0\.1:3091:3000/);
  assert.match(plan.lifecycle.join('\n'), /npm ci/);
});

test('E02: Vite, React-only, general Node are distinct and cannot auto-apply', t => {
  for (const [dependencies, scripts, expected] of [
    [{ vite: '7.3.1', react: '19.3.1' }, { dev: 'vite' }, 'vite'],
    [{ react: '19.3.1' }, { dev: 'node app.js' }, 'react-only'],
    [{}, { dev: 'node app.js' }, 'node'],
  ]) {
    const root = fixture(t, { dependencies, scripts });
    const result = inspect(root); assert.equal(result.detected, expected); assert.equal(result.applySupported, false);
  }
});

test('E03: conflicting lockfiles, runtime and manager cannot be forced', t => {
  const locks = fixture(t); fs.writeFileSync(path.join(locks, 'yarn.lock'), 'fixture');
  assert.ok(inspect(locks).reasons.some(r => r.code === 'LOCKFILE_CONFLICT'));
  assert.throws(() => preview(locks), { code: 'MANUAL_REQUIRED' });
  const runtime = fixture(t); fs.writeFileSync(path.join(runtime, '.nvmrc'), '22.0.0');
  assert.ok(inspect(runtime).reasons.some(r => r.code === 'RUNTIME_FILE_CONFLICT'));
  const manager = fixture(t, { packageManager: 'pnpm@10.0.0' });
  assert.equal(inspect(manager).applySupported, false);
  const inconsistent = fixture(t);
  const p = path.join(inconsistent, 'package-lock.json'); const lock = JSON.parse(fs.readFileSync(p));
  lock.packages[''].dependencies.react = '18.0.0'; fs.writeFileSync(p, JSON.stringify(lock));
  assert.ok(inspect(inconsistent).reasons.some(r => r.code === 'LOCK_MISMATCH'));
});

test('E04: monorepo and existing Docker/Dev Container are preserved with next steps', t => {
  const mono = fixture(t, { workspaces: ['apps/*'] }); assert.equal(inspect(mono).detected, 'monorepo');
  const docker = fixture(t); fs.writeFileSync(path.join(docker, 'compose.prod.yaml'), 'services: {}');
  const before = tree(docker); const result = inspect(docker);
  assert.ok(result.reasons.some(r => r.code === 'EXISTING_DOCKER' && r.next));
  assert.throws(() => preview(docker), { code: 'MANUAL_REQUIRED' }); assert.deepEqual(tree(docker), before);
  const devcontainer = fixture(t); fs.mkdirSync(path.join(devcontainer, '.devcontainer'));
  fs.writeFileSync(path.join(devcontainer, '.devcontainer', 'devcontainer.json'), '{"name":"keep"}');
  assert.ok(inspect(devcontainer).reasons.some(r => r.code === 'EXISTING_DEVCONTAINER'));
});

test('E05: inspection and preview do not execute config JS or package lifecycle scripts', t => {
  const root = fixture(t, { scripts: { dev: 'next dev', postinstall: 'node -e "require(\'fs\').writeFileSync(\'SIDE_EFFECT\',\'bad\')"' } });
  fs.writeFileSync(path.join(root, 'next.config.js'), "require('fs').writeFileSync('SIDE_EFFECT','bad'); module.exports={};\n");
  fs.mkdirSync(path.join(root, 'node_modules')); fs.mkdirSync(path.join(root, '.git'));
  fs.writeFileSync(path.join(root, 'node_modules', 'trap.js'), "throw new Error('must not evaluate');");
  const before = tree(root);
  const output = JSON.stringify([inspect(root), preview(root)]);
  assert.equal(fs.existsSync(path.join(root, 'SIDE_EFFECT')), false);
  assert.equal(output.includes('do-not-collect-this-sentinel'), false);
  assert.deepEqual(tree(root), before);
  const custom = fixture(t, { scripts: { dev: 'next dev && touch SIDE_EFFECT' } });
  assert.equal(inspect(custom).applySupported, false);
  assert.equal(fs.existsSync(path.join(custom, 'SIDE_EFFECT')), false);
});

test('E06: inspect/recommend/preview do not write; plans must be outside project', t => {
  const root = fixture(t); const before = tree(root);
  inspect(root); recommend(root); const plan = preview(root);
  assert.throws(() => savePlan(plan, path.join(root, 'plan.json')), { code: 'OUTPUT_INSIDE_PROJECT' });
  const external = path.join(path.dirname(root), 'plan.json'); savePlan(plan, external);
  assert.deepEqual(tree(root), before);
  assert.throws(() => savePlan(plan, external), { code: 'EEXIST' });
});

test('E07: explicit apply adds only generated settings; all original hashes stay equal', t => {
  const root = fixture(t); const before = tree(root); const plan = preview(root, { port: 3092 });
  const result = applyPlan(root, plan); assert.equal(result.status, 'applied');
  assert.deepEqual(tree(root, true), before);
  assert.deepEqual(fs.readdirSync(path.join(root, '.devcontainer')).sort(), ['.adapter-record.json', 'Dockerfile', 'README.md', 'compose.yaml', 'devcontainer.json', 'initialize.sh', 'manage.sh'].sort());
});

test('E08: changed inputs, new output, newly appeared Docker config and moved roots reject stale plans', t => {
  for (const alteration of ['input', 'output', 'docker', 'config']) {
    const root = fixture(t);
    fs.writeFileSync(path.join(root, 'next.config.ts'), 'export default {};\n');
    const plan = preview(root);
    if (alteration === 'input') fs.appendFileSync(path.join(root, 'package.json'), '\n');
    if (alteration === 'output') fs.mkdirSync(path.join(root, '.devcontainer'));
    if (alteration === 'docker') fs.writeFileSync(path.join(root, 'Dockerfile'), 'FROM scratch');
    if (alteration === 'config') fs.appendFileSync(path.join(root, 'next.config.ts'), '// changed\n');
    const before = tree(root);
    assert.throws(() => applyPlan(root, plan)); assert.deepEqual(tree(root), before);
  }
  const root = fixture(t); const plan = preview(root); const moved = `${root}-moved`; fs.renameSync(root, moved);
  assert.throws(() => applyPlan(moved, plan), { code: 'PLAN_ROOT_CHANGED' });
});

test('E09: applying the same unchanged proposal is an unchanged success', t => {
  const root = fixture(t); const plan = preview(root); applyPlan(root, plan);
  const before = tree(root); assert.equal(applyPlan(root, plan).status, 'unchanged'); assert.deepEqual(tree(root), before);
  fs.appendFileSync(path.join(root, '.devcontainer', 'Dockerfile'), '# user change\n');
  const edited = tree(root); assert.throws(() => applyPlan(root, plan), { code: 'OUTPUT_CONFLICT' }); assert.deepEqual(tree(root), edited);
});

test('E10: undo preserves user edits/new files and removes only unchanged generated files', t => {
  const root = fixture(t); const before = tree(root); applyPlan(root, preview(root));
  const directory = path.join(root, '.devcontainer');
  fs.appendFileSync(path.join(directory, 'Dockerfile'), '# USER EDIT\n');
  fs.writeFileSync(path.join(directory, 'my-notes.txt'), 'keep');
  const result = undo(root); assert.equal(result.status, 'partial-preserved');
  assert.ok(result.preserved.includes('.devcontainer/Dockerfile'));
  assert.equal(fs.readFileSync(path.join(directory, 'my-notes.txt'), 'utf8'), 'keep');
  assert.match(fs.readFileSync(path.join(directory, 'Dockerfile'), 'utf8'), /USER EDIT/);
  assert.deepEqual(tree(root, true), before);
  const clean = fixture(t); const original = tree(clean); applyPlan(clean, preview(clean));
  assert.equal(undo(clean).status, 'undone'); assert.deepEqual(tree(clean), original);
});

test('E11: mid-write failure rolls back only created files and clears staging', t => {
  const root = fixture(t); const before = tree(root);
  assert.throws(() => applyPlan(root, preview(root), { testFailAfterFiles: 3 }), error => error.code === 'APPLY_FAILED' && error.details.removed.length === 3);
  assert.deepEqual(tree(root), before);
  assert.equal(fs.readdirSync(root).some(n => n.startsWith('.otoka-adapter-stage-')), false);
});

test('E11: path tampering and input/output symlinks never change outside files', t => {
  const base = temporary(t); const root = fixture(t, {}, base); const plan = preview(root);
  const outside = path.join(base, 'outside'); fs.mkdirSync(outside); fs.writeFileSync(path.join(outside, 'keep.txt'), 'outside-safe');
  const before = tree(outside);
  fs.symlinkSync(outside, path.join(root, '.devcontainer'));
  assert.throws(() => applyPlan(root, plan)); assert.deepEqual(tree(outside), before);
  fs.unlinkSync(path.join(root, '.devcontainer'));
  const bad = structuredClone(plan); bad.files[0].path = '../../outside/keep.txt';
  assert.throws(() => applyPlan(root, reseal(bad)), { code: 'PLAN_CONTENT_UNSAFE' }); assert.deepEqual(tree(outside), before);
  fs.unlinkSync(path.join(root, 'package.json')); fs.symlinkSync(path.join(outside, 'keep.txt'), path.join(root, 'package.json'));
  assert.equal(inspect(root).applySupported, false); assert.deepEqual(tree(outside), before);
  const alias = path.join(base, 'alias'); fs.symlinkSync(root, alias); assert.throws(() => inspect(alias));
});

test('E11: undo does not follow a generated file replaced with a symlink', t => {
  const base = temporary(t); const root = fixture(t, {}, base); applyPlan(root, preview(root));
  const outside = path.join(base, 'outside.txt'); fs.writeFileSync(outside, 'keep-outside');
  const target = path.join(root, '.devcontainer', 'README.md'); fs.unlinkSync(target); fs.symlinkSync(outside, target);
  const result = undo(root); assert.ok(result.preserved.includes('.devcontainer/README.md'));
  assert.equal(fs.readFileSync(outside, 'utf8'), 'keep-outside'); assert.ok(fs.lstatSync(target).isSymbolicLink());
});

test('Conservative versions, invalid JSON, invalid ports and edited records are rejected', t => {
  assert.equal(satisfies('24.22.0', '>=20.9.0 <25.0.0'), true);
  assert.equal(satisfies('24.22.0', '^22.0.0'), false);
  assert.equal(satisfies('24.22.0', 'lts/*'), null);
  const root = fixture(t); assert.throws(() => preview(root, { port: 80 }), { code: 'INVALID_PORT' });
  applyPlan(root, preview(root)); const record = path.join(root, '.devcontainer', '.adapter-record.json');
  const metadata = JSON.parse(fs.readFileSync(record)); metadata.files.Dockerfile = '0'.repeat(64); fs.writeFileSync(record, JSON.stringify(metadata));
  assert.throws(() => undo(root), { code: 'RECORD_CHANGED' });
  const invalid = fixture(t); fs.writeFileSync(path.join(invalid, 'package.json'), '{');
  assert.equal(inspect(invalid).applySupported, false);
});

test('E03: partial comparators are manual and cannot silently widen npm engine ranges', t => {
  for (const range of ['>24', '<=24.22', '>=24', '<25', '=24.22', '24.22.0 || unknown']) {
    assert.equal(satisfies('24.22.0', range), null, range);
    const root = fixture(t, { engines: { node: range, npm: '11.17.0' } });
    assert.ok(inspect(root).reasons.some(r => r.code === 'ENGINE_CONFLICT'));
    assert.throws(() => preview(root), { code: 'MANUAL_REQUIRED' });
  }
  assert.equal(satisfies('24.22.0', '>24.22.0'), false);
  assert.equal(satisfies('24.22.0', '>=24.22.0 <25.0.0'), true);
  assert.equal(satisfies('24.22.0', '024.22.0'), null);
});

test('E03/E05/E08: dotenv Compose keys block application without collecting secret values', t => {
  const root = fixture(t); const plan = preview(root); const dotenv = path.join(root, '.env');
  const content = 'PRIVATE_SAMPLE=do-not-collect-this-sentinel\nexport COMPOSE_PROJECT_NAME=do-not-collect-project-sentinel\n';
  fs.writeFileSync(dotenv, content);
  const found = inspect(root);
  assert.equal(found.applySupported, false);
  assert.ok(found.reasons.some(r => r.code === 'COMPOSE_DOTENV_CONFLICT'));
  assert.equal(JSON.stringify(found).includes('do-not-collect'), false);
  assert.throws(() => applyPlan(root, plan), { code: 'INPUT_DRIFT' });
  assert.equal(fs.readFileSync(dotenv, 'utf8'), content);
});

test('E11: generated start/stop guards reject inherited and dotenv Compose overrides before Docker', t => {
  const root = fixture(t); applyPlan(root, preview(root));
  const sentinel = path.join(root, 'DOCKER_MUST_NOT_RUN');
  const bin = path.join(root, 'fake-bin'); fs.mkdirSync(bin);
  fs.writeFileSync(path.join(bin, 'docker'), '#!/bin/sh\ntouch "$OTOKA_GUARD_SENTINEL"\nexit 42\n', { mode: 0o755 });
  const baseEnv = { ...process.env, PATH: `${bin}:${process.env.PATH}`, OTOKA_GUARD_SENTINEL: sentinel };
  for (const key of Object.keys(baseEnv)) if (key.startsWith('COMPOSE_') || ['PROJECT_NAME', 'HOST_PORT'].includes(key)) delete baseEnv[key];
  const guarded = env => {
    for (const script of ['initialize.sh', 'manage.sh']) {
      const result = spawnSync('bash', [path.join(root, '.devcontainer', script), 'stop'], { cwd: root, env, encoding: 'utf8' });
      assert.equal(result.status, 1, result.stderr);
      assert.equal(fs.existsSync(sentinel), false);
      assert.equal(`${result.stdout}${result.stderr}`.includes('secret-value-sentinel'), false);
    }
  };
  for (const key of ['COMPOSE_PROJECT_NAME', 'COMPOSE_FILE', 'COMPOSE_ENV_FILES', 'PROJECT_NAME', 'HOST_PORT']) guarded({ ...baseEnv, [key]: 'secret-value-sentinel' });
  for (const content of ['COMPOSE_PROJECT_NAME=secret-value-sentinel\n', '\uFEFFexport COMPOSE_ENV_FILES=secret-value-sentinel\n', '"COMPOSE_PROJECT_NAME"=secret-value-sentinel\n']) {
    fs.writeFileSync(path.join(root, '.env'), content); guarded(baseEnv);
  }
});
