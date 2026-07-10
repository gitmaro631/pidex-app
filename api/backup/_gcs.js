import crypto from 'crypto';

const ALLOWED_CATEGORIES = ['testnet'];

function b64url(input) {
  return Buffer.from(input).toString('base64url');
}

async function getAccessToken() {
  const keyB64 = process.env.GCS_SA_KEY_B64;
  if (!keyB64) throw new Error('GCS_SA_KEY_B64 not configured');
  const key = JSON.parse(Buffer.from(keyB64, 'base64').toString('utf8'));

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const claim = {
    iss: key.client_email,
    scope: 'https://www.googleapis.com/auth/devstorage.read_write',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  };
  const unsigned = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(claim))}`;
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(unsigned);
  signer.end();
  const signature = signer.sign(key.private_key).toString('base64url');
  const jwt = `${unsigned}.${signature}`;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });
  const data = await res.json();
  if (!data.access_token) throw new Error('GCS auth failed');
  return data.access_token;
}

export function validateSlotParams(category, username, slot) {
  if (!ALLOWED_CATEGORIES.includes(category)) throw new Error('invalid category');
  if (!username || typeof username !== 'string') throw new Error('username required');
  const s = Number(slot);
  if (!Number.isInteger(s) || s < 1 || s > 5) throw new Error('invalid slot');
  return s;
}

function objectName(category, username, slot) {
  return `backups/${category}/${encodeURIComponent(username)}/slot${slot}.json`;
}

export async function gcsGetObject(category, username, slot) {
  const token  = await getAccessToken();
  const bucket = process.env.GCS_BACKUP_BUCKET;
  if (!bucket) throw new Error('GCS_BACKUP_BUCKET not configured');
  const name = objectName(category, username, slot);
  const res = await fetch(
    `https://storage.googleapis.com/storage/v1/b/${bucket}/o/${encodeURIComponent(name)}?alt=media`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GCS get failed: ${res.status}`);
  return res.json();
}

export async function gcsPutObject(category, username, slot, payload) {
  const token  = await getAccessToken();
  const bucket = process.env.GCS_BACKUP_BUCKET;
  if (!bucket) throw new Error('GCS_BACKUP_BUCKET not configured');
  const name = objectName(category, username, slot);
  const res = await fetch(
    `https://storage.googleapis.com/upload/storage/v1/b/${bucket}/o?uploadType=media&name=${encodeURIComponent(name)}`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }
  );
  if (!res.ok) throw new Error(`GCS put failed: ${res.status}`);
  return res.json();
}
