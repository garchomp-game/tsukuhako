// Guide-only ZIP. Product binaries remain in the selected A OS-specific sets.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';

const root = path.resolve(import.meta.dirname, '..');
const source = path.join(root, 'docs/launch/sunday-pack');
const output = path.join(root, 'validation/sunday-pack-2026-10-25/delivery');
const revision = '2026-10-25-r1';
const guides = ['START_HERE.md', 'FIRST-RUN.md', 'TROUBLESHOOTING.md', 'NEXT-STEP.md', 'FEEDBACK.md'];
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const describe = (dir, name) => { const bytes = fs.readFileSync(path.join(dir, name)); return { file: name, bytes: bytes.length, sha256: hash(bytes) }; };
for (const file of guides) {
  const text = fs.readFileSync(path.join(source, file), 'utf8');
  if (/\{\{[^}]+\}\}|\/home\/garchomp-game|\/var\/tmp\/|127\.0\.0\.1:5183|localhost:5183|github\.com\/garchomp-game\/tsukuhako/.test(text)) throw new Error(`Internal/unresolved recipient content: ${file}`);
  for (const [, target] of text.matchAll(/\]\(([^)]+)\)/g)) {
    if (target.startsWith('https://')) continue;
    if (!guides.includes(target.split('#')[0])) throw new Error(`Nonportable guide link in ${file}: ${target}`);
  }
}
const selected = JSON.parse(fs.readFileSync(path.join(root, 'validation/release-0.4.4-followup/delivery/upload-files.json')));
const manifest = {
  name: 'ツクハコ F2 最初の画面ガイド', guideRevision: revision, productVersion: '0.4.4',
  status: 'VALIDATION_COLLABORATOR_CANDIDATE_NOT_PUBLISHED',
  scope: 'Generate F2 with the existing application, wait for successful postCreate completion, and display the first page. Editing/restoration is optional.',
  includesProductBinary: false, includesGeneratedProject: false,
  entry: 'START_HERE.md', files: guides.map(name => describe(source, name)),
  separateProductSets: {
    applicationSourceCommit: '2b141f7c583d796e1ba75ad312c6ab199056c7de', deliveryRevision: selected.revision,
    files: selected.files.map(({ platform, file, bytes, sha256 }) => ({ platform, file, bytes, sha256 }))
  },
  checksums: { algorithm: 'SHA-256', file: 'SHA256SUMS', covers: [...guides, 'manifest.json'], note: 'The checksum file does not hash itself. The ZIP has an external SHA256SUMS in the delivery folder.' },
  verificationScope: { linux: 'Linux Mint 22.3 x64 existing development environment only', windows11WslF2: 'NOT_RUN', cleanPCSetup: 'NOT_RUN', publicRecipientDownload: 'NOT_RUN', unaidedHumanTrial: 'NOT_RUN' }
};
fs.writeFileSync(path.join(source, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
const members = [...guides, 'manifest.json'];
fs.writeFileSync(path.join(source, 'SHA256SUMS'), members.map(name => `${describe(source, name).sha256}  ${name}`).join('\n') + '\n');
members.push('SHA256SUMS');
fs.mkdirSync(output, { recursive: true });
const archive = `tsukuhako-f2-guide-${revision}.zip`;
const destination = path.join(output, archive);
const stage = fs.mkdtempSync(path.join(os.tmpdir(), 'tsukuhako-sunday-guide-'));
try {
  for (const name of members) { const target = path.join(stage, name); fs.copyFileSync(path.join(source, name), target); fs.utimesSync(target, new Date('2026-10-25T00:00:00Z'), new Date('2026-10-25T00:00:00Z')); }
  fs.rmSync(destination, { force: true });
  execFileSync('zip', ['-X', '-q', destination, ...members], { cwd: stage, env: { ...process.env, TZ: 'UTC' } });
  const artifact = describe(output, archive);
  fs.writeFileSync(path.join(output, 'SHA256SUMS'), `${artifact.sha256}  ${archive}\n`);
  fs.writeFileSync(path.join(output, 'artifact.json'), JSON.stringify({ category: 'STATIC', guideRevision: revision, productVersion: '0.4.4', artifact, members: members.map(name => describe(source, name)), productBinaryCopies: 0, published: false }, null, 2) + '\n');
  console.log(JSON.stringify(artifact));
} finally { fs.rmSync(stage, { recursive: true, force: true }); }
