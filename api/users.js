import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { pool, JWT_SECRET, initDBIfNeeded, sanitizeUser } from '../lib/shared.js';

export default async function handler(req, res) {
  await initDBIfNeeded();

  const { id, action } = req.query;

  if (req.method === 'GET') {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: '未登录' });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      if (decoded.role !== 'admin') {
        return res.status(403).json({ error: '需要管理员权限' });
      }

      const result = await pool.query('SELECT * FROM users ORDER BY created_at DESC');
      const users = result.rows.map(sanitizeUser);
      res.json({ data: users, error: null });
    } catch {
      res.status(401).json({ error: 'token无效' });
    }
  } else if (req.method === 'PUT') {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: '未登录' });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      if (decoded.role !== 'admin') {
        return res.status(403).json({ error: '需要管理员权限' });
      }

      if (action === 'role') {
        const { role } = req.body;
        const result = await pool.query(
          'UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
          [role, id]
        );
        if (result.rows.length === 0) {
          return res.status(404).json({ error: '用户不存在' });
        }
        res.json({ data: sanitizeUser(result.rows[0]), error: null });
      } else if (action === 'approve') {
        const result = await pool.query(
          'UPDATE users SET approved = true, updated_at = NOW() WHERE id = $1 RETURNING *',
          [id]
        );
        if (result.rows.length === 0) {
          return res.status(404).json({ error: '用户不存在' });
        }
        res.json({ data: sanitizeUser(result.rows[0]), error: null });
      } else if (action === 'reset-password') {
        const { newPassword } = req.body;
        const newHash = bcrypt.hashSync(newPassword, 10);
        const result = await pool.query(
          'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
          [newHash, id]
        );
        if (result.rowCount === 0) {
          return res.status(404).json({ error: '用户不存在' });
        }
        res.json({ data: { success: true }, error: null });
      } else {
        res.status(400).json({ error: '未知操作' });
      }
    } catch {
      res.status(401).json({ error: 'token无效' });
    }
  } else if (req.method === 'DELETE') {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: '未登录' });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      if (decoded.role !== 'admin') {
        return res.status(403).json({ error: '需要管理员权限' });
      }

      if (id === decoded.id) {
        return res.status(400).json({ error: '不能删除自己' });
      }

      const result = await pool.query('DELETE FROM users WHERE id = $1', [id]);
      if (result.rowCount === 0) {
        return res.status(404).json({ error: '用户不存在' });
      }
      res.json({ error: null });
    } catch {
      res.status(401).json({ error: 'token无效' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
