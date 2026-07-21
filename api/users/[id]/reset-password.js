import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { pool, JWT_SECRET, initDBIfNeeded } from '../_shared.js';

export default async function handler(req, res) {
  await initDBIfNeeded();

  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: '未登录' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: '需要管理员权限' });
    }

    if (req.method === 'PUT') {
      const { id } = req.query;
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
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch {
    res.status(401).json({ error: 'token无效' });
  }
}
