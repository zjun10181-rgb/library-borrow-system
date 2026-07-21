import jwt from 'jsonwebtoken';
import { pool, JWT_SECRET, initDBIfNeeded } from '../_shared.js';

export default async function handler(req, res) {
  await initDBIfNeeded();

  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: '未登录' });
  }

  try {
    jwt.verify(token, JWT_SECRET);

    if (req.method === 'GET') {
      const [booksResult, borrowedResult, usersResult] = await Promise.all([
        pool.query('SELECT COALESCE(SUM(total_copies), 0) as total, COALESCE(SUM(available_copies), 0) as available FROM books'),
        pool.query("SELECT COUNT(*) as count FROM borrow_records WHERE status = 'borrowed'"),
        pool.query('SELECT COUNT(*) as count FROM users'),
      ]);

      res.json({
        data: {
          total_books: parseInt(booksResult.rows[0].total),
          available_books: parseInt(booksResult.rows[0].available),
          total_borrowed: parseInt(borrowedResult.rows[0].count),
          total_users: parseInt(usersResult.rows[0].count),
        },
        error: null
      });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch {
    res.status(401).json({ error: 'token无效' });
  }
}
