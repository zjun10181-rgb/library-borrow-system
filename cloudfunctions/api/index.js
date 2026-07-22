const cloud = require('wx-server-sdk');

cloud.init({
  env: process.env.TCB_ENV || 'seven-website-8gwpkoon2ce77ee5'
});

const db = cloud.database();

// 生成 JWT token
function generateToken(userId) {
  const jwt = require('jsonwebtoken');
  const secret = process.env.JWT_SECRET || 'library_secret_key';
  return jwt.sign({ userId }, secret, { expiresIn: '7d' });
}

// 验证 JWT token
function verifyToken(token) {
  try {
    const jwt = require('jsonwebtoken');
    const secret = process.env.JWT_SECRET || 'library_secret_key';
    return jwt.verify(token, secret);
  } catch {
    return null;
  }
}

// 密码加密
function hashPassword(password) {
  const bcrypt = require('bcryptjs');
  return bcrypt.hashSync(password, 10);
}

// 密码验证
function comparePassword(password, hash) {
  const bcrypt = require('bcryptjs');
  return bcrypt.compareSync(password, hash);
}

// 错误响应
function error(message) {
  return { success: false, error: message };
}

// 成功响应
function success(data) {
  return { success: true, data };
}

// 获取当前用户
async function getCurrentUser(token) {
  const decoded = verifyToken(token);
  if (!decoded) return null;
  
  const result = await db.collection('users').where({ id: decoded.userId }).get();
  return result.data[0] || null;
}

// ============ 认证相关 ============

