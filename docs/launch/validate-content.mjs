import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const root = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(root, '../..');
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
  check(`${entry.id}: complete draft frontmatter`, ['id', 'type', 'revision', 'status', 'subject', 'audience', 'links', 'sourceRefs'].every(key => key in value) && value.id === entry.id && value.type === expectedType && value.status === 'draft' && value.revision === '1' && value.sourceRefs.length > 0);
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
check('Free copy names exactly six generated template rows and S3 reference', (free.match(/^\| (?:F1|F2|B1|S1|S2|I1) \|/gm) || []).length === 6 && free.includes('クラウドSupabaseのS3は参考資料'));
check('Free copy states Linux and Windows limitations before purchase', free.includes('Linux Mint 22.3 x64') && free.includes('既存の開発環境') && free.includes('Windows Server 2022') && free.includes('Windows 11の通常ユーザー') && free.includes('まだ確認していない範囲'));

// Check repository document links separately; runtime placeholders are intentionally unresolved.
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? walk(path.join(dir, entry.name)) : [path.join(dir, entry.name)]);
const markdown = walk(root).filter(file => file.endsWith('.md'));
const broken = [];
for (const file of markdown) for (const match of fs.readFileSync(file, 'utf8').matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
  const target = match[1];
  if (/^(https?:|#|\{\{)/.test(target)) continue;
  if (!fs.existsSync(path.resolve(path.dirname(file), target.split('#')[0]))) broken.push(`${path.relative(root, file)} -> ${target}`);
}
check('Relative documentation links resolve', broken.length === 0, broken);

const files = [...new Set([...allReaderFiles, 'LINKS.example.json', 'PRIVATE-LINKS.example.json', 'CONTENT-MANIFEST.json'])].sort();
const result = { recordedAt: new Date().toISOString(), category: 'STATIC', result: checks.every(item => item.result === 'PASS') ? 'PASS' : 'FAIL', sourceProductCommit: manifest.sourceProductCommit, factsCommit: manifest.factsCommit, newAppOrBrowserTrials: 0, productionApproved: false, externalRequests: 0, mailDocuments: mails, checks, files: files.map(file => ({ file, sha256: createHash('sha256').update(read(file)).digest('hex') })) };
fs.mkdirSync(path.join(root, 'evidence'), { recursive: true });
fs.writeFileSync(path.join(root, 'evidence/content-audit.json'), JSON.stringify(result, null, 2) + '\n');
console.log(`${result.result}: ${checks.filter(item => item.result === 'PASS').length}/${checks.length} content checks; all 5 mail editions remain draft`);
for (const item of checks.filter(item => item.result === 'FAIL')) console.error(item.name, item.detail || '');
if (result.result === 'FAIL') process.exitCode = 1;
