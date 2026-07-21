import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pkg from 'pg';
const { Pool } = pkg;

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'library-secret-key-change-in-production';
const DATABASE_URL = process.env.DATABASE_URL;

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: DATABASE_URL?.includes('neon.tech') || DATABASE_URL?.includes('render.com')
    ? { rejectUnauthorized: false }
    : false,
});

app.use(cors({
  origin: ['https://library-borrow-system.netlify.app', 'http://localhost:5173', 'http://localhost:4173'],
  credentials: true
}));
app.use(express.json());

async function initDB() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'student',
        approved BOOLEAN NOT NULL DEFAULT false,
        family_id TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS families (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        head_of_family TEXT NOT NULL,
        description TEXT DEFAULT '',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS family_members (
        family_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        PRIMARY KEY (family_id, user_id)
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS modules (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT DEFAULT '',
        icon TEXT DEFAULT '',
        type TEXT NOT NULL DEFAULT 'school',
        owner_id TEXT,
        is_public BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS books (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        author TEXT NOT NULL,
        category TEXT DEFAULT '',
        isbn TEXT DEFAULT '',
        description TEXT DEFAULT '',
        cover_url TEXT DEFAULT '',
        total_copies INTEGER NOT NULL DEFAULT 1,
        available_copies INTEGER NOT NULL DEFAULT 1,
        module_id TEXT DEFAULT '',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS borrow_records (
        id TEXT PRIMARY KEY,
        book_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        borrow_date DATE NOT NULL,
        due_date DATE,
        return_date DATE,
        status TEXT NOT NULL DEFAULT 'borrowed',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    const userCount = await client.query('SELECT COUNT(*) FROM users');
    if (parseInt(userCount.rows[0].count) === 0) {
      console.log('初始化默认数据...');
      
      const adminHash = bcrypt.hashSync('admin123', 10);
      await client.query(
        'INSERT INTO users (id, email, password_hash, name, role, approved) VALUES ($1, $2, $3, $4, $5, $6)',
        ['admin-001', 'admin@library.com', adminHash, '管理员', 'admin', true]
      );

      const modules = [
        ['m1', '文学经典', 'school', true],
        ['m2', '科技科普', 'school', true],
        ['m3', '人文历史', 'school', true],
        ['m4', '儿童读物', 'school', true],
        ['m5', '世界名著', 'school', true],
        ['m6', '科普读物', 'school', true],
      ];
      
      for (const [id, name, type, isPublic] of modules) {
        await client.query(
          'INSERT INTO modules (id, name, type, is_public) VALUES ($1, $2, $3, $4)',
          [id, name, type, isPublic]
        );
      }

      console.log('默认数据初始化完成');
      console.log('管理员账号: admin@library.com / admin123');
    }

    await client.query('COMMIT');
    console.log('数据库初始化完成');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('数据库初始化失败:', err.message);
  } finally {
    client.release();
  }
}

await initDB();

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

function adminOnly(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: '需要管理员权限' });
  }
  next();
}

