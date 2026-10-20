import { existsSync } from 'node:fs';
const failures = [];
if (process.versions.node !== '24.22.0') failures.push('Node 24.22.0で再構築してください');
if (!existsSync('package-lock.json')) failures.push('配布物のpackage-lock.jsonがありません');
if (!existsSync('node_modules')) failures.push('npm ciを実行してください');
if (failures.length) {
  console.error(`診断NG: ${failures.join(' / ')}。docs/RECOVERY.mdを確認してください。`);
  process.exitCode = 1;
} else console.log('準備完了。npm run dev で開始、npm run check で静的確認します。');
