import { test, expect } from '@playwright/test';
test('ページ遷移、入力、文字列の安全な表示、クリア、再読込', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('小さく変えて');
  await page.getByRole('link', { name: '練習画面へ' }).click();
  await expect(page).toHaveURL(/\/practice$/);
  await page.getByLabel('つくりたいもの').fill('学習ノート📓');
  await expect(page.getByRole('status')).toHaveText('学習ノート📓');
  await page.getByLabel('つくりたいもの').fill('<script>window.__injected=true</script>');
  await expect(page.getByRole('status')).toHaveText('<script>window.__injected=true</script>');
  expect(await page.evaluate(() => '__injected' in window)).toBe(false);
  await page.getByRole('button', { name: 'クリア' }).click();
  await expect(page.getByLabel('つくりたいもの')).toHaveValue('');
  await page.getByLabel('つくりたいもの').fill('一時的な入力');
  await page.reload();
  await expect(page.getByLabel('つくりたいもの')).toHaveValue('');
  await page.getByRole('link', { name: 'トップへ' }).click();
  await expect(page).toHaveURL(/\/$/);
});
