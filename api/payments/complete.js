export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { paymentId, txid, username } = req.body;
  if (!paymentId || !txid) return res.status(400).json({ error: 'paymentId and txid required' });
  const apiKey = process.env.PI_NETWORK_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'PI_NETWORK_API_KEY not configured' });
  const response = await fetch(
    `https://api.minepi.com/v2/payments/${paymentId}/complete`,
    {
      method: 'POST',
      headers: { Authorization: `Key ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ txid }),
    }
  );
  const data = await response.json();
  if (!response.ok) return res.status(response.status).json(data);

  if (data.metadata?.type === 'subscription' && username) {
    try { await saveSubscription(username); } catch (e) { console.error('Redis save failed:', e); }
  }

  return res.status(200).json(data);
}

async function saveSubscription(username) {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) return;
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + 30);
  const ex = 30 * 24 * 3600;
  await fetch(`${url}/set/${encodeURIComponent('sub:' + username)}/${encodeURIComponent(expiry.toISOString())}?ex=${ex}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}
