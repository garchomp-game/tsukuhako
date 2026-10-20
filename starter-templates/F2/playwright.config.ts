import { defineConfig } from '@playwright/test';
const baseURL = process.env.BASE_URL || 'http://localhost:3101';
export default defineConfig({
  testDir: './tests/browser', timeout: 30000, workers: 1,
  reporter: 'list',
  use: { baseURL, headless: true, launchOptions: process.env.CHROME_BIN ? { executablePath: process.env.CHROME_BIN } : {} },
  webServer: process.env.BASE_URL ? undefined : { command: 'npm run dev -- --port 3101', url: baseURL, reuseExistingServer: false, timeout: 90000 }
});
