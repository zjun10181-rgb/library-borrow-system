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

    if (req.method === 'POST') {
      const { userId } = req.body;

      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        const familyResult = await client.query('SELECT * FROM families WHERE id = $1', [id]);
        if (familyResult.rows.length === 0) {
          await client.query('ROLLBACK');
          return res.status(404).json({ error: '家庭不存在' });
        }

        await client.query(
          'INSERT INTO family_members (family_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [id, userId]
        );

        await client.query(
          'UPDATE users SET family_id = $1, updated_at = NOW() WHERE id = $2',
          [id, userId]
        );

        await client.query('COMMIT');
        res.json({ data: { success: true }, error: null });
      } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: '添加成员失败: ' + err.message });
      } finally {
        client.release();
      }
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch {
    res.status(401).json({ error: 'token无效' });
  }
}
