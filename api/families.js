import jwt from 'jsonwebtoken';
import { pool, JWT_SECRET, initDBIfNeeded } from '../_shared.js';

export default async function handler(req, res) {
  await initDBIfNeeded();

  const { id, action } = req.query;

  if (req.method === 'GET') {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: '未登录' });
    }

    try {
      jwt.verify(token, JWT_SECRET);

      if (id && action === 'books') {
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
      } else if (id) {
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
        const result = await pool.query('SELECT * FROM families ORDER BY created_at DESC');
        res.json({ data: result.rows, error: null });
      }
    } catch {
      res.status(401).json({ error: 'token无效' });
    }
  } else if (req.method === 'POST') {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: '未登录' });
    }

    try {
      jwt.verify(token, JWT_SECRET);

      if (id && action === 'members') {
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
        const decoded = jwt.verify(token, JWT_SECRET);
        const { name, description } = req.body;
        const familyId = `family-${Date.now()}`;

        const client = await pool.connect();
        try {
          await client.query('BEGIN');

          const familyResult = await client.query(
            `INSERT INTO families (id, name, head_of_family, description) 
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [familyId, name, decoded.id, description || '']
          );

          await client.query(
            'INSERT INTO family_members (family_id, user_id) VALUES ($1, $2)',
            [familyId, decoded.id]
          );

          await client.query(
            'UPDATE users SET family_id = $1, updated_at = NOW() WHERE id = $2',
            [familyId, decoded.id]
          );

          const modId = `mod-family-${Date.now()}`;
          await client.query(
            `INSERT INTO modules (id, name, type, owner_id, is_public) 
             VALUES ($1, $2, $3, $4, $5)`,
            [modId, `${name}藏书`, 'family', familyId, false]
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
      }
    } catch {
      res.status(401).json({ error: 'token无效' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
