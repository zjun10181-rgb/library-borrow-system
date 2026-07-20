import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { JSONFilePreset } from 'lowdb/node';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'library-secret-key-change-in-production';
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'db.json');

// 中间件
app.use(cors({
  origin: ['https://library-borrow-system.netlify.app', 'http://localhost:5173', 'http://localhost:4173'],
  credentials: true
}));
app.use(express.json());

// 数据库默认结构
const defaultData = {
  users: [],
  families: [],
  modules: [],
  books: [],
  borrowRecords: [],
};

const db = await JSONFilePreset(DB_PATH, defaultData);

// 初始化默认数据
async function initDefaultData() {
  if (db.data.users.length === 0) {
    console.log('初始化默认数据...');
    const now = new Date().toISOString();
    
    // 创建管理员
    const adminHash = bcrypt.hashSync('admin123', 10);
    db.data.users.push({
      id: 'admin-001',
      email: 'admin@library.com',
      password_hash: adminHash,
      name: '管理员',
      role: 'admin',
      approved: true,
      family_id: null,
      created_at: now,
      updated_at: now
    });

    // 创建模块
    const modules = [
      { id: 'm1', name: '文学经典', type: 'school', is_public: true },
      { id: 'm2', name: '科技科普', type: 'school', is_public: true },
      { id: 'm3', name: '人文历史', type: 'school', is_public: true },
      { id: 'm4', name: '儿童读物', type: 'school', is_public: true },
      { id: 'm5', name: '世界名著', type: 'school', is_public: true },
      { id: 'm6', name: '科普读物', type: 'school', is_public: true },
    ];
    
    modules.forEach(m => {
      db.data.modules.push({
        ...m,
        description: '',
        icon: '',
        owner_id: null,
        created_at: now,
        updated_at: now
      });
    });

    await db.write();
    console.log('默认数据初始化完成');
    console.log('管理员账号: admin@library.com / admin123');
  }
}

await initDefaultData();

// JWT 认证中间件
function auth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: '未登录' });
  }
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'token无效' });
  }
}

// 管理员权限
function adminOnly(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: '需要管理员权限' });
  }
  next();
}

// 工具：从用户对象中剔除密码
function sanitizeUser(user) {
  const { password_hash, ...rest } = user;
  return rest;
}

// ============ 认证相关 ============

// 注册
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name, role } = req.body;
    
    if (!email || !password || !name) {
      return res.status(400).json({ error: '邮箱、密码和姓名不能为空' });
    }

    const existing = db.data.users.find(u => u.email === email);
    if (existing) {
      return res.status(400).json({ error: '该邮箱已被注册' });
    }

    const id = `user-${Date.now()}`;
    const passwordHash = bcrypt.hashSync(password, 10);
    const now = new Date().toISOString();
    
    const newUser = {
      id, email, password_hash: passwordHash, name,
      role: role || 'student',
      approved: false,
      family_id: null,
      created_at: now,
      updated_at: now
    };
    
    db.data.users.push(newUser);
    await db.write();

    res.json({ data: sanitizeUser(newUser), error: null });
  } catch (err) {
    res.status(500).json({ error: '注册失败: ' + err.message });
  }
});

// 登录
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = db.data.users.find(u => u.email === email);
    if (!user) {
      return res.status(400).json({ error: '邮箱或密码错误' });
    }

    if (!bcrypt.compareSync(password, user.password_hash)) {
      return res.status(400).json({ error: '邮箱或密码错误' });
    }

    if (!user.approved) {
      return res.status(400).json({ error: '您的账号尚未被管理员批准' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    
    res.json({ data: { user: sanitizeUser(user), token }, error: null });
  } catch (err) {
    res.status(500).json({ error: '登录失败: ' + err.message });
  }
});

// 获取当前用户
app.get('/api/auth/me', auth, (req, res) => {
  const user = db.data.users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: '用户不存在' });
  res.json({ data: sanitizeUser(user), error: null });
});

// 退出登录
app.post('/api/auth/logout', (req, res) => {
  res.json({ data: { success: true }, error: null });
});

// 修改密码
app.put('/api/auth/change-password', auth, async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = db.data.users.find(u => u.id === req.user.id);
  
  if (!bcrypt.compareSync(oldPassword, user.password_hash)) {
    return res.status(400).json({ error: '旧密码错误' });
  }
  
  user.password_hash = bcrypt.hashSync(newPassword, 10);
  user.updated_at = new Date().toISOString();
  await db.write();
  res.json({ data: { success: true }, error: null });
});

// ============ 用户管理 ============

