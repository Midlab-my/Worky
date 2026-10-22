import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { transform } from 'esbuild';
const source = (await readFile(new URL('../src/app/services/auth.ts', import.meta.url), 'utf8'))
  .replaceAll('import.meta.env.VITE_SUPABASE_URL', JSON.stringify('https://project.supabase.co'))
  .replaceAll('import.meta.env.VITE_SUPABASE_ANON_KEY', JSON.stringify('public-key'));
const { code } = await transform(source, { loader: 'ts', format: 'esm' });
const auth = await import('data:text/javascript;base64,' + Buffer.from(code).toString('base64'));
const exp = Math.floor(Date.now() / 1000) + 3600;
function token(aal = 'aal2') { return 'header.' + Buffer.from(JSON.stringify({ aal, exp })).toString('base64url') + '.signature'; }
function session(aal = 'aal2') { return { accessToken: token(aal), refreshToken: 'refresh', expiresAt: exp, tokenType: 'bearer' }; }
function response(aal = 'aal2') { return { access_token: token(aal), refresh_token: 'rotated', expires_at: exp }; }
function mockFetch(replies) {
  const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push({ url, ...options, body: options.body ? JSON.parse(options.body) : undefined });
    const reply = replies.shift();
    assert.ok(reply, 'Unexpected request');
    return new Response(JSON.stringify(reply.body ?? reply), { status: reply.status || 200 });
  };
  return calls;
}
test('AAL1, missing, malformed and expired sessions cannot unlock UI', () => {
  assert.equal(auth.hasAal2(session()), true);
  for (const value of [null, session('aal1'), session(null), { ...session(), accessToken: 'bad' }, { ...session(), expiresAt: 0 }]) assert.equal(auth.hasAal2(value), false);
});
test('recovery uses native recovery type and does not persist a login session', async () => {
  globalThis.window = { location: { origin: 'https://worky.example' }, localStorage: { setItem() { assert.fail('Recovery must not persist'); } } };
  const calls = mockFetch([{}, response('aal1')]);
  await auth.requestPasswordResetOtp(' TEST@EXAMPLE.COM ');
  const recovered = await auth.verifyPasswordResetOtp('test@example.com', '123456');
  assert.equal(calls[0].body.email, 'test@example.com');
  assert.match(calls[0].url, /\/recover\?redirect_to=/);
  assert.deepEqual(calls[1].body, { email: 'test@example.com', token: '123456', type: 'recovery' });
  assert.equal(auth.hasAal2(recovered), false);
});
test('invalid OTP is rejected before a request and expired OTP fails', async () => {
  const calls = mockFetch([{ status: 403, body: { message: 'Token expired' } }]);
  await assert.rejects(auth.verifyPasswordResetOtp('a@b.com', 'abcdef'));
  assert.equal(calls.length, 0);
  await assert.rejects(auth.verifyPasswordResetOtp('a@b.com', '123456'));
});
test('TOTP exchanges challenge for AAL2 and rotates refresh token', async () => {
  const calls = mockFetch([{ id: 'challenge-id' }, response()]);
  const upgraded = await auth.verifyTotp(session('aal1'), 'factor-id', '123456');
  assert.deepEqual(calls[1].body, { challenge_id: 'challenge-id', code: '123456' });
  assert.equal(upgraded.refreshToken, 'rotated');
  assert.equal(auth.hasAal2(upgraded), true);
});
test('TOTP cannot succeed with AAL1 response or invalid code', async () => {
  mockFetch([{ id: 'challenge' }, response('aal1')]);
  await assert.rejects(auth.verifyTotp(session('aal1'), 'factor', '123456'));
  await assert.rejects(auth.verifyTotp(session('aal1'), 'factor', 'backup-code'));
});
test('active factors are never deleted during enrollment', async () => {
  const calls = mockFetch([{ factors: [{ id: 'active', factor_type: 'totp', status: 'verified' }] }]);
  await assert.rejects(auth.enrollTotp(session('aal1')));
  assert.equal(calls.length, 1);
});
test('password update sends the new password then logs out', async () => {
  const calls = mockFetch([{}, {}]);
  await auth.completePasswordReset(session(), 'NewPassword!123');
  assert.equal(calls[0].method, 'PUT');
  assert.deepEqual(calls[0].body, { password: 'NewPassword!123' });
  assert.match(calls[1].url, /\/logout$/);
});
