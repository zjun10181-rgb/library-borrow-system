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

    if (req.method === 'DELETE') {
      const { id } = req.query;
      const userId = decoded.id;

      if (id === userId) {
        return res.status(400).json({ error: '不能删除自己' });
      }

      const result = await pool.query('DELETE FROM users WHERE id = $1', [id]);
      if (result.rowCount === 0) {
        return res.status(404).json({ error: '用户不存在' });
      }
      res.json({ error: null });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch {
    res.status(401).json({ error: 'token无效' });
  }
}