app.get('/api/users', auth, adminOnly, (req, res) => {
  const users = db.data.users.map(sanitizeUser);
  res.json({ data: users, error: null });
});

app.put('/api/users/:id/approve', auth, adminOnly, async (req, res) => {
  const user = db.data.users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: '用户不存在' });
  user.approved = true;
  user.updated_at = new Date().toISOString();
  await db.write();
  res.json({ data: sanitizeUser(user), error: null });
});

app.put('/api/users/:id/role', auth, adminOnly, async (req, res) => {
  const { role } = req.body;
  const user = db.data.users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: '用户不存在' });
  user.role = role;
  user.updated_at = new Date().toISOString();
  await db.write();
  res.json({ data: sanitizeUser(user), error: null });
});

app.put('/api/users/:id/reset-password', auth, adminOnly, async (req, res) => {
  const { newPassword } = req.body;
  const user = db.data.users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: '用户不存在' });
  user.password_hash = bcrypt.hashSync(newPassword, 10);
  user.updated_at = new Date().toISOString();
  await db.write();
  res.json({ data: { success: true }, error: null });
});

app.delete('/api/users/:id', auth, adminOnly, async (req, res) => {
  if (req.params.id === req.user.id) {
    return res.status(400).json({ error: '不能删除自己' });
  }
  const idx = db.data.users.findIndex(u => u.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: '用户不存在' });
  db.data.users.splice(idx, 1);
  await db.write();
  res.json({ error: null });
});

// ============ 家庭管理 ============

app.get('/api/families', auth, (req, res) => {
  res.json({ data: db.data.families, error: null });
});

app.get('/api/families/:id', auth, (req, res) => {
  const family = db.data.families.find(f => f.id === req.params.id);
  res.json({ data: family || null, error: null });
});

app.post('/api/families', auth, async (req, res) => {
  const { name, description } = req.body;
  const id = `family-${Date.now()}`;
  const now = new Date().toISOString();
  
  const newFamily = {
    id, name,
    head_of_family: req.user.id,
    description: description || '',
    members: [req.user.id],
    created_at: now,
    updated_at: now
  };
  db.data.families.push(newFamily);
  
  const user = db.data.users.find(u => u.id === req.user.id);
  if (user) {
    user.family_id = id;
    user.updated_at = now;
  }
  
  // 创建家庭模块
  db.data.modules.push({
    id: `mod-family-${Date.now()}`,
    name: `${name}藏书`,
    description: '',
    icon: '',
    type: 'family',
    owner_id: id,
    is_public: false,
    created_at: now,
    updated_at: now
  });
  
  await db.write();
  res.json({ data: newFamily, error: null });
});

app.post('/api/families/:id/members', auth, async (req, res) => {
  const { userId } = req.body;
  const family = db.data.families.find(f => f.id === req.params.id);
  if (!family) return res.status(404).json({ error: '家庭不存在' });
  
  if (!family.members.includes(userId)) {
    family.members.push(userId);
  }
  
  const user = db.data.users.find(u => u.id === userId);
  if (user) {
    user.family_id = family.id;
    user.updated_at = new Date().toISOString();
  }
  
  await db.write();
  res.json({ data: { success: true }, error: null });
});

app.get('/api/families/:id/books', auth, (req, res) => {
  const familyModule = db.data.modules.find(m => m.owner_id === req.params.id && m.type === 'family');
  if (!familyModule) return res.json({ data: [], error: null });
  const books = db.data.books.filter(b => b.module_id === familyModule.id);
  res.json({ data: books, error: null });
});

// ============ 模块管理 ============

app.get('/api/modules', (req, res) => {
  res.json({ data: db.data.modules, error: null });
});

// ============ 图书管理 ============

app.get('/api/books', (req, res) => {
  const { keyword, category, module_id } = req.query;
  let result = [...db.data.books];
  
  if (module_id) {
    result = result.filter(b => b.module_id === module_id);
  }
  if (category) {
    result = result.filter(b => b.category === category);
  }
  if (keyword) {
    const kw = String(keyword).toLowerCase();
    result = result.filter(b => 
      b.title.toLowerCase().includes(kw) || b.author.toLowerCase().includes(kw)
    );
  }
  
  result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  res.json({ data: result, error: null });
});

app.get('/api/books/:id', (req, res) => {
  const book = db.data.books.find(b => b.id === req.params.id);
  if (!book) return res.status(404).json({ error: '图书不存在' });
  res.json({ data: book, error: null });
});

