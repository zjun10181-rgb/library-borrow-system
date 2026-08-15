import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth, requireAdmin, hashPassword, rowToUser } from '../auth.js';

export const usersRouter = Router();

// 需要登录
usersRouter.use(requireAuth);

/** 行 → 前端 User（含 family 关联信息） */
function withFamily(row) {
  const user = rowToUser(row);
  return user;
}

// GET /api/users —— 用户列表
usersRouter.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM users ORDER BY created_at DESC').all();
  const users = rows.map(withFamily);
  // 附带家庭名称
  const families = db.prepare('SELECT id, name FROM families').all();
  const famMap = Object.fromEntries(families.map((f) => [f.id, f.name]));
  return res.json({ data: users.map((u) => ({ ...u, family_name: u.family_id ? famMap[u.family_id] : undefined })) });
});

// POST /api/users?action=approve&id=X
usersRouter.post('/', (req, res) => {
  const { action } = req.query;
  const { id } = req.query;

  if (action === 'approve') {
    if (req.user.role !== 'admin') return res.status(403).json({ error: '需要管理员权限' });
    const now = new Date().toISOString().split('T')[0];
    const info = db.prepare('UPDATE users SET approved = 1, updated_at = ? WHERE id = ?').run(now, id);
    if (info.changes === 0) return res.status(404).json({ error: '用户不存在' });
    const row = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    return res.json({ data: rowToUser(row) });
  }

  if (action === 'role') {
    if (req.user.role !== 'admin') return res.status(403).json({ error: '需要管理员权限' });
    const { role } = req.body || {};
    if (!['student', 'teacher', 'parent', 'admin'].includes(role)) {
      return res.status(400).json({ error: '无效的角色' });
    }
    const now = new Date().toISOString().split('T')[0];
    const info = db.prepare('UPDATE users SET role = ?, updated_at = ? WHERE id = ?').run(role, now, id);
    if (info.changes === 0) return res.status(404).json({ error: '用户不存在' });
    const row = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    return res.json({ data: rowToUser(row) });
  }

  if (action === 'delete') {
    if (req.user.role !== 'admin') return res.status(403).json({ error: '需要管理员权限' });
    if (id === req.uid) return res.status(400).json({ error: '不能删除自己' });
    const info = db.prepare('DELETE FROM users WHERE id = ?').run(id);
    if (info.changes === 0) return res.status(404).json({ error: '用户不存在' });
    return res.json({ data: null });
  }

  if (action === 'reset-password') {
    // id 参数实际是 email（与前端 resetPassword(email, newPassword) 一致）
    if (req.user.role !== 'admin') return res.status(403).json({ error: '需要管理员权限' });
    const { newPassword } = req.body || {};
    if (!newPassword) return res.status(400).json({ error: '新密码不能为空' });
    const email = String(id || '').trim().toLowerCase();
    const now = new Date().toISOString().split('T')[0];
    const info = db.prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE email = ?')
      .run(hashPassword(String(newPassword)), now, email);
    if (info.changes === 0) return res.status(404).json({ error: '用户不存在' });
    return res.json({ data: { success: true } });
  }

  return res.status(400).json({ error: '未知操作' });
});
