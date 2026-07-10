import { gcsPutObject, validateSlotParams } from './_gcs.js';

const WALLET_MAX = 30;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { category, username, slot, wallets } = req.body;
    const s = validateSlotParams(category, username, slot);
    if (!Array.isArray(wallets)) return res.status(400).json({ error: 'wallets required' });
    const trimmed = wallets.slice(0, WALLET_MAX);
    await gcsPutObject(category, username, s, {
      wallets: trimmed,
      updatedAt: new Date().toISOString(),
    });
    return res.status(200).json({ ok: true, count: trimmed.length });
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
}