app.post('/api/books', auth, async (req, res) => {
  const { title, author, category, isbn, description, cover_url, total_copies, module_id } = req.body;
  const id = `book-${Date.now()}`;
  const now = new Date().toISOString();
  
  const newBook = {
    id, title, author,
    category: category || '',
    isbn: isbn || '',
    description: description || '',
    cover_url: cover_url || '',
    total_copies: total_copies || 1,
    available_copies: total_copies || 1,
    module_id: module_id || '',
    created_at: now,
    updated_at: now
  };
  
  db.data.books.push(newBook);
  await db.write();
  res.json({ data: newBook, error: null });
});

app.put('/api/books/:id', auth, async (req, res) => {
  const book = db.data.books.find(b => b.id === req.params.id);
  if (!book) return res.status(404).json({ error: '图书不存在' });
  
  const { title, author, category, isbn, description, cover_url, total_copies, module_id } = req.body;
  const now = new Date().toISOString();
  
  if (total_copies !== undefined) {
    const diff = total_copies - book.total_copies;
    book.available_copies = Math.max(0, book.available_copies + diff);
    book.total_copies = total_copies;
  }
  
  Object.assign(book, {
    title: title ?? book.title,
    author: author ?? book.author,
    category: category ?? book.category,
    isbn: isbn ?? book.isbn,
    description: description ?? book.description,
    cover_url: cover_url ?? book.cover_url,
    module_id: module_id ?? book.module_id,
    updated_at: now
  });
  
  await db.write();
  res.json({ data: book, error: null });
});

app.delete('/api/books/:id', auth, async (req, res) => {
  const idx = db.data.books.findIndex(b => b.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: '图书不存在' });
  db.data.books.splice(idx, 1);
  await db.write();
  res.json({ error: null });
});

// ============ 借阅记录 ============

app.get('/api/borrow-records', auth, (req, res) => {
  const { user_id } = req.query;
  let records = [...db.data.borrowRecords];
  
  // 非管理员只能看自己的记录
  if (req.user.role !== 'admin') {
    records = records.filter(r => r.user_id === req.user.id);
  } else if (user_id) {
    records = records.filter(r => r.user_id === user_id);
  }
  
  const result = records.map(r => ({
    ...r,
    books: db.data.books.find(b => b.id === r.book_id) || {},
    users: db.data.users.find(u => u.id === r.user_id) 
      ? sanitizeUser(db.data.users.find(u => u.id === r.user_id)) 
      : undefined
  })).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  
  res.json({ data: result, error: null });
});

app.post('/api/borrow-records', auth, async (req, res) => {
  const { book_id, due_date } = req.body;
  const now = new Date().toISOString();
  
  const book = db.data.books.find(b => b.id === book_id);
  if (!book) return res.status(404).json({ error: '图书不存在' });
  if (book.available_copies <= 0) return res.status(400).json({ error: '该图书暂时不可借' });
  
  const id = `borrow-${Date.now()}`;
  const newRecord = {
    id, book_id, user_id: req.user.id,
    borrow_date: now.split('T')[0],
    due_date,
    return_date: null,
    status: 'borrowed',
    created_at: now,
    updated_at: now
  };
  
  db.data.borrowRecords.push(newRecord);
  book.available_copies--;
  book.updated_at = now;
  
  await db.write();
  res.json({ data: newRecord, error: null });
});

app.put('/api/borrow-records/:id/return', auth, async (req, res) => {
  const record = db.data.borrowRecords.find(r => r.id === req.params.id);
  if (!record) return res.status(404).json({ error: '借阅记录不存在' });
  
  // 非管理员只能归还自己借的书
  if (req.user.role !== 'admin' && record.user_id !== req.user.id) {
    return res.status(403).json({ error: '无权操作' });
  }
  
  const now = new Date().toISOString();
  record.status = 'returned';
  record.return_date = now.split('T')[0];
  record.updated_at = now;
  
  const book = db.data.books.find(b => b.id === record.book_id);
  if (book) {
    book.available_copies++;
    book.updated_at = now;
  }
  
  await db.write();
  res.json({ data: record, error: null });
});

// ============ 统计 ============

app.get('/api/stats', auth, (req, res) => {
  const total_books = db.data.books.reduce((sum, b) => sum + b.total_copies, 0);
  const total_borrowed = db.data.borrowRecords.filter(r => r.status === 'borrowed').length;
  const total_users = db.data.users.length;
  const available_books = db.data.books.reduce((sum, b) => sum + b.available_copies, 0);
  
  res.json({
    data: { total_books, total_borrowed, total_users, available_books },
    error: null
  });
});

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`图书馆后端服务运行在端口 ${PORT}`);
});
