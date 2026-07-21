import type { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import { pool, JWT_SECRET, initDBIfNeeded } from '../_shared';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await initDBIfNeeded();

  if (req.method === 'GET') {
    const { keyword, category, module_id } = req.query;
    let query = 'SELECT * FROM books WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

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

    const result = await pool.query(query, params);
    res.json({ data: result.rows, error: null });
  } else if (req.method === 'POST') {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: '未登录' });
    }

    try {
      jwt.verify(token, JWT_SECRET);

      const { title, author, category, isbn, description, cover_url, total_copies, module_id } = req.body;
      const id = `book-${Date.now()}`;
      const copies = total_copies || 1;

      const result = await pool.query(
        `INSERT INTO books (id, title, author, category, isbn, description, cover_url, total_copies, available_copies, module_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
        [id, title, author, category || '', isbn || '', description || '', cover_url || '', copies, copies, module_id || '']
      );

      res.json({ data: result.rows[0], error: null });
    } catch {
      res.status(401).json({ error: 'token无效' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
