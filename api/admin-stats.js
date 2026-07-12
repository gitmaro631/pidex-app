const ADMIN_USERNAME = 'cam1998pi';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const { username } = req.query;
  if (username !== ADMIN_USERNAME) return res.status(403).json({ error: 'forbidden' });

  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) return res.status(500).json({ error: 'Redis not configured' });

  try {
    let cursor = '0';
    let count = 0;
    do {
      const r = await fetch(`${url}/scan/${cursor}/match/sub:*/count/200`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await r.json();
      const [nextCursor, keys] = data.result;
      count += keys.length;
      cursor = nextCursor;
    } while (cursor !== '0');

    return res.status(200).json({ subscriberCount: count });
  } catch {
    return res.status(500).json({ error: 'Redis error' });
  }
}
