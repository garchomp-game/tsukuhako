import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../../', import.meta.url));
const require = createRequire(path.join(root, 'web/package.json'));
const YAML = require('yaml');
const read = relative => readFile(path.join(root, relative), 'utf8');
const imported = JSON.parse(await read('web/.generated/content.json'));
const checks = [];
const expect = (name, run) => { run(); checks.push({ name, result: 'PASS' }); };
const ids = ['confirm', 'welcome-01', 'welcome-02', 'welcome-03', 'broadcast-001'];
const fixedKeys = ['brainProduct', 'startGuide', 'setupGuide', 'exerciseGuide', 'updateNotes', 'subscribe', 'support', 'privacy'];
const runtimeKeys = ['confirmUrl', 'unsubscribeUrl', 'confirmationExpiresAtJST', 'senderName', 'senderContact'];
const expectedMainLinks = { confirm: [], 'welcome-01': ['startGuide'], 'welcome-02': ['setupGuide'], 'welcome-03': ['exerciseGuide'], 'broadcast-001': ['updateNotes'] };
const required = ['brain-free.md', 'brain-paid.md', 'registration-copy.md', 'screen-copy.json', 'FACT-CHECK.md', 'LINKS.example.json', 'PRIVATE-LINKS.example.json', 'PUBLISH-CHECKLIST.md', 'REPORT.md'];
for (const file of required) assert.ok((await read(`docs/launch/${file}`)).trim(), file);
checks.push({ name: 'C required deliverables exist', result: 'PASS' });
expect('Exactly the five agreed mail IDs are imported', () => assert.deepEqual(imported.editions.map(e => e.id).sort(), [...ids].sort()));

for (const id of ids) {
  const source = await read(`docs/launch/mail/${id}.md`);
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  assert.ok(match, id);
  const meta = YAML.parse(match[1]);
  const body = match[2].trim();
  const edition = imported.editions.find(e => e.id === id);
  expect(`${id}: B imports C text and metadata without a divergent copy`, () => assert.deepEqual(edition, { ...meta, bodyMarkdown: body }));
  expect(`${id}: draft/source/primary-link contract`, () => {
    assert.equal(meta.status, 'draft');
    assert.ok(Number.isInteger(meta.revision) && meta.revision > 0);
    assert.ok(meta.sourceRefs.length > 0);
    assert.deepEqual(meta.links, expectedMainLinks[id]);
    assert.equal(meta.type, id === 'confirm' ? 'transactional' : id.startsWith('welcome') ? 'step' : 'broadcast');
    assert.equal(meta.audience, id === 'confirm' ? 'confirmation_requested' : id.startsWith('welcome') ? 'subscribed' : 'subscribed_after_intro');
    assert.doesNotMatch(body, /編集メモ|ご購入ありがとうございます|linuxDownload|windowsDownload/);
    for (const [, token] of body.matchAll(/{{\s*([^{}]+?)\s*}}/g)) {
      assert.ok(runtimeKeys.includes(token) || (token.startsWith('links.') && fixedKeys.includes(token.slice(6))), token);
    }
  });
}
for (const [file, property] of [['footer.md', 'footer'], ['transactional-footer.md', 'transactionalFooter']]) {
  const source = (await read(`docs/launch/mail/${file}`)).trim();
  expect(`${file}: shared signature imports match`, () => assert.equal(imported[property], source));
}
expect('Only learning/broadcast footer carries unsubscribe; confirmation is transactional', () => {
  assert.match(imported.footer, /{{unsubscribeUrl}}/);
  assert.doesNotMatch(imported.transactionalFooter, /unsubscribeUrl|links\./);
  assert.match(imported.editions.find(e => e.id === 'confirm').bodyMarkdown, /{{confirmUrl}}/);
});
for (const name of ['start', 'setup-check', 'first-change', 'one-less-step']) {
  const source = (await read(`docs/launch/guides/${name}.md`)).trim();
  expect(`${name}: public guide imports and link boundaries match`, () => {
    assert.equal(imported.guides[name], source);
    assert.doesNotMatch(source, /linuxDownload|windowsDownload|{{confirmUrl}}|{{unsubscribeUrl}}|\/actions\/runs\//);
    for (const [, key] of source.matchAll(/{{links\.([^}]+)}}/g)) assert.ok(fixedKeys.includes(key), key);
  });
}
const screenCopy = JSON.parse(await read('docs/launch/screen-copy.json'));
expect('Screen copy is imported from C without a divergent copy', () => assert.deepEqual(imported.screenCopy, screenCopy));
expect('Generated content fingerprint covers the imported text/configuration', () => {
  const { sourceHash, ...payload } = imported;
  assert.equal(sourceHash, createHash('sha256').update(JSON.stringify(payload)).digest('hex'));
});
expect('Public link keys contain no paid download settings', () => assert.deepEqual(Object.keys(imported.settings.publicLinks).sort(), [...fixedKeys].sort()));
expect('All production URLs and sender details remain unconfirmed, not invented', () => {
  assert.ok(Object.values(imported.settings.publicLinks).every(value => value === null));
  assert.equal(imported.settings.senderName, null);
  assert.equal(imported.settings.senderContact, null);
});
expect('Buyer-only body is absent from B generated import', () => {
  assert.doesNotMatch(JSON.stringify(imported), /linuxDownload|windowsDownload|ツクハコをご購入いただき、ありがとうございます/);
});
const body = await read('docs/launch/brain-free.md');
const code = await read('starter-templates/F2/app/page.tsx');
const exercise = await read('docs/launch/guides/first-change.md');
expect('F2 guide names a real source file and original heading', () => {
  assert.match(code, /小さく変えて、<br \/>動きを確かめよう。/);
  assert.match(exercise, /app\/page\.tsx/);
  assert.match(exercise, /小さく変えて、<br \/>動きを確かめよう。/);
});
expect('Sales copy retains the A review limitations', () => {
  assert.match(body, /6構成/); assert.match(body, /S3.*参考資料/);
  assert.match(body, /Linux Mint 22\.3/); assert.match(body, /Windows Server 2022/);
  assert.match(body, /Windows 11/); assert.match(body, /未確認|まだ確認していない/);
  assert.match(body, /macOS・ARM/);
});
const result = { category: 'STATIC', result: 'PASS', checks, importedSourceHash: imported.sourceHash, productionApproval: false, productionLinksConfigured: false };
await mkdir(path.join(root, 'validation/launch-abc-2026-10-22/logs'), { recursive: true });
await writeFile(path.join(root, 'validation/launch-abc-2026-10-22/logs/content-contract.json'), JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify({ result: result.result, checks: checks.length, importedSourceHash: imported.sourceHash }));