async function handleAuth(event) {
  const { action } = event.queryString || {};
  
  if (action === 'login') {
    const { email, password } = event.body;
    
    const result = await db.collection('users').where({ email }).get();
    if (result.data.length === 0) {
      return error('邮箱或密码错误');
    }
    
    const user = result.data[0];
    
    if (!comparePassword(password, user.password)) {
      return error('邮箱或密码错误');
    }
    
    if (!user.approved) {
      return error('您的账号尚未被管理员批准');
    }
    
    const token = generateToken(user.id);
    return success({ user, token });
  }
  
  if (action === 'register') {
    const { email, password, name, role } = event.body;
    
    const exists = await db.collection('users').where({ email }).get();
    if (exists.data.length > 0) {
      return error('该邮箱已被注册');
    }
    
    const user = {
      id: Date.now().toString(),
      email,
      password: hashPassword(password),
      name,
      role: role || 'student',
      approved: false,
      avatar: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    await db.collection('users').add({ data: user });
    delete user.password;
    return success(user);
  }
  
  if (action === 'me') {
    const token = event.headers?.authorization?.replace('Bearer ', '');
    const user = await getCurrentUser(token);
    if (!user) return error('未登录');
    delete user.password;
    return success(user);
  }
  
  if (action === 'change-password') {
    const token = event.headers?.authorization?.replace('Bearer ', '');
    const user = await getCurrentUser(token);
    if (!user) return error('未登录');
    
    const { oldPassword, newPassword } = event.body;
    
    if (!comparePassword(oldPassword, user.password)) {
      return error('旧密码错误');
    }
    
    await db.collection('users').doc(user._id).update({
      data: {
        password: hashPassword(newPassword),
        updated_at: new Date().toISOString()
      }
    });
    
    return success({ success: true });
  }
  
  return error('无效的操作');
}

// ============ 用户管理 ============

async function handleUsers(event) {
  const token = event.headers?.authorization?.replace('Bearer ', '');
  const user = await getCurrentUser(token);
  
  if (!user || user.role !== 'admin') {
    return error('权限不足');
  }
  
  const { action } = event.queryString || {};
  
  if (!action) {
    const result = await db.collection('users').get();
    const users = result.data.map(u => { delete u.password; return u; });
    return success(users);
  }
  
  if (action === 'approve') {
    const { id } = event.queryString;
    await db.collection('users').where({ id }).update({
      data: { approved: true, updated_at: new Date().toISOString() }
    });
    return success({ success: true });
  }
  
  if (action === 'role') {
    const { id } = event.queryString;
    const { role } = event.body;
    await db.collection('users').where({ id }).update({
      data: { role, updated_at: new Date().toISOString() }
    });
    return success({ success: true });
  }
  
  if (action === 'delete') {
    const { id } = event.queryString;
    await db.collection('users').where({ id }).remove();
    return success({ success: true });
  }
  
  if (action === 'reset-password') {
    const { id } = event.queryString;
    const { newPassword } = event.body;
    await db.collection('users').where({ id }).update({
      data: { password: hashPassword(newPassword), updated_at: new Date().toISOString() }
    });
    return success({ success: true });
  }
  
  return error('无效的操作');
}

// ============ 图书管理 ============

async function handleBooks(event) {
  const token = event.headers?.authorization?.replace('Bearer ', '');
  const user = await getCurrentUser(token);
  
  if (!user) return error('未登录');
  
  const { action, keyword, category, module_id } = event.queryString || {};
  
  if (!action) {
    let query = db.collection('books');
    
    if (keyword) {
      query = query.where(db.command.or([
        { title: db.RegExp({ regexp: keyword, options: 'i' }) },
        { author: db.RegExp({ regexp: keyword, options: 'i' }) },
        { isbn: db.RegExp({ regexp: keyword, options: 'i' }) }
      ]));
    }
    
    if (category) {
      query = query.where({ category });
    }
    
    if (module_id) {
      query = query.where({ module_id });
    }
    
    const result = await query.get();
    return success(result.data);
  }
  
  if (action === 'get') {
    const { id } = event.queryString;
    const result = await db.collection('books').where({ id }).get();
    return success(result.data[0] || null);
  }
  
  if (action === 'create') {
    if (user.role !== 'admin') return error('权限不足');
    
    const book = {
      ...event.body,
      id: Date.now().toString(),
      available_count: event.body.total_count || 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    await db.collection('books').add({ data: book });
    return success(book);
  }
  
  if (action === 'update') {
    if (user.role !== 'admin') return error('权限不足');
    
    const { id } = event.queryString;
    const updates = { ...event.body, updated_at: new Date().toISOString() };
    
    const result = await db.collection('books').where({ id }).update({ data: updates });
    return success({ success: result.stats.updated > 0 });
  }
  
  if (action === 'delete') {
    if (user.role !== 'admin') return error('权限不足');
    
    const { id } = event.queryString;
    await db.collection('books').where({ id }).remove();
    return success({ success: true });
  }
  
  return error('无效的操作');
}

// ============ 借阅记录 ============

async function handleBorrowRecords(event) {
  const token = event.headers?.authorization?.replace('Bearer ', '');
  const user = await getCurrentUser(token);
  
  if (!user) return error('未登录');
  
  const { action, user_id } = event.queryString || {};
  
  if (!action) {
    let query = db.collection('borrow_records');
    
    if (user_id) {
      query = query.where({ user_id });
    } else if (user.role !== 'admin') {
      query = query.where({ user_id: user.id });
    }
    
    const result = await query.orderBy('created_at', 'desc').get();
    
    const records = await Promise.all(result.data.map(async record => {
      const bookResult = await db.collection('books').where({ id: record.book_id }).get();
      return { ...record, book: bookResult.data[0] || null };
    }));
    
    return success(records);
  }
  
  if (action === 'create') {
    const { book_id, due_date } = event.body;
    
    const bookResult = await db.collection('books').where({ id: book_id }).get();
    if (bookResult.data.length === 0) {
      return error('图书不存在');
    }
    
    const book = bookResult.data[0];
    if (book.available_count <= 0) {
      return error('该图书已无库存');
    }
    
    const record = {
      id: Date.now().toString(),
      book_id,
      user_id: user.id,
      due_date,
      returned: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    await db.collection('borrow_records').add({ data: record });
    await db.collection('books').where({ id: book_id }).update({
      data: { available_count: book.available_count - 1, updated_at: new Date().toISOString() }
    });
    
    return success(record);
  }
  
  if (action === 'return') {
    if (user.role !== 'admin') return error('权限不足');
    
    const { id } = event.queryString;
    
    const result = await db.collection('borrow_records').where({ id }).get();
    if (result.data.length === 0) {
      return error('记录不存在');
    }
    
    const record = result.data[0];
    if (record.returned) {
      return error('该图书已归还');
    }
    
    await db.collection('borrow_records').where({ id }).update({
      data: { returned: true, updated_at: new Date().toISOString() }
    });
    
    const bookResult = await db.collection('books').where({ id: record.book_id }).get();
    if (bookResult.data.length > 0) {
      await db.collection('books').where({ id: record.book_id }).update({
        data: { available_count: bookResult.data[0].available_count + 1, updated_at: new Date().toISOString() }
      });
    }
    
    return success({ success: true });
  }
  
  return error('无效的操作');
}

// ============ 家庭管理 ============

async function handleFamilies(event) {
  const token = event.headers?.authorization?.replace('Bearer ', '');
  const user = await getCurrentUser(token);
  
  if (!user) return error('未登录');
  
  const { action, id } = event.queryString || {};
  
  if (!action) {
    const result = await db.collection('families').get();
    return success(result.data);
  }
  
  if (action === 'get') {
    const result = await db.collection('families').where({ id }).get();
    return success(result.data[0] || null);
  }
  
  if (action === 'create') {
    if (user.role !== 'admin') return error('权限不足');
    
    const family = {
      ...event.body,
      id: Date.now().toString(),
      members: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    await db.collection('families').add({ data: family });
    return success(family);
  }
  
  if (action === 'add-member') {
    if (user.role !== 'admin') return error('权限不足');
    
    const { userId } = event.body;
    
    const result = await db.collection('families').where({ id }).get();
    if (result.data.length === 0) return error('家庭不存在');
    
    const family = result.data[0];
    if (!family.members.includes(userId)) {
      family.members.push(userId);
      await db.collection('families').where({ id }).update({
        data: { members: family.members, updated_at: new Date().toISOString() }
      });
    }
    
    return success({ success: true });
  }
  
  if (action === 'books') {
    const result = await db.collection('books').where({ module_id: 'family' }).get();
    return success(result.data);
  }
  
  return error('无效的操作');
}

// ============ 通用接口 ============

async function handleCommon(event) {
  const { action } = event.queryString || {};
  
  if (action === 'modules') {
    const result = await db.collection('modules').get();
    return success(result.data);
  }
  
  if (action === 'stats') {
    const booksResult = await db.collection('books').get();
    const recordsResult = await db.collection('borrow_records').get();
    const usersResult = await db.collection('users').get();
    
    const availableBooks = booksResult.data.reduce((sum, book) => sum + (book.available_count || 0), 0);
    const borrowedRecords = recordsResult.data.filter(r => !r.returned);
    
    return success({
      total_books: booksResult.data.length,
      available_books: availableBooks,
      total_borrowed: borrowedRecords.length,
      total_users: usersResult.data.length
    });
  }
  
  if (action === 'init') {
    const usersResult = await db.collection('users').get();
    if (usersResult.data.length > 0) {
      return error('数据库已初始化');
    }
    
    const admin = {
      id: 'admin',
      email: 'admin@library.com',
      password: hashPassword('admin123'),
      name: '管理员',
      role: 'admin',
      approved: true,
      avatar: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    await db.collection('users').add({ data: admin });
    
    const modules = [
      { id: 'library', name: '图书借阅', icon: 'BookOpen' },
      { id: 'family', name: '家庭图书', icon: 'Home' },
      { id: 'admin', name: '系统管理', icon: 'Settings' }
    ];
    
    for (const m of modules) {
      await db.collection('modules').add({ data: m });
    }
    
    return success({ success: true, message: '数据库初始化完成' });
  }
  
  return error('无效的操作');
}

// 主入口
exports.main = async (event, context) => {
  const { path } = event;
  
  if (path === '/api/auth') {
    return handleAuth(event);
  }
  
  if (path === '/api/users') {
    return handleUsers(event);
  }
  
  if (path === '/api/books') {
    return handleBooks(event);
  }
  
  if (path === '/api/borrow-records') {
    return handleBorrowRecords(event);
  }
  
  if (path === '/api/families') {
    return handleFamilies(event);
  }
  
  if (path === '/api/common') {
    return handleCommon(event);
  }
  
  return error('接口不存在');
};
