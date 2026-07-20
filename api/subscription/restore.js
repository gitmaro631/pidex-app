import { verifyPiUser } from '../_verifyPiUser.js';

const MAX_EXTEND_MS = 400 * 24 * 3600 * 1000; // 400일 — 로컬 만료값을 자기 자신에게 무한정 연장하는 자가남용 방지용 상한

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { accessToken, expiry } = req.body;
  if (!expiry) return res.status(400).json({ error: 'expiry required' });

  // 클라이언트가 보낸 username은 신뢰하지 않는다 — accessToken으로 검증된 본인 계정에만 적용
  const username = await verifyPiUser(accessToken);
  if (!username) return res.status(401).json({ error: 'invalid accessToken' });

  const expiryDate = new Date(expiry);
  if (isNaN(expiryDate.getTime()) || expiryDate <= new Date()) {
    return res.status(200).json({ success: false, reason: 'expired' });
  }
  if (expiryDate.getTime() - Date.now() > MAX_EXTEND_MS) {
    return res.status(400).json({ error: 'expiry too far in the future' });
  }

  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) return res.status(500).json({ error: 'Redis not configured' });

  const ttlSeconds = Math.floor((expiryDate - new Date()) / 1000);
  const upstashRes = await fetch(`${url}/set/${encodeURIComponent('sub:' + username)}/${encodeURIComponent(expiry)}?ex=${ttlSeconds}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!upstashRes.ok) return res.status(500).json({ error: 'Redis write failed' });

  return res.status(200).json({ success: true, expiry });
}
