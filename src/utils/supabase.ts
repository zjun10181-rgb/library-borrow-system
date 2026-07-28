import type { User, Book, BorrowRecord, Family, Module, BorrowRecordWithBook } from '@/types';
import { mockUsers, mockPasswords, mockBooks, mockBorrowRecords, mockFamilies, mockModules } from './mockData';

const API_URL = import.meta.env.VITE_API_URL || '/';

// ============ 本地 Mock 模式 ============
const USE_LOCAL_MOCK = import.meta.env.VITE_USE_LOCAL_MOCK === 'true' || !import.meta.env.VITE_API_URL;

function getLocalUsers(): User[] {
  const stored = localStorage.getItem('library_users');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // ignore
    }
  }
  return mockUsers;
}

function saveLocalUsers(users: User[]) {
  localStorage.setItem('library_users', JSON.stringify(users));
}

function getLocalPasswords(): Record<string, string> {
  const stored = localStorage.getItem('library_passwords');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // ignore
    }
  }
  return mockPasswords;
}

function saveLocalPasswords(passwords: Record<string, string>) {
  localStorage.setItem('library_passwords', JSON.stringify(passwords));
}

function getToken(): string | null {
  return localStorage.getItem('library_token');
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<{ data: T | null; error: Error | null }> {
  try {
    const token = getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
    });

    const json = await res.json();

    if (!res.ok) {
      return { data: null, error: new Error(json.error || `请求失败 (${res.status})`) };
    }

    return { data: json.data, error: null };
  } catch (err) {
    return { data: null, error: err as Error };
  }
}

// ============ 认证相关 ============

export async function getCurrentUser() {
  const token = getToken();
  if (!token) return { data: null, error: null };
  
  // 本地 Mock 模式
  if (USE_LOCAL_MOCK) {
    const users = getLocalUsers();
    // 从 token 中提取用户 ID
    const userId = token.replace('mock_token_', '').split('_')[0];
    const user = users.find(u => u.id === userId);
    if (user) {
      return { data: user, error: null };
    }
    return { data: null, error: null };
  }
  
  return request<User>('/api/auth?action=me');
}

export async function login(email: string, password: string): Promise<{ data: User | null; error: Error | null }> {
  // 本地 Mock 模式
  if (USE_LOCAL_MOCK) {
    const users = getLocalUsers();
    const passwords = getLocalPasswords();
    const user = users.find(u => u.email === email);
    
    if (!user) {
      return { data: null, error: new Error('邮箱或密码错误') };
    }
    
    if (!user.approved) {
      return { data: null, error: new Error('账号尚未审核通过，请等待管理员批准') };
    }
    
    if (passwords[email] !== password) {
      return { data: null, error: new Error('邮箱或密码错误') };
    }
    
    const token = `mock_token_${user.id}_${Date.now()}`;
    localStorage.setItem('library_token', token);
    return { data: user, error: null };
  }
  
  const result = await request<{ user: User; token: string }>('/api/auth?action=login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  
  if (result.data) {
    localStorage.setItem('library_token', result.data.token);
    return { data: result.data.user, error: null };
  }
  return { data: null, error: result.error };
}

export async function logout() {
  localStorage.removeItem('library_token');
  return { data: { success: true }, error: null };
}

export async function signUp(email: string, password: string, name: string, role: User['role']) {
  // 本地 Mock 模式
  if (USE_LOCAL_MOCK) {
    const users = getLocalUsers();
    if (users.find(u => u.email === email)) {
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
    saveLocalUsers(users);
    const passwords = getLocalPasswords();
    passwords[email] = password;
    saveLocalPasswords(passwords);
    return { data: newUser, error: null };
  }
  
  return request<User>('/api/auth?action=register', {
    method: 'POST',
    body: JSON.stringify({ email, password, name, role }),
  });
}

export async function changePassword(oldPassword: string, newPassword: string) {
  return request<{ success: boolean }>('/api/auth?action=change-password', {
    method: 'POST',
    body: JSON.stringify({ oldPassword, newPassword }),
  });
}

export async function getUserByEmail(email: string) {
  return { data: null, error: null };
}

export async function insertUser(userData: { id: string; email: string; name: string; role: User['role'] }) {
  return signUp(userData.email, 'default123', userData.name, userData.role);
}

// ============ 用户管理 ============

export async function getUsers() {
  // 本地 Mock 模式
  if (USE_LOCAL_MOCK) {
    return { data: getLocalUsers(), error: null };
  }
  return request<User[]>('/api/users');
}

export async function approveUser(id: string) {
  // 本地 Mock 模式
  if (USE_LOCAL_MOCK) {
    const users = getLocalUsers();
    const user = users.find(u => u.id === id);
    if (user) {
      user.approved = true;
      saveLocalUsers(users);
      return { data: user, error: null };
    }
    return { data: null, error: new Error('用户不存在') };
  }
  return request<User>(`/api/users?action=approve&id=${id}`, { method: 'POST' });
}

export async function updateUserRole(id: string, role: User['role']) {
  // 本地 Mock 模式
  if (USE_LOCAL_MOCK) {
    const users = getLocalUsers();
    const user = users.find(u => u.id === id);
    if (user) {
      user.role = role;
      saveLocalUsers(users);
      return { data: user, error: null };
    }
    return { data: null, error: new Error('用户不存在') };
  }
  return request<User>(`/api/users?action=role&id=${id}`, {
    method: 'POST',
    body: JSON.stringify({ role }),
  });
}

export async function deleteUser(id: string) {
  // 本地 Mock 模式
  if (USE_LOCAL_MOCK) {
    const users = getLocalUsers().filter(u => u.id !== id);
    saveLocalUsers(users);
    return { data: null, error: null };
  }
  return request<null>(`/api/users?action=delete&id=${id}`, { method: 'POST' });
}

export async function updatePassword(email: string, oldPassword: string, newPassword: string) {
  return changePassword(oldPassword, newPassword);
}

export async function resetPassword(email: string, newPassword: string) {
  // 本地 Mock 模式
  if (USE_LOCAL_MOCK) {
    const passwords = getLocalPasswords();
    passwords[email] = newPassword;
    saveLocalPasswords(passwords);
    return { data: { success: true }, error: null };
  }
  return request<{ success: boolean }>(`/api/users?action=reset-password&id=${email}`, {
    method: 'POST',
    body: JSON.stringify({ newPassword }),
  });
}

// ============ 本地数据存储 ============
function getLocalBooks(): Book[] {
  const stored = localStorage.getItem('library_books');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // ignore
    }
  }
  return mockBooks;
}

