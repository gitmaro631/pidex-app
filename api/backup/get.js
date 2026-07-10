import { gcsGetObject, validateSlotParams } from './_gcs.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { category, username, slot } = req.body;
    const s = validateSlotParams(category, username, slot);
    const data = await gcsGetObject(category, username, s);
    if (!data) return res.status(200).json({ exists: false });
    return res.status(200).json({ exists: true, updatedAt: data.updatedAt, wallets: data.wallets ?? [] });
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
}
