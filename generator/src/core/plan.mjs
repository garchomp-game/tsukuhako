import path from 'node:path';
import { unzipSync } from 'fflate';
import { VERSION, GenerationError, fail, hash, readRegular, stable } from './common.mjs';
import { getTemplate } from './catalog.mjs';
import { checkedParent, configuration, normalizeRequest } from './configuration.mjs';
import { nextSteps } from './next-steps.mjs';

function unsafe(message) { fail('UNSAFE_ARCHIVE', message, '生成を止め、正しい配布ZIPを確認してください。'); }
function safeName(name, id) {
  if (!name.startsWith(`${id}/`) || /[\\\x00-\x1f\x7f]/.test(name)) unsafe('ZIPのパスが不正です。');
  const relative = name.slice(id.length + 1);
  const parts = relative.split('/');
  if (!relative || parts.some(x => !x || x === '.' || x === '..' || Buffer.byteLength(x) > 255)) unsafe('ZIPに相対移動または不正なパスがあります。');
  if (parts.some(x => ['node_modules', '.git', '.next', '.cache', '.local'].includes(x)) || parts.some(x => x.startsWith('.env') && x !== '.env.example')) unsafe('ZIPに実設定または生成物が含まれています。');
  if (relative === 'START_HERE.md') unsafe('ZIP内のSTART_HERE.mdはジェネレーターの予約パスと競合します。');
  return relative;
}

// Inspect central-directory sizes, duplicates and file types before inflation.
function inspectZip(bytes, id) {
  let end = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65557); i--) {
    if (bytes.readUInt32LE(i) === 0x06054b50 && i + 22 + bytes.readUInt16LE(i + 20) === bytes.length) { end = i; break; }
  }
  if (end < 0 || bytes.readUInt16LE(end + 4) || bytes.readUInt16LE(end + 6)) unsafe('ZIPのディレクトリ情報が不正です。');
  const count = bytes.readUInt16LE(end + 10);
  let offset = bytes.readUInt32LE(end + 16), total = 0;
  if (!count || count > 2000 || bytes.readUInt16LE(end + 8) !== count || offset + bytes.readUInt32LE(end + 12) !== end) unsafe('ZIPのサイズ・構造が上限または形式に適合しません。');
  const files = new Map();
  for (let i = 0; i < count; i++) {
    if (offset + 46 > end || bytes.readUInt32LE(offset) !== 0x02014b50) unsafe('ZIPの構造が不正です。');
    const size = bytes.readUInt32LE(offset + 24);
    const nameSize = bytes.readUInt16LE(offset + 28);
    const next = offset + 46 + nameSize + bytes.readUInt16LE(offset + 30) + bytes.readUInt16LE(offset + 32);
    const mode = (bytes.readUInt32LE(offset + 38) >>> 16) & 0xf000;
    if (next > end || (bytes.readUInt16LE(offset + 8) & 1) || ![0, 8].includes(bytes.readUInt16LE(offset + 10)) || ![0, 0x8000].includes(mode)) unsafe('暗号化・特殊ファイル・未対応圧縮のZIPは使えません。');
    const name = bytes.subarray(offset + 46, offset + 46 + nameSize).toString('utf8');
    const relative = safeName(name, id);
    if (files.has(name)) unsafe('ZIPに同名ファイルが重複しています。');
    total += size;
    if (size > 5 * 1024 * 1024 || total > 20 * 1024 * 1024) unsafe('ZIPの展開サイズが上限を超えています。');
    files.set(name, { relative, size }); offset = next;
  }
  if (offset !== end) unsafe('ZIPの終端が一致しません。');
  return files;
}
export function archiveFiles(root, template) {
  let bytes;
  try { bytes = readRegular(path.join(root, template.packagePath)); }
  catch (error) { fail('ARCHIVE_MISMATCH', '配布ZIPを安全に読み取れません。', 'catalogとdistを揃えて展開してください。', {}, error); }
  if (hash(bytes) !== template.packageSha256) fail('ARCHIVE_MISMATCH', 'ZIPのSHA256がカタログと一致しません。', '正しい配布物を確認してください。出力先には何も作りません。');
  try {
    const info = inspectZip(bytes, template.id);
    const contents = unzipSync(bytes, { filter: file => {
      if (!info.has(file.name) || info.get(file.name).size !== file.originalSize) unsafe('ZIPのファイル情報が一致しません。');
      return true;
    } });
    if (Object.keys(contents).length !== info.size) unsafe('ZIPのファイル数が一致しません。');
    const files = [...info].map(([name, meta]) => {
      if (!contents[name] || contents[name].length !== meta.size) unsafe('ZIPの展開サイズが一致しません。');
      return [meta.relative, Buffer.from(contents[name])];
    }).sort(([a], [b]) => a.localeCompare(b, 'en'));
    const names = new Set(files.map(([name]) => name));
    for (const required of ['README.md', '.devcontainer/devcontainer.json', template.id === 'I1' ? 'template.json' : 'VERSION.json']) {
      if (!names.has(required)) unsafe('ZIPに必須ファイルがありません。');
    }
    const metadata = JSON.parse(files.find(([name]) => name === (template.id === 'I1' ? 'template.json' : 'VERSION.json'))[1]);
    if (metadata.version !== template.implementationVersion) unsafe('ZIPの版がカタログと一致しません。');
    return files;
  } catch (error) {
    if (error instanceof GenerationError) throw error;
    fail('UNSAFE_ARCHIVE', 'ZIPを検証・展開できません。', '正しい配布ZIPを確認してください。', {}, error);
  }
}
export function planGeneration(root, rawRequest) {
  if (!rawRequest || typeof rawRequest.templateId !== 'string') fail('INVALID_OPTIONS', '構成を指定してください。', '用途から構成を選んでください。');
  const template = getTemplate(root, rawRequest.templateId);
  const request = normalizeRequest(rawRequest, template);
  const parent = checkedParent(request.destination);
  const files = archiveFiles(root, template);
  const config = configuration(request);
  const steps = nextSteps(template.id, config.ports);
  for (const step of steps) if (step.document && !files.some(([name]) => name === step.document)) unsafe('生成後の教材リンク先がZIP内にありません。');
  const plan = { schemaVersion: 1, generatorVersion: VERSION, request, templateVersion: template.implementationVersion,
    catalogSha256: hash(readRegular(path.join(root, 'catalog.json'))), archiveSha256: template.packageSha256,
    destination: request.destination, parentIdentity: parent, projectName: config.projectName, ports: config.ports,
    files: [...files.map(([name]) => ({ path: name, source: 'archive' })), { path: '.env', source: 'generated' }, { path: 'START_HERE.md', source: 'generated' }],
    secretGeneratedAtApply: template.id === 'I1', nextSteps: steps };
  return { ...plan, planId: hash(stable(plan)) };
}
