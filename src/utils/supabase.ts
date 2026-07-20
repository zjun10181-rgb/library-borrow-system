import type { User, Book, BorrowRecord, Family, Module, BorrowRecordWithBook } from '@/types';
import { mockUsers, mockBooks, mockBorrowRecords, mockFamilies, mockModules } from './mockData';

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

export async function getCurrentUser() {
  const email = localStorage.getItem('current_user_email');
  if (!email) return { data: null, error: null };
  
  const user = users.find(u => u.email === email);
  return { data: user || null, error: null };
}

export async function login(email: string, password: string) {
  const user = users.find(u => u.email === email);
  
  if (!user) {
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
  const exists = users.find(u => u.email === email);
  if (exists) {
    return { data: null, error: new Error('该邮箱已被注册') };
  }
  
  const newUser: User = {
    id: `user_${Date.now()}`,
    email,
    name,
    role,
    approved: role === 'admin',
    created_at: new Date().toISOString().split('T')[0],
    updated_at: new Date().toISOString().split('T')[0],
  };
  
  users.push(newUser);
  saveData(STORAGE_KEYS.users, users);
  
  return { data: newUser, error: null };
}

export async function getUserByEmail(email: string) {
  const user = users.find(u => u.email === email);
  return { data: user || null, error: null };
}

export async function insertUser(userData: { id: string; email: string; name: string; role: User['role'] }) {
  const exists = users.find(u => u.email === userData.email);
  if (exists) {
    return { data: null, error: new Error('该邮箱已被注册') };
  }
  
  const newUser: User = {
    ...userData,
    approved: true,
    created_at: new Date().toISOString().split('T')[0],
    updated_at: new Date().toISOString().split('T')[0],
  };
  
  users.push(newUser);
  saveData(STORAGE_KEYS.users, users);
  
  return { data: newUser, error: null };
}

export async function getModules() {
  return { data: modules, error: null };
}

export async function getBooks(filters?: { keyword?: string; category?: string; module_id?: string }) {
  let result = [...books];
  
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
  return { data: book || null, error: null };
}

export async function createBook(bookData: Omit<Book, 'id' | 'created_at' | 'updated_at'>) {
  const newBook: Book = {
    ...bookData,
    id: `book_${Date.now()}`,
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
  
  books[index] = { ...books[index], ...bookData, updated_at: new Date().toISOString().split('T')[0] };
  saveData(STORAGE_KEYS.books, books);
  
  return { data: books[index], error: null };
}

export async function deleteBook(id: string) {
  const index = books.findIndex(b => b.id === id);
  if (index === -1) {
    return { error: new Error('图书不存在') };
  }
  
  books.splice(index, 1);
  saveData(STORAGE_KEYS.books, books);
  
  return { error: null };
}

export async function getBorrowRecords(userId?: string) {
  let result = [...borrowRecords];
  
  if (userId) {
    result = result.filter(r => r.user_id === userId);
  }
  
  const recordsWithBook: BorrowRecordWithBook[] = result.map(record => ({
    ...record,
    books: books.find(b => b.id === record.book_id) || {} as any,
    users: users.find(u => u.id === record.user_id),
  }));
  
  return { data: recordsWithBook, error: null };
}

export async function createBorrowRecord(recordData: Omit<BorrowRecord, 'id' | 'created_at' | 'updated_at'>) {
  const book = books.find(b => b.id === recordData.book_id);
  if (!book || book.available_copies <= 0) {
    return { data: null, error: new Error('该图书暂时不可借') };
  }
  
  book.available_copies--;
  saveData(STORAGE_KEYS.books, books);
  
  const newRecord: BorrowRecord = {
    ...recordData,
    id: `borrow_${Date.now()}`,
    created_at: new Date().toISOString().split('T')[0],
    updated_at: new Date().toISOString().split('T')[0],
  };
  
  borrowRecords.push(newRecord);
  saveData(STORAGE_KEYS.borrowRecords, borrowRecords);
  
  return { data: newRecord, error: null };
}

export async function returnBook(recordId: string) {
  const record = borrowRecords.find(r => r.id === recordId);
  if (!record) {
    return { data: null, error: new Error('借阅记录不存在') };
  }
  
  const book = books.find(b => b.id === record.book_id);
  if (book) {
    book.available_copies++;
    saveData(STORAGE_KEYS.books, books);
  }
  
  record.return_date = new Date().toISOString().split('T')[0];
  record.status = 'returned';
  record.updated_at = new Date().toISOString().split('T')[0];
  saveData(STORAGE_KEYS.borrowRecords, borrowRecords);
  
  return { data: record, error: null };
}

export async function getUsers() {
  return { data: users, error: null };
}

export async function approveUser(id: string) {
  const index = users.findIndex(u => u.id === id);
  if (index === -1) {
    return { data: null, error: new Error('用户不存在') };
  }
  
  users[index].approved = true;
  users[index].updated_at = new Date().toISOString().split('T')[0];
  saveData(STORAGE_KEYS.users, users);
  
  return { data: users[index], error: null };
}

export async function updateUserRole(id: string, role: User['role']) {
  const index = users.findIndex(u => u.id === id);
  if (index === -1) {
    return { data: null, error: new Error('用户不存在') };
  }
  
  users[index].role = role;
  users[index].updated_at = new Date().toISOString().split('T')[0];
  saveData(STORAGE_KEYS.users, users);
  
  return { data: users[index], error: null };
}

export async function deleteUser(id: string) {
  const index = users.findIndex(u => u.id === id);
  if (index === -1) {
    return { error: new Error('用户不存在') };
  }
  
  users.splice(index, 1);
  saveData(STORAGE_KEYS.users, users);
  
  return { error: null };
}

export async function getFamilies(userId?: string) {
  if (userId) {
    const user = users.find(u => u.id === userId);
    if (user?.family_id) {
      return { data: families.filter(f => f.id === user.family_id), error: null };
    }
  }
  return { data: families, error: null };
}

export async function getFamilyById(id: string) {
  const family = families.find(f => f.id === id);
  return { data: family || null, error: null };
}

export async function createFamily(familyData: Omit<Family, 'id' | 'created_at' | 'updated_at'>) {
  const newFamily: Family = {
    ...familyData,
    id: `family_${Date.now()}`,
    created_at: new Date().toISOString().split('T')[0],
    updated_at: new Date().toISOString().split('T')[0],
  };
  
  families.push(newFamily);
  saveData(STORAGE_KEYS.families, families);
  
  const familyModule: Module = {
    id: `family_mod_${Date.now()}`,
    name: `${familyData.name}藏书`,
    type: 'family',
    owner_id: newFamily.id,
    is_public: false,
    created_at: new Date().toISOString().split('T')[0],
    updated_at: new Date().toISOString().split('T')[0],
  };
  
  modules.push(familyModule);
  saveData(STORAGE_KEYS.modules, modules);
  
  return { data: newFamily, error: null };
}

export async function addFamilyMember(familyId: string, userId: string) {
  const index = users.findIndex(u => u.id === userId);
  if (index === -1) {
    return { data: null, error: new Error('用户不存在') };
  }
  
  users[index].family_id = familyId;
  users[index].updated_at = new Date().toISOString().split('T')[0];
  saveData(STORAGE_KEYS.users, users);
  
  return { data: users[index], error: null };
}

export async function getFamilyBooks(familyId: string) {
  const familyModule = modules.find(m => m.owner_id === familyId);
  if (!familyModule) {
    return { data: [], error: null };
  }
  
  const familyBooks = books.filter(b => b.module_id === familyModule.id);
  return { data: familyBooks.map(b => ({ books: b })), error: null };
}

export async function updatePassword(email: string, oldPassword: string, newPassword: string) {
  return { data: { success: true }, error: null };
}

export async function resetPassword(email: string, newPassword: string) {
  const index = users.findIndex(u => u.email === email);
  if (index === -1) {
    return { data: null, error: new Error('用户不存在') };
  }
  
  users[index].updated_at = new Date().toISOString().split('T')[0];
  saveData(STORAGE_KEYS.users, users);
  
  return { data: { success: true }, error: null };
}