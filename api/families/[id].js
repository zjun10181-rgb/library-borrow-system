import jwt from 'jsonwebtoken';
import { pool, JWT_SECRET, initDBIfNeeded } from '../_shared.js';

export default async function handler(req, res) {
  await initDBIfNeeded();

  const { id } = req.query;
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: '未登录' });
  }

  try {
    jwt.verify(token, JWT_SECRET);

    if (req.method === 'GET') {
      const result = await pool.query('SELECT * FROM families WHERE id = $1', [id]);
      const family = result.rows[0];

      if (family) {
        const membersResult = await pool.query(
          'SELECT u.id, u.name, u.email FROM family_members fm JOIN users u ON fm.user_id = u.id WHERE fm.family_id = $1',
          [id]
        );
        family.members = membersResult.rows.map(m => m.id);
        family.memberDetails = membersResult.rows;
      }

      res.json({ data: family || null, error: null });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch {
    res.status(401).json({ error: 'token无效' });
  }
}