function sanitizeUser(user) {
  if (!user) return null;
  const { password_hash, ...rest } = user;
  return rest;
}

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name, role } = req.body;
    
    if (!email || !password || !name) {
      return res.status(400).json({ error: '邮箱、密码和姓名不能为空' });
    }

    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: '该邮箱已被注册' });
    }

    const id = `user-${Date.now()}`;
    const passwordHash = bcrypt.hashSync(password, 10);
    
    const result = await pool.query(
      `INSERT INTO users (id, email, password_hash, name, role, approved) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [id, email, passwordHash, name, role || 'student', false]
    );

    res.json({ data: sanitizeUser(result.rows[0]), error: null });
  } catch (err) {
    res.status(500).json({ error: '注册失败: ' + err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
    
    if (!user) {
      return res.status(400).json({ error: '邮箱或密码错误' });
    }

    if (!bcrypt.compareSync(password, user.password_hash)) {
      return res.status(400).json({ error: '邮箱或密码错误' });
    }

    if (!user.approved) {
      return res.status(400).json({ error: '您的账号尚未被管理员批准' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({ data: { user: sanitizeUser(user), token }, error: null });
  } catch (err) {
    res.status(500).json({ error: '登录失败: ' + err.message });
  }
});

app.get('/api/auth/me', auth, async (req, res) => {
  const result = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
  if (result.rows.length === 0) return res.status(404).json({ error: '用户不存在' });
  res.json({ data: sanitizeUser(result.rows[0]), error: null });
});

app.post('/api/auth/logout', (req, res) => {
  res.json({ data: { success: true }, error: null });
});

app.put('/api/auth/change-password', auth, async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  
  const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
  const user = userResult.rows[0];
  
  if (!user || !bcrypt.compareSync(oldPassword, user.password_hash)) {
    return res.status(400).json({ error: '旧密码错误' });
  }
  
  const newHash = bcrypt.hashSync(newPassword, 10);
  await pool.query(
    'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
    [newHash, req.user.id]
  );
  
  res.json({ data: { success: true }, error: null });
});

app.get('/api/users', auth, adminOnly, async (req, res) => {
  const result = await pool.query('SELECT * FROM users ORDER BY created_at DESC');
  const users = result.rows.map(sanitizeUser);
  res.json({ data: users, error: null });
});

app.put('/api/users/:id/approve', auth, adminOnly, async (req, res) => {
  const result = await pool.query(
    'UPDATE users SET approved = true, updated_at = NOW() WHERE id = $1 RETURNING *',
    [req.params.id]
  );
  if (result.rows.length === 0) return res.status(404).json({ error: '用户不存在' });
  res.json({ data: sanitizeUser(result.rows[0]), error: null });
});

app.put('/api/users/:id/role', auth, adminOnly, async (req, res) => {
  const { role } = req.body;
  const result = await pool.query(
    'UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
    [role, req.params.id]
  );
  if (result.rows.length === 0) return res.status(404).json({ error: '用户不存在' });
  res.json({ data: sanitizeUser(result.rows[0]), error: null });
});

app.put('/api/users/:id/reset-password', auth, adminOnly, async (req, res) => {
  const { newPassword } = req.body;
  const newHash = bcrypt.hashSync(newPassword, 10);
  const result = await pool.query(
    'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
    [newHash, req.params.id]
  );
  if (result.rowCount === 0) return res.status(404).json({ error: '用户不存在' });
  res.json({ data: { success: true }, error: null });
});

app.delete('/api/users/:id', auth, adminOnly, async (req, res) => {
  if (req.params.id === req.user.id) {
    return res.status(400).json({ error: '不能删除自己' });
  }
  const result = await pool.query('DELETE FROM users WHERE id = $1', [req.params.id]);
  if (result.rowCount === 0) return res.status(404).json({ error: '用户不存在' });
  res.json({ error: null });
});

app.get('/api/families', auth, async (req, res) => {
  const result = await pool.query('SELECT * FROM families ORDER BY created_at DESC');
  res.json({ data: result.rows, error: null });
});

app.get('/api/families/:id', auth, async (req, res) => {
  const result = await pool.query('SELECT * FROM families WHERE id = $1', [req.params.id]);
  const family = result.rows[0];
  
  if (family) {
    const membersResult = await pool.query(
      'SELECT u.id, u.name, u.email FROM family_members fm JOIN users u ON fm.user_id = u.id WHERE fm.family_id = $1',
      [req.params.id]
    );
    family.members = membersResult.rows.map(m => m.id);
    family.memberDetails = membersResult.rows;
  }
  
  res.json({ data: family || null, error: null });
});

app.post('/api/families', auth, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { name, description } = req.body;
    const id = `family-${Date.now()}`;
    
    const familyResult = await client.query(
      `INSERT INTO families (id, name, head_of_family, description) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [id, name, req.user.id, description || '']
    );
    
    await client.query(
      'INSERT INTO family_members (family_id, user_id) VALUES ($1, $2)',
      [id, req.user.id]
    );
    
    await client.query(
      'UPDATE users SET family_id = $1, updated_at = NOW() WHERE id = $2',
      [id, req.user.id]
    );
    
    const modId = `mod-family-${Date.now()}`;
    await client.query(
      `INSERT INTO modules (id, name, type, owner_id, is_public) 
       VALUES ($1, $2, $3, $4, $5)`,
      [modId, `${name}藏书`, 'family', id, false]
    );
    
    await client.query('COMMIT');
    
    const newFamily = familyResult.rows[0];
    newFamily.members = [req.user.id];
    
    res.json({ data: newFamily, error: null });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: '创建家庭失败: ' + err.message });
  } finally {
    client.release();
  }
});

