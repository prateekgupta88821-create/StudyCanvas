export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing Bearer token' });
  }

  const token = authHeader.split(' ')[1];
  const { action, fileId } = req.body || {};

  try {
    if (action === 'check-file') {
      const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,mimeType,size,modifiedTime`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      return res.status(response.status).json(data);
    }

    return res.status(400).json({ error: 'Invalid action specified' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Server-side Drive operation failed' });
  }
}
