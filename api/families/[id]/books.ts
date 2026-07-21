import type { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import { pool, JWT_SECRET, initDBIfNeeded } from '../_shared';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await initDBIfNeeded();

  const { id } = req.query;
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: '未登录' });
  }

  try {
    jwt.verify(token, JWT_SECRET);

    if (req.method === 'GET') {
      const modResult = await pool.query(
        "SELECT id FROM modules WHERE owner_id = $1 AND type = 'family'",
        [id]
      );

      if (modResult.rows.length === 0) {
        return res.json({ data: [], error: null });
      }

      const booksResult = await pool.query(
        'SELECT * FROM books WHERE module_id = $1 ORDER BY created_at DESC',
        [modResult.rows[0].id]
      );

      res.json({ data: booksResult.rows, error: null });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch {
    res.status(401).json({ error: 'token无效' });
  }
}
