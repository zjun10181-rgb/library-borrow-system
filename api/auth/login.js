import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool, JWT_SECRET, initDBIfNeeded, sanitizeUser } from '../_shared.js';

export default async function handler(req, res) {
  await initDBIfNeeded();

  if (req.method === 'POST') {
    const { email, password } = req.body;

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) {
      return res.status(400).json({ error: '邮箱或密码错误' });
    }

    if (!bcrypt.compareSync(password, user.password_hash)) {
      return res.status(400).json({ error: '邮箱或密码错误' });
    }

    if (!user.approved) {
      return res.status(400).json({ error: '您的账号尚未被管理员批准' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ data: { user: sanitizeUser(user), token }, error: null });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
