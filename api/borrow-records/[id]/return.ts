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
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: string };

    if (req.method === 'PUT') {
      const recordResult = await pool.query('SELECT * FROM borrow_records WHERE id = $1', [id]);
      if (recordResult.rows.length === 0) {
        return res.status(404).json({ error: '借阅记录不存在' });
      }

      const record = recordResult.rows[0];

      if (decoded.role !== 'admin' && record.user_id !== decoded.id) {
        return res.status(403).json({ error: '无权操作' });
      }

      const today = new Date().toISOString().split('T')[0];

      const updateResult = await pool.query(
        `UPDATE borrow_records SET status = 'returned', return_date = $1, updated_at = NOW()
         WHERE id = $2 RETURNING *`,
        [today, id]
      );

      await pool.query(
        'UPDATE books SET available_copies = available_copies + 1, updated_at = NOW() WHERE id = $1',
        [record.book_id]
      );

      res.json({ data: updateResult.rows[0], error: null });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch {
    res.status(401).json({ error: 'token无效' });
  }
}
