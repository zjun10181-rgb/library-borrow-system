import type { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import { pool, JWT_SECRET, initDBIfNeeded } from '../_shared';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await initDBIfNeeded();

  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: '未登录' });
  }

  try {
    jwt.verify(token, JWT_SECRET);

    if (req.method === 'GET') {
      const result = await pool.query('SELECT * FROM families ORDER BY created_at DESC');
      res.json({ data: result.rows, error: null });
    } else if (req.method === 'POST') {
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
      const { name, description } = req.body;
      const id = `family-${Date.now()}`;

      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        const familyResult = await client.query(
          `INSERT INTO families (id, name, head_of_family, description) 
           VALUES ($1, $2, $3, $4) RETURNING *`,
          [id, name, decoded.id, description || '']
        );

        await client.query(
          'INSERT INTO family_members (family_id, user_id) VALUES ($1, $2)',
          [id, decoded.id]
        );

        await client.query(
          'UPDATE users SET family_id = $1, updated_at = NOW() WHERE id = $2',
          [id, decoded.id]
        );

        const modId = `mod-family-${Date.now()}`;
        await client.query(
          `INSERT INTO modules (id, name, type, owner_id, is_public) 
           VALUES ($1, $2, $3, $4, $5)`,
          [modId, `${name}藏书`, 'family', id, false]
        );

        await client.query('COMMIT');

        const newFamily = familyResult.rows[0];
        newFamily.members = [decoded.id];

        res.json({ data: newFamily, error: null });
      } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: '创建家庭失败: ' + err.message });
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
