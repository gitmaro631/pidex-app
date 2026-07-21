import { verifyPiUser } from './_verifyPiUser.js';
import { mintFirebaseCustomToken } from './_firebaseToken.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { accessToken } = req.body;
  const username = await verifyPiUser(accessToken);
  if (!username) return res.status(401).json({ error: 'invalid accessToken' });

  try {
    const token = await mintFirebaseCustomToken(username, { username });
    return res.status(200).json({ token });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
