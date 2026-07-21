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

    if (req.method === 'PUT') {
      const { oldPassword, newPassword } = req.body;

      const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [decoded.id]);
      const user = userResult.rows[0];

      if (!user || !bcrypt.compareSync(oldPassword, user.password_hash)) {
        return res.status(400).json({ error: '旧密码错误' });
      }

      const newHash = bcrypt.hashSync(newPassword, 10);
      await pool.query(
        'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
        [newHash, decoded.id]
      );

      res.json({ data: { success: true }, error: null });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch {
    res.status(401).json({ error: 'token无效' });
  }
}
