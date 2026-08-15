import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth } from '../auth.js';

export const familiesRouter = Router();

familiesRouter.use(requireAuth);

/** 行 → 前端 Family（members 反序列化 + 成员详情） */
function rowToFamily(row) {
  if (!row) return null;
  let members = [];
  try {
    members = JSON.parse(row.members || '[]');
  } catch {
    members = [];
  }
  const memberDetails = members.length
    ? db.prepare('SELECT * FROM users WHERE id IN (' + members.map(() => '?').join(',') + ')').all(...members)
    : [];
  return {
    id: row.id,
    name: row.name,
    head_of_family: row.head_of_family,
    members,
    memberDetails: memberDetails.map((m) => {
      const { password_hash, ...rest } = m;
      return { ...rest, approved: Boolean(m.approved) };
    }),
    description: row.description,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

// GET /api/families
familiesRouter.get('/', (req, res) => {
  const { action, id } = req.query;

  if (action === 'get') {
    const row = db.prepare('SELECT * FROM families WHERE id = ?').get(id);
    if (!row) return res.status(404).json({ error: '家庭不存在' });
    return res.json({ data: rowToFamily(row) });
  }

  if (action === 'books') {
    // 家庭图书 = 该家庭拥有者名下模块下的图书（type='family' 且 owner 属于该家庭）
    const fam = db.prepare('SELECT * FROM families WHERE id = ?').get(id);
    if (!fam) return res.status(404).json({ error: '家庭不存在' });
    let members = [];
    try { members = JSON.parse(fam.members || '[]'); } catch { members = []; }
    const placeholders = members.map(() => '?').join(',');
    const rows = db.prepare(`
      SELECT b.* FROM books b
      JOIN modules m ON b.module_id = m.id
      WHERE m.type = 'family' AND m.owner_id IN (${placeholders || "''"})
      ORDER BY b.created_at DESC, b.id DESC
    `).all(...members);
    return res.json({ data: rows });
  }

  const rows = db.prepare('SELECT * FROM families ORDER BY created_at DESC').all();
  return res.json({ data: rows.map(rowToFamily) });
});

// POST /api/families?action=create
familiesRouter.post('/', (req, res) => {
  const { action } = req.query;

  if (action === 'create') {
    const body = req.body || {};
    if (!body.name) return res.status(400).json({ error: '家庭名称不能为空' });
    const now = new Date().toISOString().split('T')[0];
    const id = `family_${Date.now()}`;
    const members = body.members || (req.uid ? [req.uid] : []);
    db.prepare(`
      INSERT INTO families (id, name, head_of_family, members, description, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      String(body.name),
      body.head_of_family || req.uid || null,
      JSON.stringify(members),
      body.description || null,
      now,
      now
    );
    // 同步创建家庭专属模块
    db.prepare(`
      INSERT INTO modules (id, name, description, type, owner_id, is_public, created_at, updated_at)
      VALUES (?, ?, ?, 'family', ?, 0, ?, ?)
    `).run(`family_mod_${Date.now()}`, `${body.name}藏书`, `家庭 ${body.name} 的私有图书`, req.uid || '', now, now);
    const row = db.prepare('SELECT * FROM families WHERE id = ?').get(id);
    return res.json({ data: rowToFamily(row) });
  }

  if (action === 'add-member') {
    const { id } = req.query;
    const { userId } = req.body || {};
    if (!userId) return res.status(400).json({ error: '缺少用户ID' });
    const fam = db.prepare('SELECT * FROM families WHERE id = ?').get(id);
    if (!fam) return res.status(404).json({ error: '家庭不存在' });
    let members = [];
    try { members = JSON.parse(fam.members || '[]'); } catch { members = []; }
    if (!members.includes(userId)) members.push(userId);
    const now = new Date().toISOString().split('T')[0];
    db.prepare('UPDATE families SET members = ?, updated_at = ? WHERE id = ?').run(JSON.stringify(members), now, id);
    // 同步更新用户的 family_id
    db.prepare('UPDATE users SET family_id = ?, updated_at = ? WHERE id = ?').run(id, now, userId);
    const row = db.prepare('SELECT * FROM families WHERE id = ?').get(id);
    return res.json({ data: rowToFamily(row) });
  }

  return res.status(400).json({ error: '未知操作' });
});
