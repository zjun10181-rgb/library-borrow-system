import type { User, Book, BorrowRecord, Family, Module, BorrowRecordWithBook } from '@/types';
import { mockUsers, mockBooks, mockBorrowRecords, mockFamilies, mockModules, mockPasswords } from './mockData';

const STORAGE_KEYS = {
  users: 'library_users',
  books: 'library_books',
  borrowRecords: 'library_borrow_records',
  families: 'library_families',
  modules: 'library_modules',
};

function getData<T>(key: string, defaultValue: T): T {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function saveData<T>(key: string, data: T) {
  localStorage.setItem(key, JSON.stringify(data));
}

let users = getData<User[]>(STORAGE_KEYS.users, mockUsers);
let books = getData<Book[]>(STORAGE_KEYS.books, mockBooks);
let borrowRecords = getData<BorrowRecord[]>(STORAGE_KEYS.borrowRecords, mockBorrowRecords);
let families = getData<Family[]>(STORAGE_KEYS.families, mockFamilies);
let modules = getData<Module[]>(STORAGE_KEYS.modules, mockModules);

// ============ 认证相关 ============

export async function getCurrentUser() {
  const email = localStorage.getItem('current_user_email');
  if (!email) return { data: null, error: null };
  
  const user = users.find(u => u.email === email);
  return { data: user || null, error: null };
}

export async function login(email: string, password: string): Promise<{ data: User | null; error: Error | null }> {
  const user = users.find(u => u.email === email);
  
  if (!user) {
    return { data: null, error: new Error('邮箱或密码错误') };
  }
  
  if (mockPasswords[email] !== password) {
    return { data: null, error: new Error('邮箱或密码错误') };
  }
  
  if (!user.approved) {
    return { data: null, error: new Error('您的账号尚未被管理员批准') };
  }
  
  localStorage.setItem('current_user_email', email);
  return { data: user, error: null };
}

export async function logout() {
  localStorage.removeItem('current_user_email');
  return { data: { success: true }, error: null };
}

export async function signUp(email: string, password: string, name: string, role: User['role']) {
  if (!email || !password || !name) {
    return { data: null, error: new Error('邮箱、密码和姓名不能为空') };
  }

  const existing = users.find(u => u.email === email);
  if (existing) {
    return { data: null, error: new Error('该邮箱已被注册') };
  }

  const id = `user-${Date.now()}`;
  const newUser: User = {
    id,
    email,
    name,
    role: role || 'student',
    approved: false,
    created_at: new Date().toISOString().split('T')[0],
    updated_at: new Date().toISOString().split('T')[0],
  };

  users.push(newUser);
  (mockPasswords as Record<string, string>)[email] = password;
  saveData(STORAGE_KEYS.users, users);

  return { data: newUser, error: null };
}

export async function changePassword(oldPassword: string, newPassword: string) {
  const email = localStorage.getItem('current_user_email');
  if (!email) {
    return { data: null, error: new Error('未登录') };
  }

  if (mockPasswords[email] !== oldPassword) {
    return { data: null, error: new Error('旧密码错误') };
  }

  (mockPasswords as Record<string, string>)[email] = newPassword;
  return { data: { success: true }, error: null };
}

export async function getUserByEmail(email: string) {
  const user = users.find(u => u.email === email);
  return { data: user || null, error: null };
}

export async function insertUser(userData: { id: string; email: string; name: string; role: User['role'] }) {
  return signUp(userData.email, 'default123', userData.name, userData.role);
}

// ============ 用户管理 ============

export async function getUsers() {
  return { data: users, error: null };
}

export async function approveUser(id: string) {
  const user = users.find(u => u.id === id);
  if (!user) {
    return { data: null, error: new Error('用户不存在') };
  }
  
  user.approved = true;
  user.updated_at = new Date().toISOString().split('T')[0];
  saveData(STORAGE_KEYS.users, users);
  
  return { data: user, error: null };
}

export async function updateUserRole(id: string, role: User['role']) {
  const user = users.find(u => u.id === id);
  if (!user) {
    return { data: null, error: new Error('用户不存在') };
  }
  
  user.role = role;
  user.updated_at = new Date().toISOString().split('T')[0];
  saveData(STORAGE_KEYS.users, users);
  
  return { data: user, error: null };
}

export async function deleteUser(id: string) {
  const index = users.findIndex(u => u.id === id);
  if (index === -1) {
    return { data: null, error: new Error('用户不存在') };
  }
  
  users.splice(index, 1);
  saveData(STORAGE_KEYS.users, users);
  
  return { data: null, error: null };
}

export async function updatePassword(email: string, oldPassword: string, newPassword: string) {
  return changePassword(oldPassword, newPassword);
}

export async function resetPassword(email: string, newPassword: string) {
  (mockPasswords as Record<string, string>)[email] = newPassword;
  return { data: { success: true }, error: null };
}

// ============ 家庭管理 ============

export async function getFamilies(userId?: string) {
  return { data: families, error: null };
}

export async function getFamilyById(id: string) {
  const family = families.find(f => f.id === id);
  if (family) {
    family.memberDetails = users.filter(u => family.members.includes(u.id));
  }
  return { data: family || null, error: null };
}

export async function createFamily(familyData: Omit<Family, 'id' | 'created_at' | 'updated_at'>) {
  const id = `family-${Date.now()}`;
  const newFamily: Family = {
    id,
    ...familyData,
    members: [familyData.head_of_family],
    created_at: new Date().toISOString().split('T')[0],
    updated_at: new Date().toISOString().split('T')[0],
  };
  
  families.push(newFamily);
  saveData(STORAGE_KEYS.families, families);
  
  const modId = `mod-family-${Date.now()}`;
  const newModule: Module = {
    id: modId,
    name: `${familyData.name}藏书`,
    type: 'family',
    owner_id: id,
    is_public: false,
    created_at: new Date().toISOString().split('T')[0],
    updated_at: new Date().toISOString().split('T')[0],
  };
  
  modules.push(newModule);
  saveData(STORAGE_KEYS.modules, modules);
  
  return { data: newFamily, error: null };
}

export async function addFamilyMember(familyId: string, userId: string) {
  const family = families.find(f => f.id === familyId);
  if (!family) {
    return { data: null, error: new Error('家庭不存在') };
  }
  
  if (!family.members.includes(userId)) {
    family.members.push(userId);
    family.updated_at = new Date().toISOString().split('T')[0];
    saveData(STORAGE_KEYS.families, families);
  }
  
  return { data: { success: true }, error: null };
}

export async function getFamilyBooks(familyId: string) {
  const mod = modules.find(m => m.type === 'family' && m.owner_id === familyId);
  if (!mod) {
    return { data: [], error: null };
  }
  return { data: books.filter(b => b.module_id === mod.id), error: null };
}

// ============ 模块管理 ============

export async function getModules() {
  return { data: modules, error: null };
}

// ============ 图书管理 ============

export async function getBooks(filters?: { keyword?: string; category?: string; module_id?: string }) {
  let result = books;
  
  if (filters?.module_id) {
    result = result.filter(b => b.module_id === filters.module_id);
  }
  if (filters?.category) {
    result = result.filter(b => b.category === filters.category);
  }
  if (filters?.keyword) {
    const kw = filters.keyword.toLowerCase();
    result = result.filter(b => 
      b.title.toLowerCase().includes(kw) || b.author.toLowerCase().includes(kw)
    );
  }
  
  return { data: result, error: null };
}

export async function getBookById(id: string) {
  const book = books.find(b => b.id === id);
  return { data: book || null, error: book ? null : new Error('图书不存在') };
}

export async function createBook(bookData: Omit<Book, 'id' | 'created_at' | 'updated_at'>) {
  const id = `book-${Date.now()}`;
  const newBook: Book = {
    id,
    ...bookData,
    available_copies: bookData.total_copies || 1,
    created_at: new Date().toISOString().split('T')[0],
    updated_at: new Date().toISOString().split('T')[0],
  };
  
  books.push(newBook);
  saveData(STORAGE_KEYS.books, books);
  
  return { data: newBook, error: null };
}

export async function updateBook(id: string, bookData: Partial<Book>) {
  const index = books.findIndex(b => b.id === id);
  if (index === -1) {
    return { data: null, error: new Error('图书不存在') };
  }
  
  const book = books[index];
  
  if (bookData.total_copies !== undefined) {
    const diff = bookData.total_copies - book.total_copies;
    book.available_copies = Math.max(0, book.available_copies + diff);
  }
  
  books[index] = {
    ...book,
    ...bookData,
    updated_at: new Date().toISOString().split('T')[0],
  };
  
  saveData(STORAGE_KEYS.books, books);
  
  return { data: books[index], error: null };
}

export async function deleteBook(id: string) {
  const index = books.findIndex(b => b.id === id);
  if (index === -1) {
    return { data: null, error: new Error('图书不存在') };
  }
  
  books.splice(index, 1);
  saveData(STORAGE_KEYS.books, books);
  
  return { data: null, error: null };
}

// ============ 借阅记录 ============

export async function getBorrowRecords(userId?: string) {
  let result = borrowRecords;
  
  if (userId) {
    result = result.filter(r => r.user_id === userId);
  }
  
  const recordsWithBook: BorrowRecordWithBook[] = result.map(r => {
    const book = books.find(b => b.id === r.book_id);
    const user = users.find(u => u.id === r.user_id);
    return {
      ...r,
      books: book ? {
        id: book.id,
        title: book.title,
        author: book.author,
        cover_url: book.cover_url,
      } : undefined,
      users: user ? {
        id: user.id,
        name: user.name,
        email: user.email,
      } : undefined,
    };
  });
  
  return { data: recordsWithBook, error: null };
}

export async function createBorrowRecord(recordData: Omit<BorrowRecord, 'id' | 'created_at' | 'updated_at'>) {
  const book = books.find(b => b.id === recordData.book_id);
  if (!book) {
    return { data: null, error: new Error('图书不存在') };
  }
  
  if (book.available_copies <= 0) {
    return { data: null, error: new Error('该图书暂时不可借') };
  }
  
  const id = `borrow-${Date.now()}`;
  const newRecord: BorrowRecord = {
    id,
    ...recordData,
    status: 'borrowed',
    borrow_date: new Date().toISOString().split('T')[0],
    created_at: new Date().toISOString().split('T')[0],
    updated_at: new Date().toISOString().split('T')[0],
  };
  
  borrowRecords.push(newRecord);
  saveData(STORAGE_KEYS.borrowRecords, borrowRecords);
  
  book.available_copies--;
  book.updated_at = new Date().toISOString().split('T')[0];
  saveData(STORAGE_KEYS.books, books);
  
  return { data: newRecord, error: null };
}

export async function returnBook(recordId: string) {
  const index = borrowRecords.findIndex(r => r.id === recordId);
  if (index === -1) {
    return { data: null, error: new Error('借阅记录不存在') };
  }
  
  const record = borrowRecords[index];
  
  borrowRecords[index] = {
    ...record,
    status: 'returned',
    return_date: new Date().toISOString().split('T')[0],
    updated_at: new Date().toISOString().split('T')[0],
  };
  saveData(STORAGE_KEYS.borrowRecords, borrowRecords);
  
  const book = books.find(b => b.id === record.book_id);
  if (book) {
    book.available_copies++;
    book.updated_at = new Date().toISOString().split('T')[0];
    saveData(STORAGE_KEYS.books, books);
  }
  
  return { data: borrowRecords[index], error: null };
}

// ============ 统计 ============

export async function getStats() {
  const totalBooks = books.reduce((sum, b) => sum + b.total_copies, 0);
  const availableBooks = books.reduce((sum, b) => sum + b.available_copies, 0);
  const totalBorrowed = borrowRecords.filter(r => r.status === 'borrowed').length;
  
  return {
    data: {
      total_books: totalBooks,
      available_books: availableBooks,
      total_borrowed: totalBorrowed,
      total_users: users.length,
    },
    error: null,
  };
}
