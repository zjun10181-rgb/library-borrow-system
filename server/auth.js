import { randomBytes, scryptSync, timingSafeEqual, createHmac } from 'node:crypto';
import { Router } from 'express';
import { db } from './db.js';

// ============ 密码哈希 (scrypt) ============
export function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, 'hex');
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

// ============ Token (HMAC 签名，免额外依赖) ============
const TOKEN_SECRET = process.env.LIBRARY_TOKEN_SECRET || 'library-local-secret-2026';
const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 天

function sign(payload) {
  return createHmac('sha256', TOKEN_SECRET).update(payload).digest('base64url');
}

export function createToken(userId) {
  const payload = Buffer.from(JSON.stringify({ uid: userId, exp: Date.now() + TOKEN_TTL_MS })).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

export function verifyToken(token) {
  try {
    const [payload, sig] = token.split('.');
    if (!payload || !sig) return null;
    if (sign(payload) !== sig) return null;
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (Date.now() > data.exp) return null;
    return data.uid;
  } catch {
    return null;
  }
}

// ============ 认证中间件 ============
/** 校验 Authorization: Bearer <token>，把用户挂到 req.user */
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  const uid = token ? verifyToken(token) : null;
  if (!uid) {
    return res.status(401).json({ error: '未登录或登录已过期，请重新登录' });
  }
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(uid);
  if (!user) {
    return res.status(401).json({ error: '用户不存在' });
  }
  req.user = user;
  req.uid = uid;
  next();
}

/** 仅管理员可访问 */
export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: '需要管理员权限' });
  }
  next();
}

// ============ 行 → 前端 User 对象 ============
export function rowToUser(row) {
  if (!row) return null;
  const { password_hash, approved, ...rest } = row;
  return { ...rest, approved: Boolean(approved) };
}

// ============ 认证路由 ============
export const authRouter = Router();

// GET /api/auth?action=me
authRouter.get('/', (req, res) => {
  if (req.query.action !== 'me') {
    return res.status(400).json({ error: '未知操作' });
  }
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  const uid = token ? verifyToken(token) : null;
  if (!uid) return res.json({ data: null });
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(uid);
  if (!user) return res.json({ data: null });
  return res.json({ data: rowToUser(user) });
});

// POST /api/auth?action=login
authRouter.post('/', (req, res) => {
  const { action } = req.query;
  const { email, password, name, role, oldPassword, newPassword } = req.body || {};

  if (action === 'login') {
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(String(email || '').trim().toLowerCase());
    if (!user || !verifyPassword(String(password || ''), user.password_hash)) {
      return res.status(401).json({ error: '邮箱或密码错误' });
    }
    if (!user.approved) {
      return res.status(403).json({ error: '账号尚未审核通过，请等待管理员批准' });
    }
    return res.json({ data: { user: rowToUser(user), token: createToken(user.id) } });
  }

  if (action === 'register') {
    const emailNorm = String(email || '').trim().toLowerCase();
    if (!emailNorm || !password || !name) {
      return res.status(400).json({ error: '请填写完整信息' });
    }
    const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(emailNorm);
    if (exists) {
      return res.status(409).json({ error: '该邮箱已被注册' });
    }
    const now = new Date().toISOString().split('T')[0];
    const id = `user_${Date.now()}`;
    const approved = role === 'admin' ? 1 : 0;
    db.prepare(`
      INSERT INTO users (id, email, password_hash, name, role, approved, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, emailNorm, hashPassword(String(password)), String(name), role || 'student', approved, now, now);
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    return res.json({ data: rowToUser(user) });
  }

  if (action === 'change-password') {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    const uid = token ? verifyToken(token) : null;
    if (!uid) return res.status(401).json({ error: '未登录' });
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(uid);
    if (!user) return res.status(404).json({ error: '用户不存在' });
    if (!verifyPassword(String(oldPassword || ''), user.password_hash)) {
      return res.status(400).json({ error: '原密码错误' });
    }
    const now = new Date().toISOString().split('T')[0];
    db.prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?').run(hashPassword(String(newPassword)), now, uid);
    return res.json({ data: { success: true } });
  }

  return res.status(400).json({ error: '未知操作' });
});
