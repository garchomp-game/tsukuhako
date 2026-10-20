import { defineConfig } from '@playwright/test';
const managed = process.env.S2_MANAGED_TEST_SERVER === '1';
if (managed && process.env.BASE_URL !== 'http://localhost:3000') throw new Error('管理サーバーの接続先が一致しません。');
export default defineConfig({
  testDir: './tests/browser', workers: 1, fullyParallel: false,
  timeout: 30000,
  use: { baseURL: 'http://localhost:3000', headless: true, screenshot: 'only-on-failure' },
  webServer: managed ? undefined : {
    command: 'node node_modules/next/dist/bin/next dev --hostname 0.0.0.0 --port 3000',
    url: 'http://localhost:3000', reuseExistingServer: false, timeout: 120000,
    gracefulShutdown: { signal: 'SIGTERM', timeout: 10000 },
  },
});
