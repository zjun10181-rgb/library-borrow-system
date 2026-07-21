import jwt from 'jsonwebtoken';
import { pool, JWT_SECRET, initDBIfNeeded } from '../_shared.js';

export default async function handler(req, res) {
  await initDBIfNeeded();

  const { id } = req.query;

  if (req.method === 'GET') {
    const { keyword, category, module_id } = req.query;
    let query = 'SELECT * FROM books WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (id) {
      params.push(id);
      query = 'SELECT * FROM books WHERE id = $1';
    } else {
      if (module_id) {
        params.push(module_id);
        query += ` AND module_id = $${paramIndex++}`;
      }
      if (category) {
        params.push(category);
        query += ` AND category = $${paramIndex++}`;
      }
      if (keyword) {
        const kw = `%${keyword}%`;
        params.push(kw);
        query += ` AND (title ILIKE $${paramIndex++} OR author ILIKE $${paramIndex++})`;
        params.push(kw);
      }
      query += ' ORDER BY created_at DESC';
    }

    const result = await pool.query(query, params);
    if (id && result.rows.length === 0) {
      return res.status(404).json({ error: '图书不存在' });
    }
    res.json({ data: id ? result.rows[0] : result.rows, error: null });
  } else if (req.method === 'POST') {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: '未登录' });
    }

    try {
      jwt.verify(token, JWT_SECRET);

      const { title, author, category, isbn, description, cover_url, total_copies, module_id } = req.body;
      const bookId = `book-${Date.now()}`;
      const copies = total_copies || 1;

      const result = await pool.query(
        `INSERT INTO books (id, title, author, category, isbn, description, cover_url, total_copies, available_copies, module_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
        [bookId, title, author, category || '', isbn || '', description || '', cover_url || '', copies, copies, module_id || '']
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
      jwt.verify(token, JWT_SECRET);

      const { title, author, category, isbn, description, cover_url, total_copies, module_id } = req.body;

      const current = await pool.query('SELECT * FROM books WHERE id = $1', [id]);
      if (current.rows.length === 0) {
        return res.status(404).json({ error: '图书不存在' });
      }

      const book = current.rows[0];
      let available = book.available_copies;

      if (total_copies !== undefined) {
        const diff = total_copies - book.total_copies;
        available = Math.max(0, book.available_copies + diff);
      }

      const result = await pool.query(
        `UPDATE books SET 
           title = COALESCE($1, title),
           author = COALESCE($2, author),
           category = COALESCE($3, category),
           isbn = COALESCE($4, isbn),
           description = COALESCE($5, description),
           cover_url = COALESCE($6, cover_url),
           total_copies = COALESCE($7, total_copies),
           available_copies = $8,
           module_id = COALESCE($9, module_id),
           updated_at = NOW()
         WHERE id = $10 RETURNING *`,
        [title, author, category, isbn, description, cover_url, total_copies, available, module_id, id]
      );

      res.json({ data: result.rows[0], error: null });
    } catch {
      res.status(401).json({ error: 'token无效' });
    }
  } else if (req.method === 'DELETE') {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: '未登录' });
    }

    try {
      jwt.verify(token, JWT_SECRET);

      const result = await pool.query('DELETE FROM books WHERE id = $1', [id]);
      if (result.rowCount === 0) {
        return res.status(404).json({ error: '图书不存在' });
      }
      res.json({ error: null });
    } catch {
      res.status(401).json({ error: 'token无效' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
