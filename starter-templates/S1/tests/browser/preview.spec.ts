import { expect, test } from "@playwright/test";

test("navigate, submit to the real API, show normalized result, and clear", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "練習画面へ" }).click();
  await expect(page).toHaveURL(/\/practice$/);
  await page.getByLabel("送信することば").fill("  こんにちは  ");
  const received = page.waitForResponse((response) => response.url().endsWith("/api/preview") && response.request().method() === "POST");
  await page.getByRole("button", { name: "プレビューを送信" }).click();
  const response = await received;
  expect(response.status()).toBe(200);
  expect(await response.json()).toEqual({ text: "こんにちは", length: 5 });
  await expect(page.getByTestId("preview-result")).toHaveText("こんにちは");
  await expect(page.getByText("5 コードポイント", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "クリア", exact: true }).click();
  await expect(page.getByLabel("送信することば")).toHaveValue("");
  await expect(page.getByTestId("preview-result")).toHaveCount(0);
  await page.getByRole("link", { name: "← トップへ" }).click();
  await expect(page).toHaveURL(/\/$/);
});

test("API input errors can be corrected and retried", async ({ page }) => {
  await page.goto("/practice");
  await page.getByLabel("送信することば").fill("   ");
  await page.getByRole("button", { name: "プレビューを送信" }).click();
  await expect(page.getByRole("region", { name: "プレビューの練習" }).getByRole("alert")).toHaveText("空白以外の文字を入力してください");
  await page.getByLabel("送信することば").fill("😀".repeat(201));
  await page.getByRole("button", { name: "プレビューを送信" }).click();
  await expect(page.getByRole("region", { name: "プレビューの練習" }).getByRole("alert")).toHaveText("200コードポイント以内で入力してください");
  await page.getByLabel("送信することば").fill("再送信");
  await page.getByRole("button", { name: "プレビューを送信" }).click();
  await expect(page.getByTestId("preview-result")).toHaveText("再送信");
});

test("pending state blocks repeated submissions and editing until the response", async ({ page }) => {
  let requests = 0;
  let release!: () => void;
  const gate = new Promise<void>((resolve) => { release = resolve; });
  await page.route("**/api/preview", async (route) => {
    requests += 1;
    await gate;
    await route.continue();
  });
  await page.goto("/practice");
  await page.getByLabel("送信することば").fill("遅延の確認");
  // Two synchronous events also exercise the ref guard before a React render.
  await page.locator("form").evaluate((form) => {
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  });
  await expect(page.getByRole("status")).toHaveText("APIの応答を待っています。");
  await expect(page.getByRole("button", { name: "送信中…" })).toBeDisabled();
  await expect(page.getByLabel("送信することば")).toBeDisabled();
  await expect(page.getByRole("button", { name: "クリア", exact: true })).toBeDisabled();
  await expect.poll(() => requests).toBe(1);
  release();
  await expect(page.getByTestId("preview-result")).toHaveText("遅延の確認");
  expect(requests).toBe(1);
  await expect(page.getByRole("button", { name: "プレビューを送信" })).toBeEnabled();
});

test("network failure and API failure show retryable public messages", async ({ page }) => {
  await page.goto("/practice");
  await page.getByLabel("送信することば").fill("通信の確認");
  await page.route("**/api/preview", (route) => route.abort("internetdisconnected"));
  await page.getByRole("button", { name: "プレビューを送信" }).click();
  await expect(page.getByRole("region", { name: "プレビューの練習" }).getByRole("alert")).toContainText("通信に失敗しました");
  await page.unroute("**/api/preview");
  await page.route("**/api/preview", (route) => route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ stack: "internal host secret", error: { message: "internal failure" } }) }));
  await page.getByRole("button", { name: "プレビューを送信" }).click();
  await expect(page.getByRole("region", { name: "プレビューの練習" }).getByRole("alert")).toContainText("APIで問題が起きました");
  await expect(page.getByRole("region", { name: "プレビューの練習" }).getByRole("alert")).not.toContainText("internal");
  await page.unroute("**/api/preview");
  await page.getByRole("button", { name: "プレビューを送信" }).click();
  await expect(page.getByTestId("preview-result")).toHaveText("通信の確認");
});

test("script-shaped input remains text and reload clears transient state", async ({ page }) => {
  await page.goto("/practice");
  const text = '<script>window.__previewExecuted = true</script><b>そのまま</b>';
  await page.getByLabel("送信することば").fill(text);
  await page.getByRole("button", { name: "プレビューを送信" }).click();
  await expect(page.getByTestId("preview-result")).toHaveText(text);
  await expect(page.getByTestId("preview-result").locator("script, b")).toHaveCount(0);
  expect(await page.evaluate(() => "__previewExecuted" in window)).toBe(false);
  await page.reload();
  await expect(page.getByLabel("送信することば")).toHaveValue("");
  await expect(page.getByTestId("preview-result")).toHaveCount(0);
});