function saveLocalBooks(books: Book[]) {
  localStorage.setItem('library_books', JSON.stringify(books));
}

function getLocalBorrowRecords(): BorrowRecord[] {
  const stored = localStorage.getItem('library_borrow_records');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // ignore
    }
  }
  return mockBorrowRecords;
}

function saveLocalBorrowRecords(records: BorrowRecord[]) {
  localStorage.setItem('library_borrow_records', JSON.stringify(records));
}

// ============ 家庭管理 ============

export async function getFamilies(userId?: string) {
  // 本地 Mock 模式
  if (USE_LOCAL_MOCK) {
    return { data: mockFamilies, error: null };
  }
  return request<Family[]>('/api/families');
}

export async function getFamilyById(id: string) {
  return request<Family>(`/api/families?action=get&id=${id}`);
}

export async function createFamily(familyData: Omit<Family, 'id' | 'created_at' | 'updated_at'>) {
  return request<Family>('/api/families?action=create', {
    method: 'POST',
    body: JSON.stringify(familyData),
  });
}

export async function addFamilyMember(familyId: string, userId: string) {
  return request<{ success: boolean }>(`/api/families?action=add-member&id=${familyId}`, {
    method: 'POST',
    body: JSON.stringify({ userId }),
  });
}

export async function getFamilyBooks(familyId: string) {
  return request<Book[]>(`/api/families?action=books&id=${familyId}`);
}

// ============ 模块管理 ============

export async function getModules() {
  // 本地 Mock 模式
  if (USE_LOCAL_MOCK) {
    return { data: mockModules, error: null };
  }
  return request<Module[]>('/api/common?action=modules');
}

// ============ 图书管理 ============

export async function getBooks(filters?: { keyword?: string; category?: string; module_id?: string }) {
  // 本地 Mock 模式
  if (USE_LOCAL_MOCK) {
    let books = getLocalBooks();
    if (filters?.keyword) {
      const keyword = filters.keyword.toLowerCase();
      books = books.filter(b => 
        b.title.toLowerCase().includes(keyword) || 
        b.author.toLowerCase().includes(keyword)
      );
    }
    if (filters?.category) {
      books = books.filter(b => b.category === filters.category);
    }
    if (filters?.module_id) {
      books = books.filter(b => b.module_id === filters.module_id);
    }
    return { data: books, error: null };
  }
  
  const params = new URLSearchParams();
  if (filters?.keyword) params.set('keyword', filters.keyword);
  if (filters?.category) params.set('category', filters.category);
  if (filters?.module_id) params.set('module_id', filters.module_id);
  
  const query = params.toString();
  return request<Book[]>(`/api/books${query ? `?${query}` : ''}`);
}

export async function getBookById(id: string) {
  // 本地 Mock 模式
  if (USE_LOCAL_MOCK) {
    const books = getLocalBooks();
    const book = books.find(b => b.id === id);
    return { data: book || null, error: book ? null : new Error('图书不存在') };
  }
  return request<Book>(`/api/books?action=get&id=${id}`);
}

