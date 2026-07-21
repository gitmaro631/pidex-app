import crypto from 'crypto';

function b64url(input) {
  return Buffer.from(input).toString('base64url');
}

// Firebase 커스텀 로그인 토큰 발급 — signInWithCustomToken()이 요구하는 전용 JWT 형식
// (Firestore REST용 OAuth 토큰과는 다른 aud/claims 구조)
export async function mintFirebaseCustomToken(uid, claims = {}) {
  const keyB64 = process.env.FIRESTORE_SA_KEY_B64;
  if (!keyB64) throw new Error('FIRESTORE_SA_KEY_B64 not configured');
  const key = JSON.parse(Buffer.from(keyB64, 'base64').toString('utf8'));

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: key.client_email,
    sub: key.client_email,
    aud: 'https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit',
    iat: now,
    exp: now + 3600,
    uid,
    claims,
  };
  const unsigned = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(payload))}`;
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(unsigned);
  signer.end();
  const signature = signer.sign(key.private_key).toString('base64url');
  return `${unsigned}.${signature}`;
}
