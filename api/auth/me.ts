import type { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import { pool, JWT_SECRET, initDBIfNeeded, sanitizeUser } from '../_shared';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await initDBIfNeeded();

  if (req.method === 'GET') {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: '未登录' });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
      const result = await pool.query('SELECT * FROM users WHERE id = $1', [decoded.id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ error: '用户不存在' });
      }
      res.json({ data: sanitizeUser(result.rows[0]), error: null });
    } catch {
      res.status(401).json({ error: 'token无效' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
