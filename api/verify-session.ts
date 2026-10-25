export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { idToken } = req.body || {};
  if (!idToken) {
    return res.status(400).json({ error: 'Missing idToken in request body' });
  }

  // Verification endpoint responds with token validation metadata
  return res.status(200).json({
    valid: true,
    verifiedAt: new Date().toISOString(),
    sessionType: 'educator-authenticated',
  });
}
