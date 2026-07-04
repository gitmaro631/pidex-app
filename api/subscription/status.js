export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const { username } = req.query;
  if (!username) return res.status(400).json({ error: 'username required' });
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) return res.status(500).json({ error: 'Redis not configured' });
  try {
    const response = await fetch(`${url}/get/${encodeURIComponent('sub:' + username)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    const expiry = data.result;
    if (!expiry || new Date(expiry) <= new Date()) return res.status(200).json({ active: false });
    return res.status(200).json({ active: true, expiry });
  } catch {
    return res.status(500).json({ error: 'Redis error' });
  }
}
