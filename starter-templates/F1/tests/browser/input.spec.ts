import { expect, test } from "@playwright/test";

test("input reflects immediately, clears, and is not persisted after reload", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "ことばの鏡" })).toBeVisible();
  const input = page.getByLabel("表示することば");
  await input.fill("こんにちは、ツクハコ。\n😀");
  await expect(page.getByTestId("preview")).toHaveText("こんにちは、ツクハコ。\n😀");
  await expect(page.getByText("11 コードポイント")).toBeVisible();
  await page.getByRole("button", { name: "クリア" }).click();
  await expect(input).toHaveValue("");
  await expect(page.getByTestId("preview")).toHaveText("入力したことばがここに表示されます。");
  await expect(page.getByRole("button", { name: "クリア" })).toBeDisabled();
  await input.fill("再読み込み前");
  await page.reload();
  await expect(input).toHaveValue("");
});

test("script markup displays as text without introducing elements", async ({ page }) => {
  await page.goto("/");
  const text = '<script>window.__previewExecuted = true</script><b>そのまま</b>';
  await page.getByLabel("表示することば").fill(text);
  await expect(page.getByTestId("preview")).toHaveText(text);
  await expect(page.getByTestId("preview").locator("script, b")).toHaveCount(0);
  expect(await page.evaluate(() => "__previewExecuted" in window)).toBe(false);
});
