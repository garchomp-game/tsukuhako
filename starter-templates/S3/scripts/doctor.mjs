import { existsSync } from 'node:fs';
import { settings } from '../lib/catalog.ts';
const failures = [];
if (process.versions.node !== '24.22.0') failures.push('Node 24.22.0で再構築してください');
if (!existsSync('package-lock.json')) failures.push('配布物のpackage-lock.jsonがありません');
if (!existsSync('node_modules')) failures.push('npm ciを実行してください');
if (existsSync('.env.local')) process.loadEnvFile('.env.local');
const connection = settings(process.env.SUPABASE_URL, process.env.SUPABASE_PUBLIC_KEY);
if (connection.state === 'invalid') failures.push(connection.message);
if (connection.state === 'missing') console.log('クラウド接続は未設定です。画面の設定案内とローカルテストを確認できます。READMEを参照してください。');
if (failures.length) {
  console.error(`診断NG: ${failures.join(' / ')}。docs/RECOVERY.mdを確認してください。`);
  process.exitCode = 1;
} else console.log('準備完了。npm run dev で開始、npm run check で静的確認します。');
