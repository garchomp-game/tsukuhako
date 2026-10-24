import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {nextSteps, startHere, GUIDE_HEADINGS, GUIDE_ANCHORS, commandText, quoteArg} from '../src/core/next-steps.mjs';
import {presentationFor} from '../src/core/presentation.mjs';
import {getTemplates} from '../src/core/catalog.mjs';
import {planGeneration} from '../src/core/plan.mjs';
import {applyGeneration} from '../src/core/apply.mjs';

const root = path.resolve(import.meta.dirname, '../..');
const cases = [
  ['F1', 'src/App.tsx', '/'],
  ['F2', 'app/page.tsx', '/'],
  ['B1', 'app/api/health/route.ts', '/api/health'],
  ['S1', 'app/practice/page.tsx', '/practice'],
  ['S2', 'app/page.tsx', '/'],
  ['I1', 'sql/practice.sql', null],
];

const slug = title => title.toLowerCase().trim().replace(/[^\p{L}\p{N}\s_-]/gu, '').replace(/\s+/g, '-');
function temp(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tsukuhako-onboarding-'));
  t.after(() => fs.rmSync(dir, {recursive:true, force:true}));
  return dir;
}
function fences(text) {
  const result = [];
  let open;
  for (const line of text.split('\n')) {
    if (open) {
      if (line.trim() === open.fence) { result.push({...open, content:open.lines.join('\n')}); open = undefined; }
      else open.lines.push(line);
    } else {
      const match = line.match(/^(`{3,})(\w*)$/);
      if (match) open = {fence:match[1], language:match[2], lines:[]};
    }
  }
  assert.equal(open, undefined, 'every code block closes');
  return result;
}
function checkLinks(guide, destination) {
  const headings = [...guide.matchAll(/^#{1,6} (.+)$/gm)].map(match => slug(match[1]));
  assert.equal(new Set(headings).size, headings.length, 'stable headings must not need duplicate suffixes');
  for (const [,href] of guide.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
    if (href.startsWith('#')) assert.ok(headings.includes(decodeURIComponent(href.slice(1))), `missing heading ${href}`);
    else {
      assert.ok(!/^\w+:|^\//.test(href), `saved guide must not need an app-only or absolute link: ${href}`);
      assert.ok(fs.statSync(path.join(destination, href)).isFile(), `missing bundled document ${href}`);
    }
  }
}

test('onboarding: catalog and guides share names, technology and template-specific first outcomes', () => {
  const {templates} = getTemplates(root);
  for (const template of templates) {
    const presentation = presentationFor(template.id);
    for (const key of ['name','summary','technology','firstGoal','guideAction','success']) {
      assert.equal(typeof presentation[key], 'string');
      assert.ok(presentation[key].length);
      assert.equal(template[key], presentation[key]);
    }
    assert.equal(template.route, presentation.route);
    assert.ok(presentation.route === null || typeof presentation.route === 'string');
  }
  assert.equal(presentationFor('F2').name, 'はじめてのWeb画面');
  assert.equal(presentationFor('F2').firstGoal, 'サンプル画面を表示する');
  assert.equal(presentationFor('B1').route, '/api/health');
  assert.equal(presentationFor('S1').route, '/practice');
  assert.equal(presentationFor('I1').route, null);
  assert.equal(templates.find(template => template.id === 'S3').eligible, false);
  assert.throws(() => nextSteps('S3', {}));
  const copy = presentationFor('F2'); copy.name = 'changed';
  assert.equal(presentationFor('F2').name, 'はじめてのWeb画面');
});

for (const [id, file, route] of cases) {
  test(`onboarding A05/A09: ${id} saves actual values and working links; source edits are optional`, t => {
    const dir = temp(t), destination = path.join(dir, `日本語 空白 ${id} app's $(touch INJECTED) ; & \`\`\``);
    const request = {templateId:id, destination, port:id === 'I1' ? 54950 : 3896};
    if (id === 'S2') request.dbBase = 54810;
    const plan = planGeneration(root, request), result = applyGeneration(root, plan, {guidePlatform:'linux'});
    const guide = fs.readFileSync(result.startHere, 'utf8'), presentation = presentationFor(id);
    assert.equal(guide, startHere(plan, {platform:'linux'}), 'saved guide and copied/Reader content agree');
    assert.ok(guide.startsWith(`# ${presentation.name}：${presentation.firstGoal}\n`));
    assert.ok(guide.includes(presentation.success));
    assert.ok(guide.includes(quoteArg(destination)));
    for (const port of Object.values(plan.ports)) assert.ok(guide.includes(String(port)));
    assert.doesNotMatch(guide, /Windows|PowerShell|WSL|macOS|Cmd\+Shift\+P/);
    assert.doesNotMatch(guide, /\(lesson:|\(action:|scripts\/configure\.sh/);
    if (route) assert.ok(guide.includes(`http://localhost:3896${route}`));
    else assert.doesNotMatch(guide, /http:\/\/|npm.*run.*dev/);
    checkLinks(guide, destination);
    for (const [key,heading] of Object.entries(GUIDE_HEADINGS)) {
      if (id === 'I1' && key === 'server') continue;
      assert.ok(guide.includes(`## ${heading}\n`), key);
      assert.equal(GUIDE_ANCHORS[key], slug(heading));
    }
    const steps = plan.nextSteps;
    const required = steps.filter(step => step.phase === 'required');
    assert.equal(required.at(-1).key, 'verify');
    assert.equal(required.at(-1).expected, presentation.success);
    assert.ok(required.every(step => step.detail && step.expected && step.location && step.cwd));
    const edits = steps.flatMap((step, index) => step.document === file ? [index] : []);
    assert.equal(edits.length, 2);
    const [change, restore] = edits;
    assert.equal(restore, change + 2, 'check the change before restoring');
    for (const index of edits) {
      assert.equal(steps[index].phase, 'optional');
      assert.equal(steps[index].location, 'editor');
      assert.equal(steps[index].cwd, 'destination');
      assert.equal(steps[index].command, undefined);
      assert.equal(steps[index].url, undefined);
    }
    for (const index of [change + 1, restore + 1]) {
      const check = steps[index];
      assert.equal(check.phase, 'optional');
      if (id === 'I1') {
        assert.equal(check.location, 'container');
        assert.equal(check.cwd, '/workspace');
        assert.deepEqual(check.command, {executable:'bash', args:['scripts/db.sh','query',file]});
      } else if (id === 'B1') {
        assert.equal(check.location, 'host');
        assert.deepEqual(check.command, {executable:'curl', args:['-i',`http://localhost:3896${route}`]});
      } else assert.equal(check.url, `http://localhost:3896${route}`);
    }
    assert.ok(guide.indexOf('## 初回完了\n') < guide.indexOf('## 任意の練習\n'));
    const optional = guide.split('## 任意の練習\n')[1];
    assert.ok(optional.includes(`](${file})`));
    const restoreSection = optional.split('### 元の内容に戻して保存する\n')[1].split('\n### ')[0];
    assert.match(restoreSection, /場所：VS Codeの編集画面/);
    assert.ok(!restoreSection.includes('```sh'));
    const commands = fences(guide).filter(block => block.language === 'sh').map(block => block.content);
    for (const step of steps) if (step.command) assert.ok(commands.includes(commandText(step.command)));
    for (const command of commands) for (const [,script] of command.matchAll(/^'bash' '(scripts\/[^']+)'/gm)) {
      assert.ok(fs.statSync(path.join(destination,script)).isFile(), `stop/resume and startup scripts must be bundled: ${script}`);
    }
    const cd = commands.find(command => command.startsWith('cd -- '));
    const copied = spawnSync('bash', ['-c',cd], {cwd:dir, encoding:'utf8'});
    assert.equal(copied.status, 0, copied.stderr);
    assert.equal(copied.stdout.trimEnd(), destination);
    assert.equal(fs.existsSync(path.join(dir,'INJECTED')), false);
    const before = fs.readFileSync(path.join(destination,'.env'));
    startHere(plan, {platform:'win32'});
    assert.deepEqual(fs.readFileSync(path.join(destination,'.env')), before, 'reading another OS guide never recreates settings');
  });
}

test('onboarding A09: Windows helper renders matching WSL guidance without exposing a new request option', t => {
  const dir = temp(t);
  for (const [id] of cases) {
    const request = {templateId:id, destination:path.join(dir,`Windows fixture ${id}`), port:id === 'I1' ? 54951 : 3897};
    const plan = planGeneration(root, request), result = applyGeneration(root, plan, {guidePlatform:'win32'});
    const guide = fs.readFileSync(result.startHere, 'utf8');
    assert.equal(guide, startHere(plan, {platform:'win32'}));
    assert.match(guide, /選択したWSLのターミナル（PowerShellでは実行しません）/);
    assert.match(guide, /Windows 11と実WSLでの利用は実機未確認/);
    assert.match(guide, /Windows側のVS Code/);
    assert.doesNotMatch(guide, /Linuxのターミナル|macOS|Cmd\+Shift\+P/);
    checkLinks(guide, result.destination);
  }
  assert.throws(() => planGeneration(root, {templateId:'F2', destination:path.join(dir,'bad'), guidePlatform:'win32'}), {code:'INVALID_OPTIONS'});
});

test('onboarding: optional macOS rendering changes shortcuts without claiming platform validation', () => {
  const plan = {request:{templateId:'F2'}, destination:'/Users/student/日本語 練習', ports:{app:3898}, templateVersion:'test', projectName:'test'};
  const guide = startHere(plan, {platform:'darwin'});
  assert.match(guide, /macOSのターミナル/);
  assert.match(guide, /Cmd\+Shift\+P/);
  assert.match(guide, /macOSは今回の配布・実機確認の対象外/);
  assert.doesNotMatch(guide, /Windows|WSL|PowerShell|Ctrl\+Shift\+P/);
});
