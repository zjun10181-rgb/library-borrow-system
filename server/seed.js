import { db } from './db.js';
import { hashPassword } from './auth.js';
import { mockUsers, mockPasswords, mockBooks, mockBorrowRecords, mockFamilies, mockModules } from './seed-data.js';

/** 将种子数据写入数据库（仅在空库时调用，幂等） */
export function seedDatabase() {
  // 1. 模块
  const insertModule = db.prepare(`
    INSERT INTO modules (id, name, description, icon, type, owner_id, is_public, created_at, updated_at)
    VALUES (@id, @name, @description, @icon, @type, @owner_id, @is_public, @created_at, @updated_at)
  `);
  for (const m of mockModules) {
    insertModule.run({
      id: m.id,
      name: m.name,
      description: m.description || null,
      icon: m.icon || null,
      type: m.type || 'school',
      owner_id: m.owner_id || null,
      is_public: m.is_public ? 1 : 0,
      created_at: m.created_at,
      updated_at: m.updated_at,
    });
  }

  // 2. 用户（密码 scrypt 哈希）
  const insertUser = db.prepare(`
    INSERT INTO users (id, email, password_hash, name, role, approved, family_id, created_at, updated_at)
    VALUES (@id, @email, @password_hash, @name, @role, @approved, @family_id, @created_at, @updated_at)
  `);
  for (const u of mockUsers) {
    const password = mockPasswords[u.email] || 'default123';
    insertUser.run({
      id: u.id,
      email: u.email,
      password_hash: hashPassword(password),
      name: u.name,
      role: u.role,
      approved: u.approved ? 1 : 0,
      family_id: u.family_id || null,
      created_at: u.created_at,
      updated_at: u.updated_at,
    });
  }

  // 3. 家庭（members 数组序列化为 JSON）
  const insertFamily = db.prepare(`
    INSERT INTO families (id, name, head_of_family, members, description, created_at, updated_at)
    VALUES (@id, @name, @head_of_family, @members, @description, @created_at, @updated_at)
  `);
  for (const f of mockFamilies) {
    insertFamily.run({
      id: f.id,
      name: f.name,
      head_of_family: f.head_of_family || null,
      members: JSON.stringify(f.members || []),
      description: f.description || null,
      created_at: f.created_at,
      updated_at: f.updated_at,
    });
  }

  // 4. 图书
  const insertBook = db.prepare(`
    INSERT INTO books (id, title, author, category, isbn, description, cover_url, total_copies, available_copies, module_id, created_at, updated_at)
    VALUES (@id, @title, @author, @category, @isbn, @description, @cover_url, @total_copies, @available_copies, @module_id, @created_at, @updated_at)
  `);
  for (const b of mockBooks) {
    insertBook.run({
      id: b.id,
      title: b.title,
      author: b.author,
      category: b.category || null,
      isbn: b.isbn || '',
      description: b.description || '',
      cover_url: b.cover_url || null,
      total_copies: b.total_copies ?? 1,
      available_copies: b.available_copies ?? 1,
      module_id: b.module_id || null,
      created_at: b.created_at,
      updated_at: b.updated_at,
    });
  }

  // 5. 借阅记录
  if (mockBorrowRecords.length > 0) {
    const insertRecord = db.prepare(`
      INSERT INTO borrow_records (id, book_id, user_id, borrower_name, borrower_contact, borrow_date, due_date, return_date, status, created_at, updated_at)
      VALUES (@id, @book_id, @user_id, @borrower_name, @borrower_contact, @borrow_date, @due_date, @return_date, @status, @created_at, @updated_at)
    `);
    for (const r of mockBorrowRecords) {
      insertRecord.run({
        id: r.id,
        book_id: r.book_id,
        user_id: r.user_id || null,
        borrower_name: r.borrower_name,
        borrower_contact: r.borrower_contact,
        borrow_date: r.borrow_date,
        due_date: r.due_date,
        return_date: r.return_date || null,
        status: r.status,
        created_at: r.created_at,
        updated_at: r.updated_at || null,
      });
    }
  }
}
