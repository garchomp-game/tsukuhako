import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { parseArgs } from 'node:util';

const root = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(root, '../..');
const { values } = parseArgs({ options: { output: { type: 'string' }, 'product-root': { type: 'string' }, 'curriculum-root': { type: 'string' } } });
const productRoot = path.resolve(values['product-root'] || repo);
const curriculumRoot = path.resolve(values['curriculum-root'] || path.join(repo, 'curriculum'));
const outputPath = values.output && path.resolve(values.output);
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const json = file => JSON.parse(read(file));
const checks = [];
const check = (name, pass, detail) => {
  checks.push({ name, result: pass ? 'PASS' : 'FAIL', ...(detail ? { detail } : {}) });
};
const manifest = json('CONTENT-MANIFEST.json');
const links = json('LINKS.example.json').publicLinks;
const privateLinks = json('PRIVATE-LINKS.example.json').privateLinks;
const publicKeys = ['brainProduct', 'startGuide', 'setupGuide', 'exerciseGuide', 'updateNotes', 'subscribe', 'support', 'privacy'];
const required = ['brain-free.md', 'brain-paid.md', 'registration-copy.md', 'screen-copy.json', 'FACT-CHECK.md', 'PUBLISH-CHECKLIST.md', 'REPORT.md', ...manifest.publicDocuments.map(item => item.path), ...manifest.mailDocuments.flatMap(item => [item.path, item.footer])];
check('Required content exists', [...new Set(required)].every(file => fs.existsSync(path.join(root, file))));
check('Exactly 8 public link keys, unresolved by design', Object.keys(links).sort().join() === publicKeys.sort().join() && Object.values(links).every(item => item.url === null));
check('Private receipt keys kept in separate empty config', Object.keys(privateLinks).sort().join() === ['linuxDownload', 'windowsDownload'].sort().join() && Object.values(privateLinks).every(item => item.url === null));
check('Manifest does not approve publication', manifest.status === 'draft' && manifest.productionApproved === false);

// This validates the supplied simple frontmatter contract. B uses its own Markdown loader.
function frontmatter(source) {
  const match = source.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) throw new Error('Missing frontmatter');
  const value = {}; let current;
  for (const line of match[1].split('\n')) {
    if (/^  - /.test(line)) value[current].push(line.slice(4));
    else {
      const at = line.indexOf(':');
      if (at < 1) throw new Error('Invalid frontmatter line');
      current = line.slice(0, at);
      if (current in value) throw new Error('Duplicate frontmatter key');
      const scalar = line.slice(at + 1).trim();
      value[current] = !scalar || scalar === '[]' ? [] : scalar;
    }
  }
  return { value, body: match[2] };
}

const mails = [];
for (const entry of manifest.mailDocuments) {
  const { value, body } = frontmatter(read(entry.path));
  const expectedType = entry.id === 'confirm' ? 'transactional' : entry.id.startsWith('welcome-') ? 'step' : 'broadcast';
  const actualLinkKeys = [...body.matchAll(/\{\{links\.([a-zA-Z]+)\}\}/g)].map(match => match[1]);
  check(`${entry.id}: complete draft frontmatter`, ['id', 'type', 'revision', 'status', 'subject', 'audience', 'links', 'sourceRefs'].every(key => key in value) && value.id === entry.id && value.type === expectedType && value.status === 'draft' && /^[1-9]\d*$/.test(value.revision) && value.sourceRefs.length > 0);
  check(`${entry.id}: declared links match body`, JSON.stringify([...new Set(actualLinkKeys)].sort()) === JSON.stringify([...value.links].sort()));
  check(`${entry.id}: one primary action and no duplicated footer`, (body.match(/\]\(/g) || []).length === 1 && !/\{\{(?:senderName|senderContact|unsubscribeUrl)\}\}/.test(body));
  check(`${entry.id}: no purchase assumption or editorial text`, !/ご購入(?:いただき|ありがとう)|編集メモ|DRAFT|TODO|FIXME/.test(body));
  if (entry.id === 'confirm') {
    check('Confirmation is administrative and uses actual expiry variable', value.links.length === 0 && body.includes('{{confirmUrl}}') && body.includes('{{confirmationExpiresAtJST}}') && entry.footer === 'mail/transactional-footer.md');
  } else {
    check(`${entry.id}: learning footer includes unsubscribe`, entry.footer === 'mail/footer.md' && read(entry.footer).includes('{{unsubscribeUrl}}'));
  }
  mails.push({ id: entry.id, type: value.type, revision: Number(value.revision), status: value.status, audience: value.audience, links: value.links, sourceRefs: value.sourceRefs });
}

