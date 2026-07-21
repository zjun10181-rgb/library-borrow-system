import type { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import { pool, JWT_SECRET, initDBIfNeeded } from '../_shared';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await initDBIfNeeded();

  const { id } = req.query;

  if (req.method === 'GET') {
    const result = await pool.query('SELECT * FROM books WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: '图书不存在' });
    }
    res.json({ data: result.rows[0], error: null });
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
