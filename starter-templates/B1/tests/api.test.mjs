import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { startServer } from "./server.mjs";

let server;
before(async () => { server = await startServer("next"); });
after(async () => { await server?.stop(); });

function request(text, options = {}) {
  return fetch(`${server.url}/api/preview`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }), ...options });
}
async function expectError(response, status, code, message) {
  assert.equal(response.status, status);
  const body = await response.json();
  assert.deepEqual(Object.keys(body), ["error"]);
  assert.deepEqual(Object.keys(body.error).sort(), ["code", "message"]);
  assert.equal(body.error.code, code);
  assert.equal(typeof body.error.message, "string");
  assert.ok(body.error.message.length > 0);
  if (message) assert.equal(body.error.message, message);
  assert.doesNotMatch(body.error.message, /stack|Error:|node_modules|\/workspace\//);
}

test("health exposes only the status", async () => {
  const response = await fetch(`${server.url}/api/health`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: "ok" });
});

test("preview normalizes surrounding whitespace and returns code point length", async () => {
  for (const [text, expected] of [["こんにちは", { text: "こんにちは", length: 5 }], ["  こんにちは  ", { text: "こんにちは", length: 5 }], ["\t\n hello world \r\n", { text: "hello world", length: 11 }]]) {
    const response = await request(text);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), expected);
  }
});

test("Unicode counts code points, not UTF-16 code units or graphemes", async () => {
  const response = await request("😀e\u0301");
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { text: "😀e\u0301", length: 3 });
});

test("malformed JSON has the exact public error", async () => {
  await expectError(await request(undefined, { body: '{"text":' }), 400, "INVALID_JSON", "JSONを確認してください");
});

test("missing, non-string and non-object values are rejected", async () => {
  for (const body of [{}, { text: 42 }, { text: false }, { text: null }, { text: [] }, null, [], "hello"]) {
    await expectError(await request(undefined, { body: JSON.stringify(body) }), 400, "INVALID_INPUT");
  }
});

test("empty or whitespace-only input is rejected", async () => {
  for (const text of ["", " ", "\t\r\n", "\u3000"]) await expectError(await request(text), 400, "INVALID_INPUT");
});

test("200 code points are accepted after trim; 201 are rejected", async () => {
  for (const character of ["あ", "😀"]) {
    const text = character.repeat(200);
    const response = await request(`  ${text}  `);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { text, length: 200 });
    await expectError(await request(character.repeat(201)), 400, "INVALID_INPUT");
  }
});

test("Content-Type accepts a JSON parameter and rejects other media types", async () => {
  const accepted = await request("ok", { headers: { "Content-Type": "application/json; charset=utf-8" } });
  assert.equal(accepted.status, 200);
  for (const contentType of ["text/plain", "application/x-www-form-urlencoded", "application/jsonp"]) {
    await expectError(await request("hello", { headers: { "Content-Type": contentType } }), 415, "UNSUPPORTED_MEDIA_TYPE");
  }
  await expectError(await request("hello", { headers: {} }), 415, "UNSUPPORTED_MEDIA_TYPE");
});

test("undefined methods return 405; automatic HEAD and OPTIONS follow Next.js", async () => {
  for (const method of ["GET", "PUT", "PATCH", "DELETE", "HEAD"]) {
    const response = await fetch(`${server.url}/api/preview`, { method });
    assert.equal(response.status, 405, `preview ${method}`);
    if (method === "HEAD") assert.equal(await response.text(), "");
  }
  for (const method of ["POST", "PUT", "PATCH", "DELETE"]) assert.equal((await fetch(`${server.url}/api/health`, { method })).status, 405, `health ${method}`);
  const head = await fetch(`${server.url}/api/health`, { method: "HEAD" });
  assert.equal(head.status, 200);
  assert.equal(await head.text(), "");
  for (const [path, expected] of [["health", ["GET", "HEAD", "OPTIONS"]], ["preview", ["OPTIONS", "POST"]]]) {
    const response = await fetch(`${server.url}/api/${path}`, { method: "OPTIONS" });
    assert.equal(response.status, 204);
    assert.deepEqual(response.headers.get("allow").split(",").map((item) => item.trim()).sort(), expected);
    assert.equal(await response.text(), "");
  }
});

test("script-shaped text remains text and responses have no stored state", async () => {
  const text = '<script>window.hacked = true</script>';
  const response = await request(text);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { text, length: 37 });
  const later = await request("次の入力");
  assert.deepEqual(await later.json(), { text: "次の入力", length: 4 });
});
