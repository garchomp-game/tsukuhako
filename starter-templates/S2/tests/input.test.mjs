import test from 'node:test';
import assert from 'node:assert/strict';
import { validateNote, validId } from '../lib/note-input.ts';

test('trim and Unicode code point boundaries', () => {
  assert.deepEqual(validateNote({ body: '　こんにちは📝 \n' }), { ok: true, body: 'こんにちは📝' });
  assert.equal(validateNote({ body: '📝'.repeat(200) }).ok, true);
  assert.equal(validateNote({ body: '📝'.repeat(201) }).ok, false);
  assert.equal(validateNote({ body: 'a'.repeat(200) }).ok, true);
  assert.equal(validateNote({ body: 'a'.repeat(201) }).ok, false);
});
test('missing, non-string, whitespace and invalid Unicode are rejected', () => {
  for (const input of [null, {}, [], { body: 12 }, { body: false }, { body: '' }, { body: '\uFEFF\t\u00A0　\n' }, { body: '\u0000' }, { body: '\uD800' }]) {
    assert.equal(validateNote(input).ok, false, JSON.stringify(input));
  }
});
test('markup remains literal data and IDs are constrained', () => {
  assert.deepEqual(validateNote({ body: '<script>alert(1)</script>' }), { ok: true, body: '<script>alert(1)</script>' });
  assert.equal(validId('11111111-1111-4111-8111-111111111111'), true);
  assert.equal(validId('x&body=eq.all'), false);
});