const publicFiles = [...manifest.publicDocuments.map(item => item.path), ...manifest.mailDocuments.flatMap(item => [item.path, item.footer]), 'screen-copy.json'];
const allReaderFiles = [...new Set([...publicFiles, 'brain-paid.md'])];
const allowedRuntime = new Set(manifest.runtimeVariables);
for (const file of allReaderFiles) {
  const source = read(file);
  const body = manifest.mailDocuments.some(item => item.path === file) ? frontmatter(source).body : source;
  const variables = [...body.matchAll(/\{\{([^{}]+)\}\}/g)].map(match => match[1]);
  const allowedKeys = file === 'brain-paid.md' ? [...Object.keys(links), ...Object.keys(privateLinks)] : Object.keys(links);
  check(`${file}: only allowed placeholders`, variables.every(item => item.startsWith('links.') ? allowedKeys.includes(item.slice(6)) : allowedRuntime.has(item)));
  check(`${file}: no private URLs, tokens or internal publication notes`, !/https?:\/\/|github\.com|actions\/runs|token=|api[_-]?key=|編集メモ|TODO|FIXME/.test(body));
  if (file !== 'brain-paid.md') check(`${file}: no paid download placeholders`, !/linuxDownload|windowsDownload/.test(body));
}

const screen = json('screen-copy.json');
check('Screen consent starts unchecked with a version', screen.form.consentDefault === false && screen.consentVersion === '2026-10-22-v1');
check('Expired, used and currently unsubscribed have separate copy', screen.expired.title !== screen.used.title && screen.unsubscribed.title !== screen.used.title && screen.unsubscribed.description.includes('新しい確認メール'));
check('Confirmation preview does not call purchase verification', !JSON.stringify(screen).includes('購入確認が完了'));
const page = fs.readFileSync(path.join(repo, 'starter-templates/F2/app/page.tsx'), 'utf8');
const exercise = fs.readFileSync(path.join(repo, 'curriculum/F2/first.md'), 'utf8');
check('F2 guide matches shipped heading and exercise', page.includes('小さく変えて、<br />動きを確かめよう。') && read('guides/first-change.md').includes('小さく変えて、<br />動きを確かめよう。') && exercise.includes('わたしの練習室') && read('guides/first-change.md').includes('わたしの練習室'));
check('Setup guide requires completed configuration before npm run dev', read('guides/setup-check.md').indexOf('正常終了後') < read('guides/setup-check.md').indexOf('\nnpm run dev\n') && read('guides/setup-check.md').includes('処理中は、別の `npm ci` を重ねて実行せず'));
check('One-less-step discloses snapshot rather than auto update', read('guides/one-less-step.md').includes('この案内が自動更新されるわけではありません'));
const free = read('brain-free.md');
const { presentationFor } = await import(pathToFileURL(path.join(productRoot, 'generator/src/core/presentation.mjs')));
const catalog = JSON.parse(fs.readFileSync(path.join(productRoot, 'catalog.json'), 'utf8'));
const generatedNames = catalog.templates.filter(item => item.generatorEligible && item.id !== 'S3').map(item => presentationFor(item.id).name);
const tableNames = [...free.matchAll(/^\| ([^|]+) \|/gm)].map(match => match[1].trim()).filter(name => generatedNames.includes(name));
check('Free copy uses the six product display names and keeps cloud DB reference separate', generatedNames.length === 6 && tableNames.length === 6 && generatedNames.every(name => tableNames.includes(name)) && free.includes(presentationFor('S3').name) && free.includes('専用接続は未確認') && free.includes('プロジェクト生成の対象には含めていません'));
check('Free copy states Linux and Windows limitations before purchase', free.includes('Linux Mint 22.3 x64') && free.includes('既存の開発環境') && free.includes('Windows Server 2022') && free.includes('Windows 11の通常ユーザー') && free.includes('まだ確認していない範囲'));

