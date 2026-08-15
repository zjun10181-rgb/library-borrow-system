import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth } from '../auth.js';

export const booksRouter = Router();

// 登录即可：普通用户借书/还书需要调用 updateBook 调整库存，
// 家庭用户需要在家庭图书馆中增删图书，故不限制为管理员。
booksRouter.use(requireAuth);

// GET /api/books?keyword=&category=&module_id=
booksRouter.get('/', (req, res) => {
  let sql = 'SELECT * FROM books WHERE 1=1';
  const params = [];

  const { keyword, category, module_id } = req.query;
  if (keyword) {
    sql += ' AND (title LIKE ? OR author LIKE ?)';
    const kw = `%${String(keyword)}%`;
    params.push(kw, kw);
  }
  if (category) {
    sql += ' AND category = ?';
    params.push(String(category));
  }
  if (module_id) {
    sql += ' AND module_id = ?';
    params.push(String(module_id));
  }
  sql += ' ORDER BY created_at DESC, id DESC';

  // GET /api/books?action=get&id=X
  if (req.query.action === 'get') {
    const row = db.prepare('SELECT * FROM books WHERE id = ?').get(req.query.id);
    if (!row) return res.status(404).json({ error: '图书不存在' });
    return res.json({ data: row });
  }

  const rows = db.prepare(sql).all(...params);
  return res.json({ data: rows });
});

// POST /api/books?action=create
booksRouter.post('/', (req, res) => {
  const { action } = req.query;
  const b = req.body || {};

  if (action === 'create') {
    const now = new Date().toISOString().split('T')[0];
    const id = `book_${Date.now()}`;
    const total = Number(b.total_copies) > 0 ? Number(b.total_copies) : 1;
    db.prepare(`
      INSERT INTO books (id, title, author, category, isbn, description, cover_url, total_copies, available_copies, module_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      String(b.title || ''),
      String(b.author || ''),
      b.category || null,
      b.isbn || '',
      b.description || '',
      b.cover_url || null,
      total,
      total,
      b.module_id || null,
      now,
      now
    );
    const row = db.prepare('SELECT * FROM books WHERE id = ?').get(id);
    return res.json({ data: row });
  }

  if (action === 'update') {
    const { id } = req.query;
    const existing = db.prepare('SELECT * FROM books WHERE id = ?').get(id);
    if (!existing) return res.status(404).json({ error: '图书不存在' });
    const now = new Date().toISOString().split('T')[0];
    const merged = {
      ...existing,
      ...b,
      total_copies: b.total_copies !== undefined ? Number(b.total_copies) : existing.total_copies,
      available_copies: b.available_copies !== undefined ? Number(b.available_copies) : existing.available_copies,
      module_id: b.module_id !== undefined ? b.module_id : existing.module_id,
      updated_at: now,
    };
    db.prepare(`
      UPDATE books
      SET title=?, author=?, category=?, isbn=?, description=?, cover_url=?, total_copies=?, available_copies=?, module_id=?, updated_at=?
      WHERE id=?
    `).run(
      merged.title, merged.author, merged.category, merged.isbn, merged.description,
      merged.cover_url, merged.total_copies, merged.available_copies, merged.module_id,
      now, id
    );
    const row = db.prepare('SELECT * FROM books WHERE id = ?').get(id);
    return res.json({ data: row });
  }

  if (action === 'delete') {
    const { id } = req.query;
    // 若存在未归还的借阅记录，禁止删除
    const active = db.prepare('SELECT id FROM borrow_records WHERE book_id = ? AND status != ?').get(id, 'returned');
    if (active) return res.status(400).json({ error: '该图书存在未归还的借阅记录，无法删除' });
    const info = db.prepare('DELETE FROM books WHERE id = ?').run(id);
    if (info.changes === 0) return res.status(404).json({ error: '图书不存在' });
    return res.json({ data: null });
  }

  return res.status(400).json({ error: '未知操作' });
});
