import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool, JWT_SECRET, initDBIfNeeded, sanitizeUser } from '../lib/shared.js';

export default async function handler(req, res) {
  await initDBIfNeeded();

  const { action } = req.query;

  if (action === 'login' && req.method === 'POST') {
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
  } else if (action === 'register' && req.method === 'POST') {
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
  } else if (action === 'me' && req.method === 'GET') {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: '未登录' });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const result = await pool.query('SELECT * FROM users WHERE id = $1', [decoded.id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ error: '用户不存在' });
      }
      res.json({ data: sanitizeUser(result.rows[0]), error: null });
    } catch {
      res.status(401).json({ error: 'token无效' });
    }
  } else if (action === 'change-password' && req.method === 'PUT') {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: '未登录' });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
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
    } catch {
      res.status(401).json({ error: 'token无效' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
