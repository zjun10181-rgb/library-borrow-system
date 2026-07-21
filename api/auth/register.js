import bcrypt from 'bcryptjs';
import { pool, initDBIfNeeded, sanitizeUser } from '../_shared.js';

export default async function handler(req, res) {
  await initDBIfNeeded();

  if (req.method === 'POST') {
    const { email, password, name, role } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: '邮箱、密码和姓名不能为空' });
    }

    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: '该邮箱已被注册' });
    }

    const id = `user-${Date.now()}`;
    const passwordHash = bcrypt.hashSync(password, 10);

    const result = await pool.query(
      `INSERT INTO users (id, email, password_hash, name, role, approved) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [id, email, passwordHash, name, role || 'student', false]
    );

    res.json({ data: sanitizeUser(result.rows[0]), error: null });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
