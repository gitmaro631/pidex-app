export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { accessToken } = req.body;
  if (!accessToken) return res.status(400).json({ error: 'accessToken required' });

  try {
    const response = await fetch('https://api.minepi.com/v2/me', {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });
    if (!response.ok) return res.status(200).json({ wallet_address: null });
    const data = await response.json();
    return res.status(200).json({ wallet_address: data.wallet_address ?? null });
  } catch {
    return res.status(200).json({ wallet_address: null });
  }
}