export async function createBook(bookData: Omit<Book, 'id' | 'created_at' | 'updated_at'>) {
  // 本地 Mock 模式
  if (USE_LOCAL_MOCK) {
    const books = getLocalBooks();
    const newBook: Book = {
      ...bookData,
      id: `book_${Date.now()}`,
      created_at: new Date().toISOString().split('T')[0],
      updated_at: new Date().toISOString().split('T')[0],
    };
    books.push(newBook);
    saveLocalBooks(books);
    return { data: newBook, error: null };
  }
  return request<Book>('/api/books?action=create', {
    method: 'POST',
    body: JSON.stringify(bookData),
  });
}

export async function updateBook(id: string, bookData: Partial<Book>) {
  // 本地 Mock 模式
  if (USE_LOCAL_MOCK) {
    const books = getLocalBooks();
    const index = books.findIndex(b => b.id === id);
    if (index !== -1) {
      books[index] = { ...books[index], ...bookData, updated_at: new Date().toISOString().split('T')[0] };
      saveLocalBooks(books);
      return { data: books[index], error: null };
    }
    return { data: null, error: new Error('图书不存在') };
  }
  return request<Book>(`/api/books?action=update&id=${id}`, {
    method: 'POST',
    body: JSON.stringify(bookData),
  });
}

export async function deleteBook(id: string) {
  // 本地 Mock 模式
  if (USE_LOCAL_MOCK) {
    const books = getLocalBooks().filter(b => b.id !== id);
    saveLocalBooks(books);
    return { data: null, error: null };
  }
  return request<null>(`/api/books?action=delete&id=${id}`, { method: 'POST' });
}

// ============ 借阅记录 ============

export async function getBorrowRecords(userId?: string) {
  // 本地 Mock 模式
  if (USE_LOCAL_MOCK) {
    let records = getLocalBorrowRecords();
    if (userId) {
      records = records.filter(r => r.user_id === userId);
    }
    // 获取关联的图书信息
    const books = getLocalBooks();
    const recordsWithBooks: BorrowRecordWithBook[] = records.map(r => {
      const book = books.find(b => b.id === r.book_id);
      return { 
        ...r, 
        books: {
          title: book?.title || '未知书籍',
          author: book?.author || '',
          id: book?.id || '',
          cover_url: book?.cover_url,
        }
      };
    });
    return { data: recordsWithBooks, error: null };
  }
  const query = userId ? `?user_id=${userId}` : '';
  return request<BorrowRecordWithBook[]>(`/api/borrow-records${query}`);
}

export async function createBorrowRecord(recordData: Omit<BorrowRecord, 'id' | 'created_at' | 'updated_at'>) {
  // 本地 Mock 模式
  if (USE_LOCAL_MOCK) {
    const records = getLocalBorrowRecords();
    const newRecord: BorrowRecord = {
      ...recordData,
      id: `record_${Date.now()}`,
      created_at: new Date().toISOString().split('T')[0],
      updated_at: new Date().toISOString().split('T')[0],
    };
    records.push(newRecord);
    saveLocalBorrowRecords(records);
    
    // 更新图书可用数量
    const books = getLocalBooks();
    const book = books.find(b => b.id === recordData.book_id);
    if (book && book.available_copies > 0) {
      book.available_copies -= 1;
      saveLocalBooks(books);
    }
    
    return { data: newRecord, error: null };
  }
  return request<BorrowRecord>('/api/borrow-records?action=create', {
    method: 'POST',
    body: JSON.stringify({ book_id: recordData.book_id, user_id: recordData.user_id, due_date: recordData.due_date }),
  });
}

export async function returnBook(recordId: string) {
  // 本地 Mock 模式
  if (USE_LOCAL_MOCK) {
    const records = getLocalBorrowRecords();
    const record = records.find(r => r.id === recordId);
    if (record) {
      record.return_date = new Date().toISOString().split('T')[0];
      record.status = 'returned';
      saveLocalBorrowRecords(records);
      
      // 更新图书可用数量
      const books = getLocalBooks();
      const book = books.find(b => b.id === record.book_id);
      if (book) {
        book.available_copies += 1;
        saveLocalBooks(books);
      }
      return { data: record, error: null };
    }
    return { data: null, error: new Error('借阅记录不存在') };
  }
  return request<BorrowRecord>(`/api/borrow-records?action=return&id=${recordId}`, { method: 'POST' });
}

// ============ 统计 ============

export async function getStats() {
  // 本地 Mock 模式
  if (USE_LOCAL_MOCK) {
    const books = getLocalBooks();
    const users = getLocalUsers();
    const records = getLocalBorrowRecords();
    const total_books = books.reduce((sum, b) => sum + (b.total_copies || 0), 0);
    const available_books = books.reduce((sum, b) => sum + (b.available_copies || 0), 0);
    const total_borrowed = records.filter(r => !r.return_date).length;
    const total_users = users.length;
    return { data: { total_books, available_books, total_borrowed, total_users }, error: null };
  }
  return request<{ total_books: number; available_books: number; total_borrowed: number; total_users: number }>('/api/common?action=stats');
}