app.post('/api/families/:id/members', auth, async (req, res) => {
  const { userId } = req.body;
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const familyResult = await client.query('SELECT * FROM families WHERE id = $1', [req.params.id]);
    if (familyResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: '家庭不存在' });
    }
    
    await client.query(
      'INSERT INTO family_members (family_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [req.params.id, userId]
    );
    
    await client.query(
      'UPDATE users SET family_id = $1, updated_at = NOW() WHERE id = $2',
      [req.params.id, userId]
    );
    
    await client.query('COMMIT');
    res.json({ data: { success: true }, error: null });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: '添加成员失败: ' + err.message });
  } finally {
    client.release();
  }
});

app.get('/api/families/:id/books', auth, async (req, res) => {
  const modResult = await pool.query(
    "SELECT id FROM modules WHERE owner_id = $1 AND type = 'family'",
    [req.params.id]
  );
  
  if (modResult.rows.length === 0) {
    return res.json({ data: [], error: null });
  }
  
  const booksResult = await pool.query(
    'SELECT * FROM books WHERE module_id = $1 ORDER BY created_at DESC',
    [modResult.rows[0].id]
  );
  
  res.json({ data: booksResult.rows, error: null });
});

app.get('/api/modules', async (req, res) => {
  const result = await pool.query('SELECT * FROM modules ORDER BY created_at ASC');
  res.json({ data: result.rows, error: null });
});

app.get('/api/books', async (req, res) => {
  const { keyword, category, module_id } = req.query;
  let query = 'SELECT * FROM books WHERE 1=1';
  const params = [];
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
});

app.get('/api/books/:id', async (req, res) => {
  const result = await pool.query('SELECT * FROM books WHERE id = $1', [req.params.id]);
  if (result.rows.length === 0) return res.status(404).json({ error: '图书不存在' });
  res.json({ data: result.rows[0], error: null });
});

