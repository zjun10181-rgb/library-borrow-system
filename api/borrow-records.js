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
      const decoded = jwt.verify(token, JWT_SECRET);
      const { user_id } = req.query;

      let query = `
        SELECT br.*, 
               b.title as book_title, b.author as book_author, b.cover_url as book_cover,
               u.name as user_name, u.email as user_email
        FROM borrow_records br
        LEFT JOIN books b ON br.book_id = b.id
        LEFT JOIN users u ON br.user_id = u.id
        WHERE 1=1
      `;
      const params = [];
      let paramIndex = 1;

      if (decoded.role !== 'admin') {
        params.push(decoded.id);
        query += ` AND br.user_id = $${paramIndex++}`;
      } else if (user_id) {
        params.push(user_id);
        query += ` AND br.user_id = $${paramIndex++}`;
      }

      query += ' ORDER BY br.created_at DESC';

      const result = await pool.query(query, params);

      const records = result.rows.map(r => ({
        id: r.id,
        book_id: r.book_id,
        user_id: r.user_id,
        borrow_date: r.borrow_date,
        due_date: r.due_date,
        return_date: r.return_date,
        status: r.status,
        created_at: r.created_at,
        updated_at: r.updated_at,
        books: {
          id: r.book_id,
          title: r.book_title,
          author: r.book_author,
          cover_url: r.book_cover
        },
        users: {
          id: r.user_id,
          name: r.user_name,
          email: r.user_email
        }
      }));

      res.json({ data: records, error: null });
    } catch {
      res.status(401).json({ error: 'token无效' });
    }
  } else if (req.method === 'POST') {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: '未登录' });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const { book_id, due_date } = req.body;
      const now = new Date();
      const today = now.toISOString().split('T')[0];

      const bookResult = await pool.query('SELECT * FROM books WHERE id = $1 FOR UPDATE', [book_id]);
      if (bookResult.rows.length === 0) {
        return res.status(404).json({ error: '图书不存在' });
      }

      const book = bookResult.rows[0];
      if (book.available_copies <= 0) {
        return res.status(400).json({ error: '该图书暂时不可借' });
      }

      const borrowId = `borrow-${Date.now()}`;
      const result = await pool.query(
        `INSERT INTO borrow_records (id, book_id, user_id, borrow_date, due_date, status)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [borrowId, book_id, decoded.id, today, due_date || null, 'borrowed']
      );

      await pool.query(
        'UPDATE books SET available_copies = available_copies - 1, updated_at = NOW() WHERE id = $1',
        [book_id]
      );

      res.json({ data: result.rows[0], error: null });
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

      if (action === 'return') {
        const recordResult = await pool.query('SELECT * FROM borrow_records WHERE id = $1', [id]);
        if (recordResult.rows.length === 0) {
          return res.status(404).json({ error: '借阅记录不存在' });
        }

        const record = recordResult.rows[0];

        if (decoded.role !== 'admin' && record.user_id !== decoded.id) {
          return res.status(403).json({ error: '无权操作' });
        }

        const today = new Date().toISOString().split('T')[0];

        const updateResult = await pool.query(
          `UPDATE borrow_records SET status = 'returned', return_date = $1, updated_at = NOW()
           WHERE id = $2 RETURNING *`,
          [today, id]
        );

        await pool.query(
          'UPDATE books SET available_copies = available_copies + 1, updated_at = NOW() WHERE id = $1',
          [record.book_id]
        );

        res.json({ data: updateResult.rows[0], error: null });
      } else {
        res.status(400).json({ error: '未知操作' });
      }
    } catch {
      res.status(401).json({ error: 'token无效' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
