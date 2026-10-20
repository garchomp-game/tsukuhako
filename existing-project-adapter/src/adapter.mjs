import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { RUNTIME, renderFiles } from './templates.mjs';

export const VERSION = '0.1.1';
const RECORD = '.adapter-record.json';
const PENDING = '.adapter-pending.json';
const OUTPUT_NAMES = ['Dockerfile', 'devcontainer.json', 'compose.yaml', 'initialize.sh', 'manage.sh', 'README.md'];
const INPUT_NAMES = [
  'package.json', 'package-lock.json', '.nvmrc', '.node-version', '.tool-versions',
  'yarn.lock', 'pnpm-lock.yaml', 'bun.lock', 'bun.lockb', 'npm-shrinkwrap.json',
  'pnpm-workspace.yaml', 'lerna.json', 'nx.json', 'turbo.json', '.devcontainer.json',
  'next.config.js', 'next.config.mjs', 'next.config.cjs', 'next.config.ts',
  'vite.config.js', 'vite.config.mjs', 'vite.config.ts', 'vite.config.mts',
];
const KNOWN_DEV = new Set([
  'next dev', 'next dev --hostname 0.0.0.0', 'next dev -H 0.0.0.0',
  'next dev --turbopack', 'next dev --turbopack --hostname 0.0.0.0',
]);
const hash = data => createHash('sha256').update(data).digest('hex');
const ordered = value => Array.isArray(value) ? value.map(ordered) : value && typeof value === 'object'
  ? Object.fromEntries(Object.keys(value).sort().map(key => [key, ordered(value[key])])) : value;
export const stable = value => JSON.stringify(ordered(value));
const fingerprint = value => hash(stable(value));
const exists = name => { try { return fs.lstatSync(name); } catch (error) { if (error.code === 'ENOENT') return null; throw error; } };

export class AdapterError extends Error {
  constructor(code, message, details = {}) { super(message); this.name = 'AdapterError'; this.code = code; this.details = details; }
}
const fail = (code, message, details) => { throw new AdapterError(code, message, details); };

function readRegular(filename, encoding) {
  const fd = fs.openSync(filename, fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW ?? 0));
  try {
    const stat = fs.fstatSync(fd);
    if (!stat.isFile() || stat.size > 20 * 1024 * 1024) fail('UNSAFE_READ', '通常の20MiB以下のファイルだけを読み取ります。');
    return fs.readFileSync(fd, encoding);
  } finally { fs.closeSync(fd); }
}

export function canonicalRoot(input) {
  const absolute = path.resolve(input);
  const stat = exists(absolute);
  if (!stat || !stat.isDirectory() || stat.isSymbolicLink()) fail('UNSAFE_ROOT', '対象は実在する通常のディレクトリを指定してください。symlink は使用しません。');
  const real = fs.realpathSync(absolute);
  if (real !== absolute) fail('SYMLINK_ROOT', '対象パスまたは親に symlink があります。実体のパスを指定してください。');
  return real;
}

function stateFor(root, name) {
  const full = path.join(root, name);
  const stat = exists(full);
  if (!stat) return { kind: 'missing' };
  if (stat.isSymbolicLink()) return { kind: 'symlink' };
  if (!stat.isFile()) return { kind: stat.isDirectory() ? 'directory' : 'special' };
  if (stat.size > 20 * 1024 * 1024) return { kind: 'too-large', size: stat.size };
  // Only an allowlist of project metadata/configs is hashed here.
  return { kind: 'file', sha256: hash(readRegular(full)) };
}

