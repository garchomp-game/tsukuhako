import path from 'node:path';
import { fail, readRegular } from './common.mjs';
import { presentationFor } from './presentation.mjs';

export const GOALS = [
  { id: 'screen', title: '画面を作りたい', templates: ['F2', 'F1'], summary: 'まず、サンプル画面をブラウザーに表示します。' },
  { id: 'api', title: 'データを返すAPIを作りたい', templates: ['B1'], summary: 'HTTPで受け取り、JSONを返す練習から。' },
  { id: 'fullstack', title: '画面からAPIへ値を送りたい', templates: ['S1'], summary: 'フォームの入力が、APIの応答になる流れを学びます。' },
  { id: 'database', title: '入力したメモをDBに保存したい', templates: ['S2'], summary: 'ローカルDBへ保存し、再読み込み後も残るメモを作ります。' },
  { id: 'sql', title: 'SQLでDBを操作したい', templates: ['I1'], summary: 'Web画面を使わず、SQLでデータを調べる練習から。' },
];
const features = {
  F1: [['React', '入力と表示'], ['API', 'DB']],
  F2: [['Next.js', 'Tailwind', 'ページと入力'], ['業務用APIの実装', 'DB']],
  B1: [['HTTP API', '入力検証'], ['アプリの操作画面', 'DB']],
  S1: [['フォーム', 'HTTP API'], ['DBへの保存']],
  S2: [['メモCRUD', 'ローカルDB'], ['クラウド公開', '利用者認証']],
  I1: [['PostgreSQL', 'SQL演習'], ['Web画面']],
  S3: [['参考資料'], ['検証済みクラウド接続']],
};
export function loadCatalog(root) {
  let catalog;
  try { catalog = JSON.parse(readRegular(path.join(root, 'catalog.json'), 2 * 1024 * 1024)); }
  catch (error) { fail('CATALOG_UNSUPPORTED', 'catalog.jsonを読み取れません。', '完全な配布物を新しい場所へ展開してください。', {}, error); }
  const bad = () => fail('CATALOG_UNSUPPORTED', 'catalog.jsonの形式・版・必須項目が対応外です。', '配布物のcatalogとZIPを確認してください。');
  if (catalog?.schemaVersion !== 1 || !Array.isArray(catalog.templates) || !catalog.templates.length || catalog.templates.length > 7) bad();
  const seen = new Set();
  for (const t of catalog.templates) {
    if (!t || !Object.hasOwn(features, t.id) || seen.has(t.id) || typeof t.generatorEligible !== 'boolean' ||
      !['PASS', 'FAIL', 'BLOCKED', 'NOT_RUN'].includes(t.validationStatus) || typeof t.implementationVersion !== 'string' || !/^\d+\.\d+\.\d+$/.test(t.implementationVersion) ||
      typeof t.packageSha256 !== 'string' || !/^[a-f0-9]{64}$/.test(t.packageSha256) || t.packagePath !== `dist/${t.id}-${t.implementationVersion}.zip` ||
      !Number.isInteger(t.defaultPort) || t.defaultPort < 1024 || t.defaultPort > 65535 || typeof t.title !== 'string') bad();
    if (t.id === 'S2' && (!Number.isInteger(t.hostPorts?.shadow) || t.hostPorts.shadow < 1024 || t.hostPorts.shadow > 65532)) bad();
    seen.add(t.id);
  }
  return catalog;
}
export function getTemplate(root, id) {
  const catalog = loadCatalog(root);
  const template = catalog.templates.find(t => t.id === id);
  if (!template || id === 'S3' || !template.generatorEligible || template.validationStatus !== 'PASS') {
    fail('UNSUPPORTED_TEMPLATE', 'この構成は新規作成の対象外です。', '用途一覧から検証済みの構成を選んでください。');
  }
  return template;
}
export function getTemplates(root) {
  return { goals: GOALS, templates: loadCatalog(root).templates.map(t => {
    const [included, notIncluded] = features[t.id];
    return { id: t.id, ...presentationFor(t.id), includedFeatures: [...included, 'サンプル', '教材', 'テスト', 'CI設定'], notIncluded: [...notIncluded],
      version: t.implementationVersion, defaultPort: t.defaultPort, dbBase: t.hostPorts?.shadow,
      eligible: t.id !== 'S3' && t.generatorEligible && t.validationStatus === 'PASS',
      prerequisites: t.prerequisites ?? [], validationScope: t.validationScope ?? '確認範囲は同梱の検証記録を参照', notRun: t.notRun ?? [] };
  }) };
}
