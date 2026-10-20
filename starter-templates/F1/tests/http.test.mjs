import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { startServer } from "./server.mjs";

let server;
before(async () => { server = await startServer("vite"); });
after(async () => { await server?.stop(); });

test("Vite serves the Japanese application shell and the executable React entry", async () => {
  const response = await fetch(server.url);
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type"), /text\/html/);
  const html = await response.text();
  assert.match(html, /<html lang="ja">/);
  assert.match(html, /<title>ツクハコ｜入力と表示の練習<\/title>/);
  assert.match(html, /<div id="root"><\/div>/);
  const source = html.match(/<script type="module" src="([^"]*main\.tsx)"><\/script>/)?.[1];
  assert.ok(source, "HTML loads the application entry");
  const entry = await fetch(new URL(source, server.url));
  assert.equal(entry.status, 200);
  assert.match(entry.headers.get("content-type"), /javascript/);
  assert.match(await entry.text(), /createRoot/);
});
