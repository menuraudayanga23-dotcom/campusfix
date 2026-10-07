const { test } = require('node:test');
const assert = require('node:assert/strict');
const { hashPassword, verifyPassword } = require('../backend/password');
const v = require('../backend/validation');
test('password hashes are salted and only match the correct password', async () => {
  const first = await hashPassword('StrongPassword42!');
  const second = await hashPassword('StrongPassword42!');
  assert.notEqual(first, second);
  assert.equal(await verifyPassword('StrongPassword42!', first), true);
  assert.equal(await verifyPassword('WrongPassword42!', first), false);
});
test('validation rejects object injection and invalid report fields', () => {
  assert.throws(() => v.email({ $ne: '' }));
  assert.throws(() => v.password('short'));
  assert.throws(() => v.choice('administrator', ['student'], 'role'));
  assert.equal(v.email(' Student@Example.com '), 'student@example.com');
});
test('photo validation rejects disguised files and oversized uploads', () => {
  assert.throws(() => v.photo('data:image/svg+xml;base64,PHN2Zz4='));
  assert.throws(() => v.photo('data:image/png;base64,' + Buffer.from('not a png file').toString('base64')));
  assert.throws(() => v.photo('data:image/png;base64,' + Buffer.alloc(2*1024*1024+1).toString('base64')));
  assert.equal(v.photo(undefined), null);
});
