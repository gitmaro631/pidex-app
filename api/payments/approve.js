export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { paymentId } = req.body;
  if (!paymentId) return res.status(400).json({ error: 'paymentId required' });
  const apiKey = process.env.PI_NETWORK_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'PI_NETWORK_API_KEY not configured' });
  const response = await fetch(
    `https://api.minepi.com/v2/payments/${paymentId}/approve`,
    { method: 'POST', headers: { Authorization: `Key ${apiKey}` } }
  );
  const data = await response.json();
  if (!response.ok) return res.status(response.status).json(data);
  return res.status(200).json(data);
}
