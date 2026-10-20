import fs from 'node:fs';
import path from 'node:path';
import { homedir } from 'node:os';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { stable } from '../../../existing-project-adapter/src/adapter.mjs';
import { renderFiles } from '../../../existing-project-adapter/src/templates.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../../..');
const cli = path.join(root, 'existing-project-adapter/cli.mjs');
const supported = path.join(here, 'runs/対応Next fixture');
const unsupported = path.join(here, 'runs/ローカルoptional fixture');
const sibling = path.join(here, 'runs/local-helper');
const plans = path.join(here, 'runs/plans');
const sha = value => createHash('sha256').update(value).digest('hex');
const safe = value => JSON.parse(JSON.stringify(value).replaceAll(root, '[work-root]').replaceAll(homedir(), '[user-home]'));
const operations = [];

function tree(directory, skipGenerated = false) {
  const files = {};
  const visit = relative => { for (const entry of fs.readdirSync(path.join(directory, relative), { withFileTypes: true })) {
    if (skipGenerated && !relative && entry.name === '.devcontainer') continue;
    const name = path.join(relative, entry.name);
    if (entry.isDirectory()) { files[`${name}/`] = 'directory'; visit(name); }
    else if (entry.isSymbolicLink()) files[name] = `symlink:${fs.readlinkSync(path.join(directory, name))}`;
    else files[name] = sha(fs.readFileSync(path.join(directory, name)));
  } };
  visit(''); return files;
}
function command(id, args, expected = 0) {
  const start = performance.now(); const timestamp = new Date().toISOString();
  const result = spawnSync(process.execPath, [cli, ...args], { cwd: root, encoding: 'utf8' });
  const log = `logs/${id}.log`;
  fs.writeFileSync(path.join(here, log), `${result.stdout}${result.stderr}`.replaceAll(root, '[work-root]').replaceAll(homedir(), '[user-home]'));
  const record = safe({ id, timestamp, command: [process.execPath, cli, ...args], exitCode: result.status, expectedExitCode: expected, durationSeconds: Number(((performance.now() - start) / 1000).toFixed(3)), result: result.status === expected ? 'PASS' : 'FAIL', log });
  operations.push(record);
  fs.writeFileSync(path.join(here, 'cli-operations.json'), JSON.stringify(operations, null, 2) + '\n');
  assert.equal(result.status, expected, `${id}: ${result.stderr}`);
  return JSON.parse(expected ? result.stderr : result.stdout);
}

const supportedBefore = tree(supported); const unsupportedBefore = tree(unsupported); const siblingBefore = tree(sibling);
const normal = command('supported-inspect', ['inspect', supported]); assert.equal(normal.applySupported, true);
const normalPlan = path.join(plans, 'supported.json');
command('supported-preview', ['preview', supported, '--out', normalPlan, '--port', '3096']);
assert.deepEqual(tree(supported), supportedBefore);
const validPlan = JSON.parse(fs.readFileSync(normalPlan));
assert.equal(command('supported-apply', ['apply', supported, '--plan', normalPlan]).status, 'applied');
assert.deepEqual(tree(supported, true), supportedBefore);
assert.equal(command('supported-reapply', ['apply', supported, '--plan', normalPlan]).status, 'unchanged');

const unsupportedResult = command('optional-inspect', ['inspect', unsupported]);
assert.equal(unsupportedResult.applySupported, false);
assert.ok(unsupportedResult.reasons.some(reason => reason.code === 'UNSUPPORTED_DEPENDENCY' && reason.evidence.includes('local-helper')));
assert.equal(command('optional-preview-refused', ['preview', unsupported, '--out', path.join(plans, 'must-not-exist.json')], 1).code, 'MANUAL_REQUIRED');
assert.equal(fs.existsSync(path.join(plans, 'must-not-exist.json')), false);
// Construct a current-shape plan only to exercise apply's own fresh safety check.
// This is not a supported proposal and is not a force option in the CLI.
const rejectedPlan = { ...validPlan, snapshot: unsupportedResult.snapshot, files: renderFiles(unsupported, validPlan.options.port) };
delete rejectedPlan.planId; rejectedPlan.planId = sha(stable(rejectedPlan));
const rejectedPath = path.join(plans, 'unsupported-for-apply-guard-test.json'); fs.writeFileSync(rejectedPath, JSON.stringify(rejectedPlan, null, 2) + '\n');
assert.equal(command('optional-apply-refused', ['apply', unsupported, '--plan', rejectedPath], 1).code, 'NO_LONGER_SUPPORTED');
assert.equal(fs.existsSync(path.join(unsupported, '.devcontainer')), false);
assert.deepEqual(tree(unsupported), unsupportedBefore); assert.deepEqual(tree(sibling), siblingBefore);

const recordPath = path.join(supported, '.devcontainer/.adapter-record.json');
const record = JSON.parse(fs.readFileSync(recordPath)); record.userNote = 'レビュー後も保持する利用者メモ 😀';
fs.writeFileSync(recordPath, JSON.stringify(record, null, 2) + '\n');
const dockerfile = path.join(supported, '.devcontainer/Dockerfile'); fs.appendFileSync(dockerfile, '# USER EDIT: keep this note\n');
const recordHash = sha(fs.readFileSync(recordPath)); const dockerfileHash = sha(fs.readFileSync(dockerfile));
const undone = command('edited-record-undo', ['undo', supported]);
assert.equal(undone.status, 'partial-preserved');
assert.ok(undone.preserved.includes('.devcontainer/.adapter-record.json'));
assert.ok(undone.preserved.includes('.devcontainer/Dockerfile'));
assert.equal(sha(fs.readFileSync(recordPath)), recordHash); assert.equal(sha(fs.readFileSync(dockerfile)), dockerfileHash);
assert.deepEqual(tree(supported, true), supportedBefore);

const proof = {
  result: 'PASS', fixture: 'Dedicated copies of F2 app/package/complete lock; fictional sibling helper',
  unsupported: { before: unsupportedBefore, after: tree(unsupported), identical: true },
  sibling: { before: siblingBefore, after: tree(sibling), identical: true },
  supported: { before: supportedBefore, after: tree(supported, true), identical: true },
  userEdits: { recordBeforeUndo: recordHash, recordAfterUndo: sha(fs.readFileSync(recordPath)), dockerfileBeforeUndo: dockerfileHash, dockerfileAfterUndo: sha(fs.readFileSync(dockerfile)), preserved: undone.preserved },
};
fs.writeFileSync(path.join(here, 'protected-hashes.json'), JSON.stringify(proof, null, 2) + '\n');
console.log(JSON.stringify({ result: 'PASS', supportedNext: true, optionalInspectPreviewApplyRefused: true, originalFilesUnchanged: true, siblingFilesUnchanged: true, userNoteAndDockerfileEditsPreserved: true, cliOperations: operations.length }));
