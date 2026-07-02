export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { accessToken } = req.body;
  if (!accessToken) return res.status(400).json({ error: 'accessToken required' });

  try {
    const response = await fetch('https://api.minepi.com/v2/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-API-Key': process.env.PI_NETWORK_API_KEY ?? '',
      },
    });
    const status = response.status;
    const data = await response.json();
    // 디버그: 원본 응답 전체 반환
    return res.status(200).json({
      wallet_address: data.wallet_address ?? null,
      _debug: { status, keys: Object.keys(data), data },
    });
  } catch (e) {
    return res.status(200).json({ wallet_address: null, _debug: { error: e.message } });
  }
}
