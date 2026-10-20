import { spawn } from 'node:child_process';
import { withManagedServer } from './managed-server.mjs';

if (process.env.BASE_URL || process.env.S2_MANAGED_TEST_SERVER) {
  throw new Error('BASE_URL/S2_MANAGED_TEST_SERVERを解除してください。統合試験は自分でローカルサーバーを起動します。');
}
function runNode(args, env) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, { stdio: 'inherit', env });
    child.once('error', reject);
    child.once('exit', (code, signal) => code === 0 ? resolve() : reject(new Error(`試験失敗: ${args[0]} (${signal ?? code})`)));
  });
}
await withManagedServer(async () => {
  const env = { ...process.env, BASE_URL: 'http://localhost:3000', S2_MANAGED_TEST_SERVER: '1' };
  console.log('STEP 1/2: HTTP contract against the local DB');
  await runNode(['--test', 'tests/api.test.mjs'], env);
  console.log('STEP 2/2: browser CRUD against the same managed server');
  await runNode(['node_modules/@playwright/test/cli.js', 'test'], env);
});
console.log('PASS: HTTP → browser → server/group exit → port released. Ready for npm run build.');
