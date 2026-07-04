export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { username, expiry } = req.body;
  if (!username || !expiry) return res.status(400).json({ error: 'username and expiry required' });

  const expiryDate = new Date(expiry);
  if (isNaN(expiryDate.getTime()) || expiryDate <= new Date()) {
    return res.status(200).json({ success: false, reason: 'expired' });
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