// Check repository document links separately; runtime placeholders are intentionally unresolved.
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? walk(path.join(dir, entry.name)) : [path.join(dir, entry.name)]);
const markdown = walk(root).filter(file => file.endsWith('.md'));
const broken = [];
const curriculum = JSON.parse(fs.readFileSync(path.join(curriculumRoot, 'manifest.json'), 'utf8'));
const headingId = text => text.toLowerCase().trim().replace(/[^\p{L}\p{N}\s_-]/gu, '').replace(/\s+/g, '-');
const headings = source => [...source.matchAll(/^#{1,6} (.+)$/gm)].map(match => headingId(match[1]));
let lessonLinks = 0;
for (const file of markdown) for (const match of fs.readFileSync(file, 'utf8').matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
  const target = match[1];
  if (target.startsWith('lesson:')) {
    const [route, rawHeading = ''] = target.slice(7).split('#');
    const [lessonId, chapterId] = route.split('/');
    const chapter = curriculum.lessons.find(lesson => lesson.id === lessonId)?.chapters.find(chapter => chapter.id === chapterId);
    const chapterPath = chapter && path.join(curriculumRoot, chapter.file);
    let anchor; try { anchor = decodeURIComponent(rawHeading); } catch { anchor = null; }
    if (!chapterPath || !fs.existsSync(chapterPath) || anchor === null || (anchor && !headings(fs.readFileSync(chapterPath, 'utf8')).includes(anchor))) broken.push(`${path.relative(root, file)} -> ${target}`);
    lessonLinks++;
    continue;
  }
  if (/^(https?:|#|\{\{)/.test(target)) continue;
  const destination = path.resolve(path.dirname(file), target.split('#')[0]);
  const repositorySource = destination.startsWith(repo + path.sep) && !destination.startsWith(root + path.sep)
    ? path.resolve(productRoot, path.relative(repo, destination)) : null;
  if (destination !== outputPath && !fs.existsSync(destination) && !(repositorySource && fs.existsSync(repositorySource))) broken.push(`${path.relative(root, file)} -> ${target}`);
}
check('Relative documentation links resolve', broken.length === 0, broken);
check('Onboarding preparation links resolve to generated curriculum headings', lessonLinks > 0 && broken.every(link => !link.includes('lesson:')), { lessonLinks });

const guideManifest = json('sunday-pack/manifest.json');
const guideFiles = guideManifest.files.map(item => `sunday-pack/${item.file}`);
const guideBodies = Object.fromEntries(guideFiles.map(file => [file, read(file)]));
check('Canonical guide content matches its versioned manifest', guideManifest.productVersion === manifest.productVersion && guideManifest.files.length === 5 && guideManifest.files.every(item => {
  const body = read(`sunday-pack/${item.file}`);
  return Buffer.byteLength(body) === item.bytes && createHash('sha256').update(body).digest('hex') === item.sha256;
}));
const brokenGuideLinks = [];
let guideLinks = 0;
for (const [file, body] of Object.entries(guideBodies)) for (const [, href] of body.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
  if (/^(?:lesson:|https:)/.test(href)) continue; // Lesson anchors were checked against the actual generated curriculum above.
  const [target, rawHeading = ''] = href.split('#');
  const destination = target ? `sunday-pack/${target}` : file;
  let anchor; try { anchor = decodeURIComponent(rawHeading); } catch { anchor = null; }
  if (!(destination in guideBodies) || anchor === null || (anchor && !headings(guideBodies[destination]).includes(anchor))) brokenGuideLinks.push(`${file} -> ${href}`);
  guideLinks++;
}
check('Every canonical recovery link reaches a local document and heading', brokenGuideLinks.length === 0, { guideLinks, brokenGuideLinks });
const { GUIDE_ANCHORS } = await import(pathToFileURL(path.join(productRoot, 'generator/src/core/next-steps.mjs')));
const firstHeadings = headings(guideBodies['sunday-pack/FIRST-RUN.md']);
const requiredStages = ['prepare', 'open', 'connect', 'initialize', 'server', 'verify', 'complete', 'stop', 'resume'];
const positions = requiredStages.map(key => firstHeadings.indexOf(GUIDE_ANCHORS[key]));
check('Static and generated guide stages share anchors and preserve required order', positions.every((at, index) => at >= 0 && (index === 0 || at > positions[index - 1])), { stages: requiredStages });
const waitingSection = guideBodies['sunday-pack/TROUBLESHOOTING.md'].split('## 初期処理が終わらない\n')[1]?.split('\n## ')[0] || '';
check('Recovery from waiting resumes at server start before browser verification', waitingSection.includes(`FIRST-RUN.md#${GUIDE_ANCHORS.server}`) && !waitingSection.includes(`FIRST-RUN.md#${GUIDE_ANCHORS.verify}`));
const sundayCopies = ['INTRODUCTION', 'FREE-TRIAL', 'AFTER-PURCHASE'].map(name => `sunday-copy/${name}.md`);
const routineFiles = [...allReaderFiles.filter(file => file !== 'screen-copy.json'), ...guideFiles, ...sundayCopies];
const internalNames = [];
for (const file of routineFiles) {
  const source = read(file);
  const body = manifest.mailDocuments.some(item => item.path === file) ? frontmatter(source).body : source;
  const prose = body.replace(/```[\s\S]*?```/g, '').replace(/`[^`]*`/g, '');
  if (/\b(?:F[12]|B1|S[123]|I1)\b/.test(prose)) internalNames.push(file);
}
check('Routine reader prose uses product names instead of internal IDs', internalNames.length === 0, internalNames);
check('Three Sunday reader drafts contain no live URL, unresolved variable or editorial memo', sundayCopies.every(file => !/https?:\/\/|\{\{|DRAFT|TODO|FIXME|編集メモ/.test(read(file))));

const files = [...new Set([...allReaderFiles, ...guideFiles, ...sundayCopies, 'sunday-pack/manifest.json', 'sunday-pack/SHA256SUMS', 'LINKS.example.json', 'PRIVATE-LINKS.example.json', 'CONTENT-MANIFEST.json'])].sort();
const productInputs = ['generator/src/core/presentation.mjs', 'generator/src/core/next-steps.mjs', 'catalog.json'].map(file => ({ file, sha256: createHash('sha256').update(fs.readFileSync(path.join(productRoot, file))).digest('hex') }));
const result = { recordedAt: new Date().toISOString(), category: 'STATIC', result: checks.every(item => item.result === 'PASS') ? 'PASS' : 'FAIL', productVersion: manifest.productVersion, guideRevision: guideManifest.guideRevision, sourceProductCommit: manifest.sourceProductCommit, sourceProductCommitNote: manifest.sourceProductCommitNote, factsCommit: manifest.factsCommit, productInputs, newAppOrBrowserTrials: 0, unaidedHumanTrial: 'NOT_RUN', productionApproved: false, externalRequests: 0, liveMailImport: false, mailDocuments: mails, checks, files: files.map(file => ({ file, sha256: createHash('sha256').update(read(file)).digest('hex') })) };
// Evidence is opt-in and never replaces a previous audit.
if (outputPath) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2) + '\n', { flag: 'wx' });
}
console.log(`${result.result}: ${checks.filter(item => item.result === 'PASS').length}/${checks.length} content checks; all 5 mail editions remain draft`);
for (const item of checks.filter(item => item.result === 'FAIL')) console.error(item.name, item.detail || '');
if (result.result === 'FAIL') process.exitCode = 1;
