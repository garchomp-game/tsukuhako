import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {nextSteps, startHere} from '../src/core/next-steps.mjs';

const root = path.resolve(import.meta.dirname, '../..');
const cases = [
  ['F1', 'src/App.tsx', '/'],
  ['F2', 'app/page.tsx', '/'],
  ['B1', 'app/api/health/route.ts', '/api/health'],
  ['S1', 'app/practice/page.tsx', '/practice'],
  ['S2', 'app/page.tsx', '/'],
  ['I1', 'sql/practice.sql', null],
];

for (const [id, file, route] of cases) {
  test(`R041-1: ${id} restores in the editor before verifying in the correct place`, () => {
    const ports = id === 'I1' ? {database: 54950} : {app: 3896};
    const steps = nextSteps(id, ports);
    const edits = steps.flatMap((s, i) => s.document === file ? [i] : []);
    assert.equal(edits.length, 2, 'change and restore must both identify their source file');
    const [change, restore] = edits;
    assert.equal(restore, change + 2, 'check the change before restoring');
    for (const i of edits) {
      assert.equal(steps[i].location, 'editor');
      assert.equal(steps[i].cwd, 'destination');
      assert.equal(steps[i].command, undefined);
      assert.equal(steps[i].url, undefined);
    }
    for (const i of [change + 1, restore + 1]) {
      const check = steps[i];
      if (id === 'I1') {
        assert.equal(check.location, 'container');
        assert.equal(check.cwd, '/workspace');
        assert.deepEqual(check.command, {executable: 'bash', args: ['scripts/db.sh', 'query', file]});
        assert.equal(check.url, undefined);
      } else if (id === 'B1') {
        assert.equal(check.location, 'host');
        assert.deepEqual(check.command, {executable: 'curl', args: ['-i', `http://localhost:3896${route}`]});
        assert.equal(check.url, undefined);
      } else {
        assert.equal(check.url, `http://localhost:3896${route}`);
        assert.equal(check.command, undefined);
      }
    }
    const generated = startHere({request: {templateId: id}, templateVersion: 'test', projectName: 'review', destination: '/home/student/日本語 練習', ports, nextSteps: steps});
    const bundled = fs.readFileSync(path.join(root, 'curriculum', id, 'first.md'), 'utf8');
    for (const [text, heading] of [[generated, /^### \d+\. /m], [bundled, /^## \d+\. /m]]) {
      const sections = text.split(heading).slice(1);
      assert.equal(sections.length, steps.length);
      assert.match(sections[restore], /場所：VS Codeの編集画面/);
      assert.ok(sections[restore].includes(`](${file})`));
      assert.ok(!sections[restore].includes('```sh'));
      assert.ok(!sections[restore].includes('ブラウザのアドレス欄'));
      assert.match(sections[restore + 1], id === 'I1' ? /場所：VS CodeのDev Container内ターミナル/ : id === 'B1' ? /場所：開発ホストのターミナル/ : /場所：OSのブラウザのアドレス欄/);
      assert.ok(!sections[restore + 1].includes(`](${file})`));
    }
  });
}
