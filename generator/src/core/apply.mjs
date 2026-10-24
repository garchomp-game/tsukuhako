import fs from 'node:fs';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import { GenerationError, fail, hash, identity, readRegular, stable, statMaybe } from './common.mjs';
import { getTemplate } from './catalog.mjs';
import { checkedParent, configuration, environmentText } from './configuration.mjs';
import { archiveFiles, planGeneration } from './plan.mjs';
import { startHere } from './next-steps.mjs';

export function recheckPlan(root, plan) {
  let fresh;
  try { fresh = planGeneration(root, plan?.request); }
  catch (error) { fail('PLAN_STALE', '確認後に入力・配布物・保存先の条件が変わりました。', '内容の確認へ戻り、新しいplanを作ってください。', { reason: error.code ?? 'INPUT_CHANGED' }, error); }
  if (stable(plan) !== stable(fresh)) fail('PLAN_STALE', '確認したplanが現在の条件と一致しません。', '内容の確認へ戻ってください。');
  return fresh;
}

// Internal hooks support cooperative helper cancellation, guide OS selection and regression tests.
// No CLI or renderer API accepts hooks.
export function applyGeneration(root, suppliedPlan, hooks = {}) {
  const plan = recheckPlan(root, suppliedPlan);
  const target = plan.destination;
  const files = archiveFiles(root, getTemplate(root, plan.request.templateId));
  const config = configuration(plan.request);
  const secret = plan.secretGeneratedAtApply ? randomBytes(24).toString('hex') : undefined;
  const payload = [...files, ['.env', Buffer.from(environmentText(plan.request, config, secret))], ['START_HERE.md', Buffer.from(startHere(plan, {platform:hooks.guidePlatform}))]];
  const directories = new Map(), committed = [], preserved = [];
  let stage, stageIdentity;
  const parentSafe = () => stable(checkedParent(target, false)) === stable(plan.parentIdentity);
  const ownedParents = file => parentSafe() && [...directories].every(([dir, id]) => (!file || file.startsWith(dir + path.sep) || file === dir) ? identity(dir) === id : true);
  try {
    hooks.checkCancelled?.();
    if (!parentSafe()) fail('PLAN_STALE', '親フォルダが変更されました。', '保存先を確認し直してください。');
    stage = fs.mkdtempSync(path.join(plan.parentIdentity.path, '.tsukuhako-stage-'));
    fs.chmodSync(stage, 0o700); stageIdentity = identity(stage);
    for (const [name, data] of payload) {
      hooks.checkCancelled?.();
      const file = path.join(stage, name);
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, data, { flag: 'wx', mode: name === '.env' ? 0o600 : name.endsWith('.sh') ? 0o755 : 0o644 });
    }
    recheckPlan(root, plan);
    hooks.beforeCommit?.(target);
    hooks.checkCancelled?.();
    if (!parentSafe()) fail('PLAN_STALE', '配置前に親フォルダが変更されました。', '保存先を確認し直してください。');
    fs.mkdirSync(target); directories.set(target, identity(target));
    for (const [name, data] of payload) {
      hooks.checkCancelled?.();
      const file = path.join(target, name);
      if (!ownedParents(file)) throw new Error('OUTPUT_MOVED');
      let current = target;
      for (const segment of name.split('/').slice(0, -1)) {
        current = path.join(current, segment);
        if (!directories.has(current)) { fs.mkdirSync(current); directories.set(current, identity(current)); }
        if (identity(current) !== directories.get(current)) throw new Error('OUTPUT_MOVED');
      }
      fs.linkSync(path.join(stage, name), file);
      const stat = fs.lstatSync(file);
      committed.push({ file, identity: `${stat.dev}:${stat.ino}`, digest: hash(data) });
      hooks.afterFile?.(file, committed.length);
    }
    if (!ownedParents()) throw new Error('OUTPUT_MOVED');
    return { status: 'created', destination: target, templateId: plan.request.templateId, templateVersion: plan.templateVersion,
      archiveSha256: plan.archiveSha256, projectName: plan.projectName, ports: plan.ports,
      readme: path.join(target, 'README.md'), startHere: path.join(target, 'START_HERE.md') };
  } catch (error) {
    for (const item of committed.reverse()) {
      try {
        if (!ownedParents(item.file)) { preserved.push(item.file); continue; }
        const now = statMaybe(item.file);
        if (!now) continue;
        if (now.isFile() && !now.isSymbolicLink() && `${now.dev}:${now.ino}` === item.identity && hash(readRegular(item.file)) === item.digest) fs.unlinkSync(item.file);
        else preserved.push(item.file);
      } catch { preserved.push(item.file); }
    }
    for (const [dir, id] of [...directories].reverse()) {
      try {
        if (parentSafe() && identity(dir) === id) fs.rmdirSync(dir);
        else if (statMaybe(dir)) preserved.push(dir);
      } catch (rollbackError) {
        if (rollbackError.code !== 'ENOENT') preserved.push(dir);
      }
    }
    if (preserved.length) fail('PARTIAL_PRESERVED', '作成途中のファイルが残っています。', '表示されたフォルダを確認してください。編集した内容は保持しました。', { destination: target, preserved: [...new Set(preserved)] }, error);
    if (error instanceof GenerationError) throw error;
    fail('WRITE_FAILED', 'ファイルの作成に失敗しました。', '保存先の権限・容量・残存ファイルを確認してください。', { destination: target, reason: error.code ?? 'WRITE_ERROR' }, error);
  } finally {
    // Never remove a replacement or follow a changed parent during cleanup.
    if (stage) {
      try { if (parentSafe() && identity(stage) === stageIdentity) fs.rmSync(stage, { recursive: true }); }
      catch { /* A forced interruption/parent change can leave a stage; do not delete unknown content. */ }
    }
  }
}