app.post('/api/books', auth, async (req, res) => {
  const { title, author, category, isbn, description, cover_url, total_copies, module_id } = req.body;
  const id = `book-${Date.now()}`;
  const copies = total_copies || 1;
  
  const result = await pool.query(
    `INSERT INTO books (id, title, author, category, isbn, description, cover_url, total_copies, available_copies, module_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
    [id, title, author, category || '', isbn || '', description || '', cover_url || '', copies, copies, module_id || '']
  );
  
  res.json({ data: result.rows[0], error: null });
});

app.put('/api/books/:id', auth, async (req, res) => {
  const { title, author, category, isbn, description, cover_url, total_copies, module_id } = req.body;
  
  const current = await pool.query('SELECT * FROM books WHERE id = $1', [req.params.id]);
  if (current.rows.length === 0) return res.status(404).json({ error: '图书不存在' });
  
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
    [title, author, category, isbn, description, cover_url, total_copies, available, module_id, req.params.id]
  );
  
  res.json({ data: result.rows[0], error: null });
});

app.delete('/api/books/:id', auth, async (req, res) => {
  const result = await pool.query('DELETE FROM books WHERE id = $1', [req.params.id]);
  if (result.rowCount === 0) return res.status(404).json({ error: '图书不存在' });
  res.json({ error: null });
});

app.get('/api/borrow-records', auth, async (req, res) => {
  const { user_id } = req.query;
  let query = `
    SELECT br.*, 
           b.title as book_title, b.author as book_author, b.cover_url as book_cover,
           u.name as user_name, u.email as user_email
    FROM borrow_records br
    LEFT JOIN books b ON br.book_id = b.id
    LEFT JOIN users u ON br.user_id = u.id
    WHERE 1=1
  `;
  const params = [];
  let paramIndex = 1;
  
  if (req.user.role !== 'admin') {
    params.push(req.user.id);
    query += ` AND br.user_id = $${paramIndex++}`;
  } else if (user_id) {
    params.push(user_id);
    query += ` AND br.user_id = $${paramIndex++}`;
  }
  
  query += ' ORDER BY br.created_at DESC';
  
  const result = await pool.query(query, params);
  
  const records = result.rows.map(r => ({
    id: r.id,
    book_id: r.book_id,
    user_id: r.user_id,
    borrow_date: r.borrow_date,
    due_date: r.due_date,
    return_date: r.return_date,
    status: r.status,
    created_at: r.created_at,
    updated_at: r.updated_at,
    books: {
      id: r.book_id,
      title: r.book_title,
      author: r.book_author,
      cover_url: r.book_cover
    },
    users: {
      id: r.user_id,
      name: r.user_name,
      email: r.user_email
    }
  }));
  
  res.json({ data: records, error: null });
});

app.post('/api/borrow-records', auth, async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { book_id, due_date } = req.body;
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    const bookResult = await client.query('SELECT * FROM books WHERE id = $1 FOR UPDATE', [book_id]);
    if (bookResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: '图书不存在' });
    }
    
    const book = bookResult.rows[0];
    if (book.available_copies <= 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: '该图书暂时不可借' });
    }
    
    const id = `borrow-${Date.now()}`;
    const result = await client.query(
      `INSERT INTO borrow_records (id, book_id, user_id, borrow_date, due_date, status)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [id, book_id, req.user.id, today, due_date || null, 'borrowed']
    );
    
    await client.query(
      'UPDATE books SET available_copies = available_copies - 1, updated_at = NOW() WHERE id = $1',
      [book_id]
    );
    
    await client.query('COMMIT');
    res.json({ data: result.rows[0], error: null });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: '借书失败: ' + err.message });
  } finally {
    client.release();
  }
});

app.put('/api/borrow-records/:id/return', auth, async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const recordResult = await client.query('SELECT * FROM borrow_records WHERE id = $1', [req.params.id]);
    if (recordResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: '借阅记录不存在' });
    }
    
    const record = recordResult.rows[0];
    
    if (req.user.role !== 'admin' && record.user_id !== req.user.id) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: '无权操作' });
    }
    
    const today = new Date().toISOString().split('T')[0];
    
    const updateResult = await client.query(
      `UPDATE borrow_records SET status = 'returned', return_date = $1, updated_at = NOW()
       WHERE id = $2 RETURNING *`,
      [today, req.params.id]
    );
    
    await client.query(
      'UPDATE books SET available_copies = available_copies + 1, updated_at = NOW() WHERE id = $1',
      [record.book_id]
    );
    
    await client.query('COMMIT');
    res.json({ data: updateResult.rows[0], error: null });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: '还书失败: ' + err.message });
  } finally {
    client.release();
  }
});

app.get('/api/stats', auth, async (req, res) => {
  const [booksResult, borrowedResult, usersResult] = await Promise.all([
    pool.query('SELECT COALESCE(SUM(total_copies), 0) as total, COALESCE(SUM(available_copies), 0) as available FROM books'),
    pool.query("SELECT COUNT(*) as count FROM borrow_records WHERE status = 'borrowed'"),
    pool.query('SELECT COUNT(*) as count FROM users'),
  ]);
  
  res.json({
    data: {
      total_books: parseInt(booksResult.rows[0].total),
      available_books: parseInt(booksResult.rows[0].available),
      total_borrowed: parseInt(borrowedResult.rows[0].count),
      total_users: parseInt(usersResult.rows[0].count),
    },
    error: null
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`图书馆后端服务运行在端口 ${PORT}`);
});
