import test from 'node:test';
import assert from 'node:assert/strict';
const base = process.env.BASE_URL ?? 'http://127.0.0.1:3000';
const headers = { 'Content-Type': 'application/json' };
const missing = 'ffffffff-ffff-4fff-8fff-ffffffffffff';
const request = (path = '', init) => fetch(`${base}/api/notes${path}`, init);

test('real local API persists trimmed Unicode CRUD and returns missing ID errors', async () => {
  const created = await request('', { method: 'POST', headers, body: JSON.stringify({ body: '　API試験📝　' }) });
  assert.equal(created.status, 201);
  const { note } = await created.json();
  try {
    assert.equal(note.body, 'API試験📝');
    const listed = await (await request()).json();
    assert.ok(listed.notes.some(item => item.id === note.id && item.body === 'API試験📝'));
    const updated = await request(`/${note.id}`, { method: 'PATCH', headers, body: JSON.stringify({ body: '📝'.repeat(200) }) });
    assert.equal(updated.status, 200);
    const data = await updated.json();
    assert.equal(Array.from(data.note.body).length, 200);
    assert.ok(new Date(data.note.updated_at) >= new Date(note.updated_at));
  } finally { assert.equal((await request(`/${note.id}`, { method: 'DELETE' })).status, 204); }
  assert.equal((await request(`/${note.id}`, { method: 'DELETE' })).status, 404);
  assert.equal((await request(`/${missing}`, { method: 'PATCH', headers, body: JSON.stringify({ body: '不在' }) })).status, 404);
  assert.equal((await request('/invalid', { method: 'DELETE' })).status, 400);
});

test('invalid content and unsupported methods have predictable statuses', async () => {
  for (const input of [{}, { body: 1 }, { body: '' }, { body: '　\n' }, { body: 'a'.repeat(201) }, { body: '📝'.repeat(201) }]) {
    const response = await request('', { method: 'POST', headers, body: JSON.stringify(input) });
    assert.equal(response.status, 400, JSON.stringify(input));
    assert.equal((await response.json()).error.code, 'INVALID_INPUT');
  }
  const malformed = await request('', { method: 'POST', headers, body: '{' });
  assert.equal(malformed.status, 400);
  assert.equal((await malformed.json()).error.code, 'INVALID_JSON');
  assert.equal((await request('', { method: 'POST', body: '{}' })).status, 415);
  assert.equal((await request('', { method: 'PUT' })).status, 405);
  assert.equal((await request(`/${missing}`, { method: 'POST' })).status, 405);
  assert.equal((await request('', { method: 'HEAD' })).status, 200);
  assert.equal((await request('', { method: 'OPTIONS' })).status, 204);
});
