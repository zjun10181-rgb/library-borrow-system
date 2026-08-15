import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth } from '../auth.js';

export const commonRouter = Router();

commonRouter.use(requireAuth);

// GET /api/common?action=modules
// GET /api/common?action=stats
commonRouter.get('/', (req, res) => {
  const { action } = req.query;

  if (action === 'modules') {
    const rows = db.prepare('SELECT * FROM modules ORDER BY created_at ASC, id ASC').all();
    const modules = rows.map((m) => ({ ...m, is_public: Boolean(m.is_public) }));
    return res.json({ data: modules });
  }

  if (action === 'stats') {
    const total_books = db.prepare('SELECT COALESCE(SUM(total_copies),0) AS v FROM books').get().v;
    const available_books = db.prepare('SELECT COALESCE(SUM(available_copies),0) AS v FROM books').get().v;
    const total_borrowed = db.prepare('SELECT COUNT(*) AS v FROM borrow_records WHERE status != ?').get('returned').v;
    const total_users = db.prepare('SELECT COUNT(*) AS v FROM users').get().v;
    return res.json({ data: { total_books, available_books, total_borrowed, total_users } });
  }

  return res.status(400).json({ error: '未知操作' });
});
