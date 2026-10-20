import { existsSync } from 'node:fs';
const failures = [];
if (process.versions.node !== '24.22.0') failures.push('Node 24.22.0で再構築してください');
if (!existsSync('package-lock.json')) failures.push('配布物のpackage-lock.jsonがありません');
if (!existsSync('node_modules')) failures.push('npm ciを実行してください');
if (!existsSync('.env.local')) failures.push('ホストで bash scripts/db.sh start を実行してください');
else {
  process.loadEnvFile('.env.local');
  const key = process.env.SUPABASE_ANON_KEY;
  const url = process.env.SUPABASE_URL;
  if (!key || !url) failures.push('ローカルDB設定が不足しています。ホストでDBを再開してください');
  else {
    try {
      const role = JSON.parse(Buffer.from(key.split('.')[1], 'base64url')).role;
      if (role !== 'anon') failures.push('匿名キー以外は使えません。ホストでDBを再開してください');
      else {
        const response = await fetch(`${url}/rest/v1/notes?select=id&limit=1`, { headers: { apikey: key, Authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(5000) });
        if (!response.ok) failures.push('メモの読取りに失敗しました。migrationとDBを確認してください');
      }
    } catch { failures.push('DBへ接続できません。ホストで bash scripts/db.sh status を確認してください'); }
  }
}
if (failures.length) {
  console.error(`診断NG: ${failures.join(' / ')}。docs/RECOVERY.mdを確認してください。`);
  process.exitCode = 1;
} else console.log('準備完了。npm run dev で開始、npm run check で静的確認します。');
