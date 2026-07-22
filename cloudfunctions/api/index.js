'use strict';

const cloudbase = require('@cloudbase/node-sdk');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'library-secret-key-change-in-production';

let db = null;

function initDB() {
  if (db) return db;
  
  try {
    const app = cloudbase.init({
      env: process.env.TCB_ENV,
    });
    db = app.database();
    return db;
  } catch (e) {
    console.error('CloudBase init error:', e);
    throw e;
  }
}

function generateId(prefix = '') {
  return `${prefix}${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
}

function createResponse(data = null, error = null) {
  return {
    data,
    error: error ? (error.message || error) : null,
  };
}

function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch {
    return null;
  }
}

async function getUserFromToken(token) {
  const decoded = verifyToken(token);
  if (!decoded) return null;
  
  const db = initDB();
  const res = await db.collection('users').where({ email: decoded.email }).get();
  return res.data[0] || null;
}

async function handleAuth(event) {
  const { action, email, password, name, role, oldPassword, newPassword } = event.queryString || event.body || {};
  const db = initDB();
  
  switch (action) {
    case 'login': {
      const res = await db.collection('users').where({ email }).get();
      const user = res.data[0];
      
      if (!user) {
        return createResponse(null, '邮箱或密码错误');
      }
      
      if (!bcrypt.compareSync(password, user.password_hash)) {
        return createResponse(null, '邮箱或密码错误');
      }
      
      if (!user.approved) {
        return createResponse(null, '您的账号尚未被管理员批准');
      }
      
      const token = jwt.sign({ email: user.email }, JWT_SECRET, { expiresIn: '7d' });
      const { password_hash, ...safeUser } = user;
      
      return createResponse({ user: safeUser, token });
    }
    
    case 'register': {
      if (!email || !password || !name) {
        return createResponse(null, '邮箱、密码和姓名不能为空');
      }
      
      const existing = await db.collection('users').where({ email }).get();
      if (existing.data.length > 0) {
        return createResponse(null, '该邮箱已被注册');
      }
      
      const password_hash = bcrypt.hashSync(password, 10);
      const newUser = {
        _id: generateId('user_'),
        email,
        password_hash,
        name,
        role: role || 'student',
        approved: false,
        created_at: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString().split('T')[0],
      };
      
      await db.collection('users').add(newUser);
      const { password_hash: _, ...safeUser } = newUser;
      
      return createResponse(safeUser);
    }
    
    case 'me': {
      const token = event.headers?.Authorization?.replace('Bearer ', '');
      const user = await getUserFromToken(token);
      
      if (!user) {
        return createResponse(null, '未登录');
      }
      
      const { password_hash, ...safeUser } = user;
      return createResponse(safeUser);
    }
    
    case 'change-password': {
      const token = event.headers?.Authorization?.replace('Bearer ', '');
      const user = await getUserFromToken(token);
      
      if (!user) {
        return createResponse(null, '未登录');
      }
      
      if (!bcrypt.compareSync(oldPassword, user.password_hash)) {
        return createResponse(null, '旧密码错误');
      }
      
      const newHash = bcrypt.hashSync(newPassword, 10);
      await db.collection('users').doc(user._id).update({
        password_hash: newHash,
        updated_at: new Date().toISOString().split('T')[0],
      });
      
      return createResponse({ success: true });
    }
    
    default:
      return createResponse(null, '未知操作');
  }
}

async function handleUsers(event) {
  const { action, id, role, newPassword } = event.queryString || event.body || {};
  const db = initDB();
  
  switch (action) {
    case 'list': {
      const res = await db.collection('users').get();
      const users = res.data.map(u => {
        const { password_hash, ...safe } = u;
        return safe;
      });
      return createResponse(users);
    }
    
    case 'approve': {
      await db.collection('users').doc(id).update({
        approved: true,
        updated_at: new Date().toISOString().split('T')[0],
      });
      
      const res = await db.collection('users').doc(id).get();
      const { password_hash, ...safe } = res.data;
      return createResponse(safe);
    }
    
    case 'role': {
      await db.collection('users').doc(id).update({
        role,
        updated_at: new Date().toISOString().split('T')[0],
      });
      
      const res = await db.collection('users').doc(id).get();
      const { password_hash, ...safe } = res.data;
      return createResponse(safe);
    }
    
    case 'reset-password': {
      const res = await db.collection('users').where({ email: id }).get();
      const user = res.data[0];
      
      if (!user) {
        return createResponse(null, '用户不存在');
      }
      
      const newHash = bcrypt.hashSync(newPassword, 10);
      await db.collection('users').doc(user._id).update({
        password_hash: newHash,
        updated_at: new Date().toISOString().split('T')[0],
      });
      
      return createResponse({ success: true });
    }
    
    case 'delete': {
      await db.collection('users').doc(id).remove();
      return createResponse(null);
    }
    
    default: {
      const res = await db.collection('users').get();
      const users = res.data.map(u => {
        const { password_hash, ...safe } = u;
        return safe;
      });
      return createResponse(users);
    }
  }
}

async function handleBooks(event) {
  const { action, id, keyword, category, module_id } = event.queryString || {};
  const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body || {};
  const db = initDB();
  
  switch (action) {
    case 'get': {
      const res = await db.collection('books').doc(id).get();
      return createResponse(res.data);
    }
    
    case 'create': {
      const newBook = {
        _id: generateId('book_'),
        ...body,
        available_copies: body.total_copies || 1,
        created_at: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString().split('T')[0],
      };
      
      await db.collection('books').add(newBook);
      return createResponse(newBook);
    }
    
    case 'update': {
      const bookRes = await db.collection('books').doc(id).get();
      const book = bookRes.data;
      
      if (!book) {
        return createResponse(null, '图书不存在');
      }
      
      if (body.total_copies !== undefined) {
        const diff = body.total_copies - book.total_copies;
        body.available_copies = Math.max(0, (book.available_copies || 0) + diff);
      }
      
      body.updated_at = new Date().toISOString().split('T')[0];
      await db.collection('books').doc(id).update(body);
      
      const updatedRes = await db.collection('books').doc(id).get();
      return createResponse(updatedRes.data);
    }
    
    case 'delete': {
      await db.collection('books').doc(id).remove();
      return createResponse(null);
    }
    
    default: {
      let query = db.collection('books');
      
      if (module_id) {
        query = query.where({ module_id });
      }
      if (category) {
        query = query.where({ category });
      }
      if (keyword) {
        query = query.where(db.command.or([
          { title: db.RegExp({ regexp: keyword, options: 'i' }) },
          { author: db.RegExp({ regexp: keyword, options: 'i' }) },
        ]));
      }
      
      const res = await query.get();
      return createResponse(res.data);
    }
  }
}

async function handleBorrowRecords(event) {
  const { action, id, user_id } = event.queryString || {};
  const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body || {};
  const db = initDB();
  
  switch (action) {
    case 'get': {
      const res = await db.collection('borrow_records').doc(id).get();
      return createResponse(res.data);
    }
    
    case 'create': {
      const bookRes = await db.collection('books').doc(body.book_id).get();
      const book = bookRes.data;
      
      if (!book) {
        return createResponse(null, '图书不存在');
      }
      
      if ((book.available_copies || 0) <= 0) {
        return createResponse(null, '该图书暂时不可借');
      }
      
      const newRecord = {
        _id: generateId('borrow_'),
        book_id: body.book_id,
        user_id: body.user_id,
        borrow_date: new Date().toISOString().split('T')[0],
        due_date: body.due_date,
        status: 'borrowed',
        created_at: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString().split('T')[0],
      };
      
      await db.collection('borrow_records').add(newRecord);
      
      await db.collection('books').doc(body.book_id).update({
        available_copies: book.available_copies - 1,
        updated_at: new Date().toISOString().split('T')[0],
      });
      
      return createResponse(newRecord);
    }
    
    case 'return': {
      const recordRes = await db.collection('borrow_records').doc(id).get();
      const record = recordRes.data;
      
      if (!record) {
        return createResponse(null, '借阅记录不存在');
      }
      
      await db.collection('borrow_records').doc(id).update({
        status: 'returned',
        return_date: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString().split('T')[0],
      });
      
      const bookRes = await db.collection('books').doc(record.book_id).get();
      const book = bookRes.data;
      if (book) {
        await db.collection('books').doc(record.book_id).update({
          available_copies: (book.available_copies || 0) + 1,
          updated_at: new Date().toISOString().split('T')[0],
        });
      }
      
      const updatedRes = await db.collection('borrow_records').doc(id).get();
      return createResponse(updatedRes.data);
    }
    
    default: {
      let query = db.collection('borrow_records');
      if (user_id) {
        query = query.where({ user_id });
      }
      
      const res = await query.get();
      
      const recordsWithBook = await Promise.all(res.data.map(async record => {
        const bookRes = await db.collection('books').doc(record.book_id).get();
        const userRes = await db.collection('users').doc(record.user_id).get();
        
        return {
          ...record,
          books: bookRes.data ? {
            id: bookRes.data._id,
            title: bookRes.data.title,
            author: bookRes.data.author,
            cover_url: bookRes.data.cover_url,
          } : undefined,
          users: userRes.data ? {
            id: userRes.data._id,
            name: userRes.data.name,
            email: userRes.data.email,
          } : undefined,
        };
      }));
      
      return createResponse(recordsWithBook);
    }
  }
}

async function handleFamilies(event) {
  const { action, id } = event.queryString || {};
  const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body || {};
  const db = initDB();
  
  switch (action) {
    case 'get': {
      const res = await db.collection('families').doc(id).get();
      return createResponse(res.data);
    }
    
    case 'create': {
      const newFamily = {
        _id: generateId('family_'),
        ...body,
        members: [body.head_of_family],
        created_at: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString().split('T')[0],
      };
      
      await db.collection('families').add(newFamily);
      
      const newModule = {
        _id: generateId('mod_'),
        name: `${body.name}藏书`,
        type: 'family',
        owner_id: newFamily._id,
        is_public: false,
        created_at: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString().split('T')[0],
      };
      
      await db.collection('modules').add(newModule);
      
      return createResponse(newFamily);
    }
    
    case 'add-member': {
      const familyRes = await db.collection('families').doc(id).get();
      const family = familyRes.data;
      
      if (!family) {
        return createResponse(null, '家庭不存在');
      }
      
      const members = family.members || [];
      if (!members.includes(body.userId)) {
        members.push(body.userId);
        await db.collection('families').doc(id).update({
          members,
          updated_at: new Date().toISOString().split('T')[0],
        });
      }
      
      return createResponse({ success: true });
    }
    
    case 'books': {
      const modRes = await db.collection('modules').where({ type: 'family', owner_id: id }).get();
      const mod = modRes.data[0];
      
      if (!mod) {
        return createResponse([]);
      }
      
      const booksRes = await db.collection('books').where({ module_id: mod._id }).get();
      return createResponse(booksRes.data);
    }
    
    default: {
      const res = await db.collection('families').get();
      return createResponse(res.data);
    }
  }
}

async function handleCommon(event) {
  const { action } = event.queryString || {};
  const db = initDB();
  
  switch (action) {
    case 'modules': {
      const res = await db.collection('modules').get();
      return createResponse(res.data);
    }
    
    case 'stats': {
      const booksRes = await db.collection('books').get();
      const recordsRes = await db.collection('borrow_records').where({ status: 'borrowed' }).get();
      const usersRes = await db.collection('users').get();
      
      const totalBooks = booksRes.data.reduce((sum, b) => sum + (b.total_copies || 0), 0);
      const availableBooks = booksRes.data.reduce((sum, b) => sum + (b.available_copies || 0), 0);
      
      return createResponse({
        total_books: totalBooks,
        available_books: availableBooks,
        total_borrowed: recordsRes.data.length,
        total_users: usersRes.data.length,
      });
    }
    
    case 'health': {
      return createResponse({ status: 'ok' });
    }
    
    case 'init': {
      await initDatabase(db);
      return createResponse({ success: true });
    }
    
    default:
      return createResponse(null, '未知操作');
  }
}

async function initDatabase(db) {
  const collections = ['users', 'books', 'borrow_records', 'families', 'modules'];
  
  for (const coll of collections) {
    try {
      await db.createCollection(coll);
    } catch (e) {
      console.log(`Collection ${coll} already exists`);
    }
  }
  
  const userCount = await db.collection('users').count().get();
  if (userCount.total === 0) {
    const adminHash = bcrypt.hashSync('admin123', 10);
    await db.collection('users').add({
      _id: 'user_admin',
      email: 'admin@library.com',
      password_hash: adminHash,
      name: '管理员',
      role: 'admin',
      approved: true,
      created_at: new Date().toISOString().split('T')[0],
      updated_at: new Date().toISOString().split('T')[0],
    });
    
    const modules = [
      { _id: 'mod_1', name: '文学经典', type: 'school', is_public: true, created_at: '2024-01-01', updated_at: '2024-01-01' },
      { _id: 'mod_2', name: '科技科普', type: 'school', is_public: true, created_at: '2024-01-01', updated_at: '2024-01-01' },
      { _id: 'mod_3', name: '人文历史', type: 'school', is_public: true, created_at: '2024-01-01', updated_at: '2024-01-01' },
      { _id: 'mod_4', name: '儿童读物', type: 'school', is_public: true, created_at: '2024-01-01', updated_at: '2024-01-01' },
      { _id: 'mod_5', name: '世界名著', type: 'school', is_public: true, created_at: '2024-01-01', updated_at: '2024-01-01' },
      { _id: 'mod_6', name: '科普读物', type: 'school', is_public: true, created_at: '2024-01-01', updated_at: '2024-01-01' },
    ];
    
    for (const mod of modules) {
      await db.collection('modules').add(mod);
    }
  }
}

exports.main = async function (event, context) {
  initDB();
  
  const path = event.path || '';
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  };
  
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: JSON.stringify(createResponse()) };
  }
  
  try {
    let result;
    
    if (path.includes('/api/auth')) {
      result = await handleAuth(event);
    } else if (path.includes('/api/users')) {
      result = await handleUsers(event);
    } else if (path.includes('/api/books')) {
      result = await handleBooks(event);
    } else if (path.includes('/api/borrow-records')) {
      result = await handleBorrowRecords(event);
    } else if (path.includes('/api/families')) {
      result = await handleFamilies(event);
    } else if (path.includes('/api/common')) {
      result = await handleCommon(event);
    } else {
      result = createResponse(null, '未知路径');
    }
    
    return {
      statusCode: result.error ? 400 : 200,
      headers,
      body: JSON.stringify(result),
    };
  } catch (e) {
    console.error('API Error:', e);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify(createResponse(null, e.message || '服务器错误')),
    };
  }
};
