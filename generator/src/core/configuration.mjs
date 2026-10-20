import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { posixCksum } from './posix-cksum.mjs';
import { fail, identity, statMaybe } from './common.mjs';

const invalid = message => fail('INVALID_OPTIONS', message, '入力欄を直して、もう一度内容を確認してください。');
const controls = /[\x00-\x1f\x7f]/;
export function destinationFromParts(parent, child) {
  if (typeof parent !== 'string' || !parent.length || controls.test(parent)) invalid('親フォルダを指定してください。');
  if (typeof child !== 'string' || !child.trim() || child === '.' || child === '..' || /[/\\]/.test(child) || controls.test(child)) invalid('新しいフォルダ名は区切り文字や制御文字を含まない1つの名前にしてください。');
  return path.resolve(parent.startsWith('~/') ? path.join(os.homedir(), parent.slice(2)) : parent, child);
}
export function checkedParent(destination, requireAbsent = true) {
  const parent = path.dirname(destination);
  let current = path.parse(parent).root;
  try {
    for (const part of parent.slice(current.length).split(path.sep).filter(Boolean)) {
      current = path.join(current, part);
      const stat = fs.lstatSync(current);
      if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error('symlink or non-directory');
    }
    if (fs.realpathSync(parent) !== parent) throw new Error('parent changed');
  } catch (error) { fail('UNSAFE_DESTINATION', '親は実在する通常フォルダにしてください。symlink親は使えません。', '実体の親フォルダを選び直してください。', {}, error); }
  if (requireAbsent && statMaybe(destination)) fail('DESTINATION_EXISTS', 'この名前のフォルダは既にあります。', '新しい名前か、別の親フォルダを選んでください。');
  return { path: parent, identity: identity(parent) };
}
function portValue(raw, fallback) {
  const value = raw === undefined ? String(fallback) : String(raw);
  if (!/^\d{4,5}$/.test(value) || Number(value) < 1024 || Number(value) > 65535) invalid('ポートは1024〜65535の整数です。');
  return Number(value);
}
export function normalizeRequest(request, template) {
  if (!request || typeof request !== 'object' || Array.isArray(request) || Object.keys(request).some(k => !['templateId', 'destination', 'name', 'port', 'dbBase'].includes(k))) invalid('生成リクエストの項目が不正です。');
  if (typeof request.destination !== 'string' || !request.destination.length || request.destination.length > 4096 || controls.test(request.destination)) invalid('保存先のパスを指定してください。制御文字は使えません。');
  const name = request.name ?? '';
  if (typeof name !== 'string' || (name && !/^[a-z][a-z0-9-]{0,24}$/.test(name))) invalid('識別ラベルは英小文字開始の英小文字・数字・ハイフン、1〜25文字です。');
  const normalized = { templateId: template.id, destination: path.resolve(request.destination), name, port: portValue(request.port, template.defaultPort) };
  if (template.id === 'S2') {
    normalized.dbBase = portValue(request.dbBase, template.hostPorts.shadow);
    if (normalized.dbBase > 65532 || (normalized.port >= normalized.dbBase && normalized.port <= normalized.dbBase + 3)) invalid('S2のDB開始値は65532以下で、連続4ポートをアプリのポートと分けてください。');
  } else if (request.dbBase !== undefined) invalid('DB開始ポートを指定できるのはS2だけです。');
  return normalized;
}
export function configuration(request) {
  const copyId = posixCksum(request.destination + (request.templateId === 'I1' ? '' : '\n'));
  const projectName = `otoka-${request.templateId.toLowerCase()}-${request.name ? request.name + '-' : ''}${copyId}`;
  const ports = request.templateId === 'I1' ? { database: request.port } : { app: request.port };
  if (request.templateId === 'S2') Object.assign(ports, { shadow: request.dbBase, api: request.dbBase + 1, database: request.dbBase + 2, studio: request.dbBase + 3 });
  return { projectName, copyId, ports };
}
export function environmentText(request, config, secret) {
  let value = `PROJECT_NAME=${config.projectName}\nHOST_PORT=${request.port}\n`;
  if (request.templateId === 'I1') value += `COPY_ID=${config.copyId}\nPOSTGRES_PASSWORD=${secret}\n`;
  if (request.templateId === 'S2') value += `SUPABASE_API_PORT=${config.ports.api}\nSUPABASE_DB_PORT=${config.ports.database}\nSUPABASE_STUDIO_PORT=${config.ports.studio}\nSUPABASE_SHADOW_PORT=${config.ports.shadow}\n`;
  return value;
}
