import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth } from '../auth.js';

export const borrowRouter = Router();

borrowRouter.use(requireAuth);

/** 借阅记录行 + 关联图书/用户信息 → 前端 BorrowRecordWithBook */
function rowToBorrowRecord(row) {
  if (!row) return null;
  const book = db.prepare('SELECT id, title, author, cover_url FROM books WHERE id = ?').get(row.book_id);
  let user = null;
  if (row.user_id) {
    user = db.prepare('SELECT id, name, email FROM users WHERE id = ?').get(row.user_id);
  }
  return {
    ...row,
    status: row.status === 'overdue' ? 'overdue' : row.status,
    books: {
      title: book?.title || '未知书籍',
      author: book?.author || '',
      id: book?.id || '',
      cover_url: book?.cover_url,
    },
    users: user ? { name: user.name, id: user.id, email: user.email } : undefined,
  };
}

// GET /api/borrow-records?user_id=X
borrowRouter.get('/', (req, res) => {
  const { user_id } = req.query;
  let rows;
  if (user_id) {
    rows = db.prepare('SELECT * FROM borrow_records WHERE user_id = ? ORDER BY created_at DESC, borrow_date DESC').all(String(user_id));
  } else {
    rows = db.prepare('SELECT * FROM borrow_records ORDER BY created_at DESC, borrow_date DESC').all();
  }
  return res.json({ data: rows.map(rowToBorrowRecord) });
});

// POST /api/borrow-records?action=create
borrowRouter.post('/', (req, res) => {
  const { action } = req.query;

  if (action === 'create') {
    const body = req.body || {};
    const bookId = String(body.book_id || '');
    const book = db.prepare('SELECT * FROM books WHERE id = ?').get(bookId);
    if (!book) return res.status(404).json({ error: '图书不存在' });

    const now = new Date().toISOString().split('T')[0];
    const id = `record_${Date.now()}`;

    // 前端 BorrowForm 未传 user_id 时，自动绑定为当前登录用户，便于"我的借阅"按人查询
    const userId = body.user_id || req.uid || null;
    db.prepare(`
      INSERT INTO borrow_records (id, book_id, user_id, borrower_name, borrower_contact, borrow_date, due_date, return_date, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      bookId,
      userId,
      String(body.borrower_name || req.user.name || '未知借阅人'),
      String(body.borrower_contact || ''),
      body.borrow_date || now,
      body.due_date || now,
      null,
      body.status || 'borrowed',
      now,
      now
    );

    const row = db.prepare('SELECT * FROM borrow_records WHERE id = ?').get(id);
    return res.json({ data: rowToBorrowRecord(row) });
  }

  if (action === 'return') {
    const { id } = req.query;
    const row = db.prepare('SELECT * FROM borrow_records WHERE id = ?').get(id);
    if (!row) return res.status(404).json({ error: '借阅记录不存在' });
    if (row.status === 'returned') return res.status(400).json({ error: '该记录已归还' });

    const now = new Date().toISOString().split('T')[0];
    db.prepare('UPDATE borrow_records SET status = ?, return_date = ?, updated_at = ? WHERE id = ?')
      .run('returned', now, now, id);

    // 归还后加回库存
    db.prepare('UPDATE books SET available_copies = available_copies + 1, updated_at = ? WHERE id = ?')
      .run(now, row.book_id);

    const updated = db.prepare('SELECT * FROM borrow_records WHERE id = ?').get(id);
    return res.json({ data: rowToBorrowRecord(updated) });
  }

  return res.status(400).json({ error: '未知操作' });
});
