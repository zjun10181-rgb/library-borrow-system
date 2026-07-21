import type { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import { pool, JWT_SECRET, initDBIfNeeded, sanitizeUser } from '../_shared';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await initDBIfNeeded();

  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: '未登录' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { role: string };
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: '需要管理员权限' });
    }

    if (req.method === 'GET') {
      const result = await pool.query('SELECT * FROM users ORDER BY created_at DESC');
      const users = result.rows.map(sanitizeUser);
      res.json({ data: users, error: null });
    } else if (req.method === 'PUT') {
      const { id } = req.query;
      const { role } = req.body;

      const result = await pool.query(
        'UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
        [role, id]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: '用户不存在' });
      }
      res.json({ data: sanitizeUser(result.rows[0]), error: null });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch {
    res.status(401).json({ error: 'token无效' });
  }
}