function composeEnvState(root) {
  const full = path.join(root, '.env');
  const stat = exists(full);
  if (!stat) return { kind: 'missing' };
  if (stat.isSymbolicLink()) return { kind: 'symlink' };
  if (!stat.isFile() || stat.size > 1024 * 1024) return { kind: 'unsafe' };
  // Keep only reserved key names. Never report/hash/store dotenv values.
  const keys = [...readRegular(full, 'utf8').matchAll(/^[\uFEFF\t ]*(?:export[\t ]+)?["']?(COMPOSE_[A-Za-z0-9_]+)/gm)].map(match => match[1]);
  return { kind: 'file', reservedKeys: [...new Set(keys)].sort() };
}

export function snapshot(input) {
  const root = canonicalRoot(input);
  const stat = fs.statSync(root);
  const top = fs.readdirSync(root);
  const dockerNames = top.filter(name => /^(?:dockerfile(?:[.-].*)?|(?:docker-)?compose(?:[.-].*)?\.ya?ml)$/i.test(name)).sort();
  const names = [...new Set([...INPUT_NAMES, ...dockerNames])].sort();
  const files = Object.fromEntries(names.map(name => [name, stateFor(root, name)]));
  const directories = Object.fromEntries(['apps', 'packages'].map(name => [name, Boolean(exists(path.join(root, name)))]));
  return { root: { path: root, device: String(stat.dev), inode: String(stat.ino) }, files, dockerNames, directories, composeEnv: composeEnvState(root) };
}

function jsonFile(root, name, states, reasons) {
  const state = states[name];
  if (state?.kind !== 'file') {
    reasons.push({ code: 'MISSING_OR_UNSAFE_INPUT', path: name, message: `${name} が通常の読取可能なファイルではありません。`, next: '必要な設定を確認し、symlink・特殊ファイルを使わず再判定してください。' });
    return null;
  }
  try {
    const value = JSON.parse(readRegular(path.join(root, name), 'utf8'));
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('object required');
    return value;
  } catch {
    reasons.push({ code: 'INVALID_JSON', path: name, message: `${name} を JSON object として解析できません。`, next: 'JSON を修正して再提案してください。' });
    return null;
  }
}

const version = value => typeof value === 'string' && /^v?(?:0|[1-9]\d*)(?:\.(?:0|[1-9]\d*)){0,2}$/.test(value)
  ? value.replace(/^v/, '').split('.').map(Number).concat([0, 0]).slice(0, 3) : null;
const cmp = (a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2];

// Deliberately small range grammar. Unknown syntax is manual review, not guessed.
export function satisfies(target, range) {
  if (typeof range !== 'string' || range.length > 200) return null;
  const value = version(target);
  if (!value) return null;
  const alternatives = range.trim().split(/\s*\|\|\s*/);
  const results = alternatives.map(part => {
    if (part === '*' || /^(?:0|[1-9]\d*)(?:\.(?:x|\*))$/.test(part)) return part === '*' || value[0] === Number(part.split('.')[0]);
    if (version(part)) {
      const digits = part.replace(/^v/, '').split('.').map(Number);
      return digits.every((n, i) => value[i] === n);
    }
    if (/^[~^]\d+\.\d+\.\d+$/.test(part) && version(part.slice(1))) {
      const lower = version(part.slice(1));
      if (lower[0] === 0 && part[0] === '^') return null;
      const upper = part[0] === '^' ? [lower[0] + 1, 0, 0] : [lower[0], lower[1] + 1, 0];
      return cmp(value, lower) >= 0 && cmp(value, upper) < 0;
    }
    const tokens = part.trim().split(/\s+/);
    // Partial comparators such as >24 or <=24.22 have special npm semantics.
    // Do not pad them with zero; require all three components or manual review.
    if (!tokens.length || tokens.some(t => !/^(?:>=|<=|>|<|=)\d+\.\d+\.\d+$/.test(t) || !version(t.replace(/^[><=]+/, '')))) return null;
    return tokens.every(token => {
      const [, op, text] = token.match(/^(>=|<=|>|<|=)(.*)$/);
      const n = cmp(value, version(text));
      return ({ '>=': n >= 0, '<=': n <= 0, '>': n > 0, '<': n < 0, '=': n === 0 })[op];
    });
  });
  if (results.includes(null)) return null;
  return results.includes(true);
}

function dependencyDeclarations(pkg, field) {
  const declarations = { ...(pkg?.[field] ?? {}) };
  // npm optionalDependencies overrides dependencies, and npm may omit the
  // overridden entries from packages[""] in the generated lockfile.
  if (field === 'dependencies') for (const name of Object.keys(pkg?.optionalDependencies ?? {})) delete declarations[name];
  return declarations;
}

const nonRegistrySpec = spec => typeof spec !== 'string' || /^(?:[a-z][a-z0-9+.-]*:)|[/\\]/i.test(spec.trim());
const nonRegistryResolution = resolved => resolved !== undefined &&
  (typeof resolved !== 'string' || !/^https?:\/\/[^/]+\/.+/i.test(resolved));

export function inspect(input) {
  const observed = snapshot(input);
  const root = observed.root.path;
  const reasons = [];
  const reason = (code, message, next, evidence = []) => reasons.push({ code, message, next, evidence });
  if (!['missing', 'file'].includes(observed.composeEnv.kind) || observed.composeEnv.reservedKeys?.length) reason('COMPOSE_DOTENV_CONFLICT', '.env が安全に確認できないか、Compose の予約キーを含みます。値は収集しません。', '既存 .env は変更せず、Compose の環境変数との関係を所有者が手動で確認してください。', ['.env']);
  const pkg = jsonFile(root, 'package.json', observed.files, reasons);
  const declared = { ...(pkg?.dependencies ?? {}), ...(pkg?.devDependencies ?? {}), ...(pkg?.optionalDependencies ?? {}) };
  const optionalNames = Object.keys(pkg?.optionalDependencies ?? {});
  for (const name of optionalNames) {
    if (Object.hasOwn(pkg?.devDependencies ?? {}, name)) reason('OPTIONAL_DEV_OVERLAP', 'optionalDependencies と devDependencies に同名依存があります。初版では自動的に優先関係を選びません。', '所有者が重複した依存宣言を整理し、lockfileとの対応を確認してください。', [name]);
  }
  const next = typeof declared.next === 'string';
  const vite = typeof declared.vite === 'string';
  const workspace = Boolean(pkg?.workspaces || observed.directories.apps || observed.directories.packages ||
    ['pnpm-workspace.yaml', 'lerna.json', 'nx.json', 'turbo.json'].some(name => observed.files[name].kind !== 'missing'));
  let detected = workspace ? 'monorepo' : next && vite ? 'ambiguous' : next ? 'next' : vite ? 'vite' : declared.react ? 'react-only' : pkg ? 'node' : 'unknown';
  if (detected !== 'next') reason('UNSUPPORTED_KIND', `${detected} と判定しました。自動適用は単一の Next.js に限定します。`, 'Vite は F1、その他は手動 Dev Container を検討してください。monorepo は対象アプリと共有依存を先に整理します。');
  const output = exists(path.join(root, '.devcontainer'));
  if (output || observed.files['.devcontainer.json'].kind !== 'missing') reason('EXISTING_DEVCONTAINER', '既存 Dev Container 設定があります。', '既存設定を開き、サービス・ユーザー・起動手順を確認してください。自動マージしません。', ['.devcontainer', '.devcontainer.json']);
  if (observed.dockerNames.length) reason('EXISTING_DOCKER', '既存 Docker / Compose 構成があります。', '既存サービスと開発用 override の再利用を手動で検討してください。', observed.dockerNames);
  for (const [name, state] of Object.entries(observed.files)) {
    if (['symlink', 'special', 'directory', 'too-large'].includes(state.kind)) reason('UNSAFE_INPUT', `${name} は安全な通常ファイルとして読めません。`, '実体ファイルとサイズを確認して再提案してください。', [name]);
  }
  const lockNames = ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'bun.lock', 'bun.lockb', 'npm-shrinkwrap.json'].filter(name => observed.files[name].kind !== 'missing');
  if (lockNames.length !== 1 || lockNames[0] !== 'package-lock.json') reason('LOCKFILE_CONFLICT', 'package-lock.json だけを使う構成が必要です。', '利用者が依存管理を選び、競合を整理してください。選択オプションで検査を無効にしません。', lockNames);
  const lock = observed.files['package-lock.json'].kind === 'file' ? jsonFile(root, 'package-lock.json', observed.files, reasons) : null;
  if (lock && (![2, 3].includes(lock.lockfileVersion) || !lock.packages?.[''])) reason('LOCK_FORMAT', 'lockfileVersion 2/3 の packages 情報が必要です。', 'プロジェクト所有者が npm lockfile を確認してください。');
  if (lock?.packages?.[''] && pkg) {
    const top = lock.packages[''];
    for (const field of ['dependencies', 'devDependencies', 'optionalDependencies']) {
      if (stable(dependencyDeclarations(pkg, field)) !== stable(dependencyDeclarations(top, field))) reason('LOCK_MISMATCH', `${field} が package.json と lockfile で一致しません。`, '依存を更新せず停止しました。所有者が整合する lockfile を用意してください。', ['package.json', 'package-lock.json']);
    }
    if ((pkg.name && top.name !== pkg.name) || (pkg.version && top.version !== pkg.version)) reason('LOCK_IDENTITY', 'package の name/version が lockfile と一致しません。', 'プロジェクトの package/lock を確認してください。');
    for (const [name, spec] of Object.entries(declared)) {
      const locked = lock.packages[`node_modules/${name}`];
      if (nonRegistrySpec(spec) || locked?.link || nonRegistryResolution(locked?.resolved)) reason('UNSUPPORTED_DEPENDENCY', '直接依存（optionalを含む）にローカル・link・workspace・git・URL等の対象外参照があります。', '兄弟フォルダの自動mountや依存更新は行いません。所有者が単一npmプロジェクトの対応範囲を確認してください。', [name]);
      else if (!locked?.version) reason('DEPENDENCY_RESOLUTION_MISSING', '直接依存（optionalを含む）の解決版をlockfileで確認できません。', 'OS限定だけでは対象外にしませんが、解決版が欠ける場合は所有者がlockfileを確認してください。', [name]);
      else if (satisfies(locked.version, spec) !== true) reason('DIRECT_DEPENDENCY_MISMATCH', '直接依存の宣言とlock解決版が不整合、または範囲を静的に判定できません。', '所有者が依存宣言とlockを確認してください。自動更新しません。', [name]);
    }
  }
  const nextResolved = lock?.packages?.['node_modules/next']?.version;
  if (next && (!/^16\.4\.\d+$/.test(nextResolved ?? '') || satisfies(nextResolved, declared.next) !== true)) reason('NEXT_VERSION', '検証した Next.js 16.4.x と宣言/lock が適合していません。', '依存を自動更新せず、対応版を手動で検討してください。', ['package.json', 'package-lock.json']);
  const dev = pkg?.scripts?.dev;
  if (!KNOWN_DEV.has(dev)) reason('CUSTOM_DEV_SCRIPT', 'dev script を既知の Next.js 起動として静的に確定できません。', '既存スクリプトの前処理・引数・起動場所を所有者が確認してください。');
  for (const [name, target] of [['node', RUNTIME.node], ['npm', RUNTIME.npm]]) {
    if (pkg?.engines?.[name] !== undefined && satisfies(target, pkg.engines[name]) !== true) reason('ENGINE_CONFLICT', `${name} 指定が採用版 ${target} と適合しないか、範囲を判定できません。`, '版指定を手動で整理してください。自動更新しません。', ['package.json']);
    if (pkg?.volta?.[name] && pkg.volta[name] !== target) reason('VOLTA_CONFLICT', `Volta ${name} 指定と採用版が一致しません。`, '既存runtime managerの指定を尊重し、手動で方針を決めてください。', ['package.json']);
  }
  if (pkg?.packageManager && pkg.packageManager !== `npm@${RUNTIME.npm}`) reason('PACKAGE_MANAGER_CONFLICT', `packageManager は未指定または npm@${RUNTIME.npm} に限定します。`, '既存パッケージマネージャーを自動変更せず、手動で方針を決めてください。');
  for (const name of ['.nvmrc', '.node-version']) {
    if (observed.files[name].kind === 'file' && satisfies(RUNTIME.node, readRegular(path.join(root, name), 'utf8').trim()) !== true) reason('RUNTIME_FILE_CONFLICT', `${name} が採用 Node と適合しないか、alias を判定できません。`, '既存runtime指定を確認してください。', [name]);
  }
  if (observed.files['.tool-versions'].kind === 'file') {
    const line = readRegular(path.join(root, '.tool-versions'), 'utf8').split(/\r?\n/).find(l => /^nodejs\s/.test(l));
    if (line && line.trim().split(/\s+/)[1] !== RUNTIME.node) reason('ASDF_CONFLICT', '.tool-versions の nodejs 指定と採用版が一致しません。', '既存runtime指定を確認してください。');
  }
  return {
    adapterVersion: VERSION, detected, applicability: reasons.length ? 'manual' : 'supported', applySupported: reasons.length === 0,
    evidence: { dependencyMarkers: { next, vite, react: Boolean(declared.react) }, optionalDependenciesChecked: optionalNames, nextResolved: nextResolved ?? null, knownDevScript: KNOWN_DEV.has(dev), lockfiles: lockNames, configurationFiles: Object.keys(observed.files).filter(name => /\.config\./.test(name) && observed.files[name].kind !== 'missing'), configurationEvaluated: false },
    reasons, runtime: RUNTIME, snapshot: observed,
    limitations: ['指定rootのmetadataのみ読み取り。scripts/config JSを実行しない。.env は予約キー名の有無だけを判定し、値を記録しない。', 'lock全依存グラフの完全検証・npm ciは判定時に行わない。実起動は別確認。', 'OS/CPU限定のoptional依存は対象環境で省略される場合がある。省略時のアプリ動作は別途確認する。', 'Windows/WSL/macOS実機と実VS Code操作は未検証。'],
  };
}

export function recommend(input) {
  const result = inspect(input);
  return { ...result, candidates: result.applySupported ? [{ id: 'existing-next-npm', reason: '単一Next.js/npmの既知起動・固定runtime互換・既存Dockerなしを静的確認。' }] : [], nextAction: result.applySupported ? 'preview でファイル差分と起動時の処理を確認してください。' : 'reasons の手動手順へ進んでください。' };
}

function validPort(port) {
  if (!Number.isInteger(port) || port < 1024 || port > 65535) fail('INVALID_PORT', 'ポートは1024〜65535の整数にしてください。');
}
function seal(value) { return { ...value, planId: fingerprint(value) }; }
export function preview(input, { port = 3000 } = {}) {
  validPort(port);
  const inspected = inspect(input);
  if (!inspected.applySupported) fail('MANUAL_REQUIRED', 'この構成は自動適用の対象外です。根拠と手動手順を確認してください。', { inspection: inspected });
  return seal({
    kind: 'otoka-existing-next-plan', adapterVersion: VERSION, snapshot: inspected.snapshot, outputBefore: { '.devcontainer': 'missing' }, options: { port }, runtime: RUNTIME,
    devCommand: 'npm run dev -- --hostname 0.0.0.0 --port 3000',
    lifecycle: ['applyはファイル追加のみ。依存取得・Docker・scriptの実行なし。', '後でReopenするとinitialize.shがdocker build、postCreateがnpm ciを実行する。既存/依存のinstall lifecycle scriptが動く場合がある。'],
    files: renderFiles(inspected.snapshot.root.path, port),
  });
}

export function savePlan(plan, destination) {
  const root = plan.snapshot.root.path;
  const output = path.resolve(destination);
  const parent = fs.realpathSync(path.dirname(output));
  if (parent !== path.dirname(output)) fail('SYMLINK_OUTPUT', '提案の保存先にはsymlinkを使わないでください。');
  if (output === root || output.startsWith(`${root}${path.sep}`)) fail('OUTPUT_INSIDE_PROJECT', '提案ファイルは対象プロジェクトの外へ保存してください。');
  const fd = fs.openSync(output, 'wx', 0o600);
  try { fs.writeFileSync(fd, `${JSON.stringify(plan, null, 2)}\n`); } finally { fs.closeSync(fd); }
  return output;
}

function validatePlan(input, plan) {
  const root = canonicalRoot(input);
  if (plan?.kind !== 'otoka-existing-next-plan' || plan.adapterVersion !== VERSION || plan.snapshot?.root?.path !== root) fail('PLAN_ROOT_CHANGED', '提案と対象ディレクトリ/版が一致しません。新しいpreviewが必要です。');
  const { planId, ...unsigned } = plan;
  if (planId !== fingerprint(unsigned)) fail('PLAN_CHANGED', '提案ファイルが変更されています。新しいpreviewが必要です。');
  validPort(plan.options?.port);
  if (stable(plan.files) !== stable(renderFiles(root, plan.options.port)) || stable(plan.runtime) !== stable(RUNTIME)) fail('PLAN_CONTENT_UNSAFE', '予定ファイルが規定内容と一致しません。パスや内容の改変は適用しません。');
  return root;
}

function dirIdentity(directory) {
  const stat = exists(directory);
  if (!stat || !stat.isDirectory() || stat.isSymbolicLink()) return null;
  return `${stat.dev}:${stat.ino}`;
}
function generatedState(directory, name) {
  if (!OUTPUT_NAMES.includes(name) && name !== RECORD && name !== PENDING) fail('UNSAFE_RECORD_PATH', '適用記録に許可されていないパスがあります。');
  return stateFor(directory, name);
}
function recordFor(plan, state) {
  const record = { kind: 'otoka-adapter-record', adapterVersion: VERSION, state, planId: plan.planId, rootHash: hash(plan.snapshot.root.path), options: plan.options, inputFingerprint: fingerprint(plan.snapshot), files: Object.fromEntries(plan.files.map(file => [path.basename(file.path), hash(file.content)])) };
  return { ...record, recordHash: fingerprint(record) };
}
const recordText = record => `${JSON.stringify(record, null, 2)}\n`;
function managementFields(record) {
  const { kind, adapterVersion, state, planId, rootHash, options, inputFingerprint, files } = record;
  return { kind, adapterVersion, state, planId, rootHash, options, inputFingerprint, files };
}
function uneditedRecord(record, text) {
  const { recordHash, ...contents } = record;
  return recordHash === fingerprint(contents) && text === recordText(record);
}
function readRecord(directory) {
  const recordPath = [RECORD, PENDING].find(name => exists(path.join(directory, name)));
  if (!recordPath || generatedState(directory, recordPath).kind !== 'file') fail('NO_VALID_RECORD', '安全な適用記録がありません。既存設定を上書きせず手動で確認してください。');
  let record; let text;
  try { text = readRegular(path.join(directory, recordPath), 'utf8'); record = JSON.parse(text); } catch { fail('INVALID_RECORD', '適用記録を解析できません。'); }
  return { recordPath, record, text };
}
function matchingOutputs(directory, plan) {
  if (!dirIdentity(directory)) return false;
  const { recordPath, record, text } = readRecord(directory);
  if (!uneditedRecord(record, text)) return false;
  if (recordPath !== RECORD || stable(record) !== stable(recordFor(plan, 'complete'))) return false;
  const expectedNames = [...OUTPUT_NAMES, RECORD].sort();
  if (stable(fs.readdirSync(directory).sort()) !== stable(expectedNames)) return false;
  return plan.files.every(file => generatedState(directory, path.basename(file.path)).sha256 === hash(file.content));
}

function changedInputs(before, after) {
  const changed = [];
  if (stable(before.root) !== stable(after.root)) changed.push('project root');
  for (const name of new Set([...Object.keys(before.files), ...Object.keys(after.files)])) {
    if (stable(before.files[name]) !== stable(after.files[name])) changed.push(name);
  }
  if (stable(before.directories) !== stable(after.directories)) changed.push('apps/ or packages/');
  if (stable(before.composeEnv) !== stable(after.composeEnv)) changed.push('.env (reserved-key presence only)');
  return changed;
}

export function applyPlan(input, plan, { testFailAfterFiles = Infinity } = {}) {
  const root = validatePlan(input, plan);
  const current = snapshot(root);
  if (stable(current) !== stable(plan.snapshot)) fail('INPUT_DRIFT', '提案後に入力ファイル・設定の有無・rootが変わりました。新しいpreviewが必要です。', { changed: changedInputs(plan.snapshot, current) });
  const destination = path.join(root, '.devcontainer');
  if (exists(destination)) {
    if (matchingOutputs(destination, plan)) return { status: 'unchanged', files: plan.files.map(f => f.path), message: '同じ提案は適用済みです。変更はありません。' };
    fail('OUTPUT_CONFLICT', '.devcontainer に既存ファイル・利用者の編集があります。上書きせず再提案/手動確認へ戻ります。');
  }
  const fresh = inspect(root);
  if (!fresh.applySupported) fail('NO_LONGER_SUPPORTED', '前提が変わりました。再提案してください。', { inspection: fresh });
  const stage = fs.mkdtempSync(path.join(root, '.otoka-adapter-stage-'));
  fs.chmodSync(stage, 0o700);
  const written = [];
  let owned = null;
  const complete = recordText(recordFor(plan, 'complete'));
  const pending = recordText(recordFor(plan, 'pending'));
  const payload = [...plan.files.map(f => [path.basename(f.path), f.content]), [PENDING, pending], [RECORD, complete]];
  const expected = new Map(payload.map(([name, content]) => [name, hash(content)]));
  try {
    for (const [name, content] of payload) fs.writeFileSync(path.join(stage, name), content, { flag: 'wx', mode: 0o644 });
    JSON.parse(fs.readFileSync(path.join(stage, 'devcontainer.json'), 'utf8'));
    if (stable(snapshot(root)) !== stable(plan.snapshot)) fail('INPUT_DRIFT', '配置直前に入力が変わりました。再提案してください。');
    // mkdir is exclusive. Each hard link is also no-overwrite; an existing
    // directory is never replaced by rename, even if it was created concurrently.
    fs.mkdirSync(destination, { mode: 0o755 });
    owned = dirIdentity(destination);
    if (!owned) fail('OUTPUT_MOVED', '確保した配置先が変更されました。');
    for (const name of [PENDING, ...OUTPUT_NAMES, RECORD]) {
      if (dirIdentity(destination) !== owned) fail('OUTPUT_MOVED', '配置先が途中で変更されました。');
      fs.linkSync(path.join(stage, name), path.join(destination, name));
      written.push(name);
      if (written.length === testFailAfterFiles) throw new Error('Injected fixture write failure');
    }
    if (stable(snapshot(root)) !== stable(plan.snapshot)) fail('INPUT_DRIFT', '配置中に入力が変わりました。再提案してください。');
    const names = fs.readdirSync(destination).sort();
    if (stable(names) !== stable([...OUTPUT_NAMES, PENDING, RECORD].sort())) fail('OUTPUT_CONFLICT', '配置中に別のファイルが追加されました。');
    fs.unlinkSync(path.join(destination, PENDING));
    return { status: 'applied', files: [...plan.files.map(f => f.path), `.devcontainer/${RECORD}`], next: '追加READMEを読み、VS CodeでReopen in Container。依存取得/起動はapplyでは実行していません。' };
  } catch (error) {
    const removed = []; const preserved = [];
    if (owned && dirIdentity(destination) === owned) {
      for (const name of written.reverse()) {
        if (generatedState(destination, name).sha256 === expected.get(name)) { fs.unlinkSync(path.join(destination, name)); removed.push(name); }
        else preserved.push(name);
      }
      if (fs.readdirSync(destination).length === 0) fs.rmdirSync(destination);
    }
    fail('APPLY_FAILED', '適用は失敗しました。成功扱いにせず、この処理が作成した未変更ファイルを復旧しました。', { cause: error.code ?? error.name, removed, preserved });
  } finally {
    fs.rmSync(stage, { recursive: true, force: true });
  }
}

export function undo(input) {
  const root = canonicalRoot(input);
  const directory = path.join(root, '.devcontainer');
  const identity = dirIdentity(directory);
  if (!identity) fail('NO_SAFE_OUTPUT', '通常の .devcontainer ディレクトリがありません。symlink先は操作しません。');
  const { recordPath, record } = readRecord(directory);
  validPort(record.options?.port);
  const expected = Object.fromEntries(renderFiles(root, record.options.port).map(f => [path.basename(f.path), hash(f.content)]));
  if (record.kind !== 'otoka-adapter-record' || record.adapterVersion !== VERSION || record.rootHash !== hash(root) || stable(record.files) !== stable(expected) || record.state !== (recordPath === RECORD ? 'complete' : 'pending') || record.recordHash !== fingerprint(managementFields(record))) fail('RECORD_CHANGED', '適用記録が一致しません。安全のため削除せず手動確認へ戻ります。');
  const removed = []; const preserved = [];
  const metadata = [];
  for (const name of [RECORD, PENDING]) {
    const state = generatedState(directory, name);
    if (state.kind === 'missing') continue;
    let unchanged = false;
    if (state.kind === 'file') {
      try {
        const text = readRegular(path.join(directory, name), 'utf8');
        const candidate = JSON.parse(text);
        unchanged = candidate.kind === record.kind && candidate.adapterVersion === VERSION &&
          candidate.state === (name === RECORD ? 'complete' : 'pending') && candidate.rootHash === record.rootHash &&
          candidate.planId === record.planId && stable(candidate.options) === stable(record.options) &&
          stable(candidate.files) === stable(expected) && uneditedRecord(candidate, text);
      } catch { /* Preserve unreadable/edited auxiliary metadata. */ }
    }
    metadata.push({ name, sha256: state.sha256 });
    if (!unchanged) preserved.push(`.devcontainer/${name}`);
  }
  for (const name of OUTPUT_NAMES) {
    if (dirIdentity(directory) !== identity) fail('OUTPUT_MOVED', '取り消し中にディレクトリが変わりました。');
    const state = generatedState(directory, name);
    if (state.kind === 'missing') continue;
    if (state.sha256 === expected[name]) { fs.unlinkSync(path.join(directory, name)); removed.push(`.devcontainer/${name}`); }
    else preserved.push(`.devcontainer/${name}`);
  }
  const others = fs.readdirSync(directory).filter(name => name !== RECORD && name !== PENDING && !OUTPUT_NAMES.includes(name));
  preserved.push(...others.map(name => `.devcontainer/${name}`));
  if (!preserved.length) {
    for (const item of metadata) {
      if (dirIdentity(directory) !== identity) fail('OUTPUT_MOVED', '取り消し中にディレクトリが変わりました。');
      if (generatedState(directory, item.name).sha256 === item.sha256) fs.unlinkSync(path.join(directory, item.name));
      else preserved.push(`.devcontainer/${item.name}`);
    }
    if (fs.readdirSync(directory).length === 0) fs.rmdirSync(directory);
  } else {
    // Keep valid management records too when some generated/user content remains,
    // so a later retry still has its manifest. Report every retained record.
    for (const item of metadata) if (!preserved.includes(`.devcontainer/${item.name}`)) preserved.push(`.devcontainer/${item.name}`);
  }
  return { status: preserved.length ? 'partial-preserved' : 'undone', removed, preserved, message: preserved.length ? '利用者の編集・追加を保持しました。残った設定は手動で確認してください。' : '未変更の生成ファイルを取り消しました。Docker資源は削除していません。' };
}
