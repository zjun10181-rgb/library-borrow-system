import type { User, Book, BorrowRecord, Family, Module, BorrowRecordWithBook } from '@/types';

const API_URL = import.meta.env.VITE_API_URL || '/';

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
  return request<User>('/api/auth?action=me');
}

export async function login(email: string, password: string): Promise<{ data: User | null; error: Error | null }> {
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
  return request<User[]>('/api/users');
}

export async function approveUser(id: string) {
  return request<User>(`/api/users?action=approve&id=${id}`, { method: 'POST' });
}

export async function updateUserRole(id: string, role: User['role']) {
  return request<User>(`/api/users?action=role&id=${id}`, {
    method: 'POST',
    body: JSON.stringify({ role }),
  });
}

export async function deleteUser(id: string) {
  return request<null>(`/api/users?action=delete&id=${id}`, { method: 'POST' });
}

export async function updatePassword(email: string, oldPassword: string, newPassword: string) {
  return changePassword(oldPassword, newPassword);
}

export async function resetPassword(email: string, newPassword: string) {
  return request<{ success: boolean }>(`/api/users?action=reset-password&id=${email}`, {
    method: 'POST',
    body: JSON.stringify({ newPassword }),
  });
}

// ============ 家庭管理 ============

export async function getFamilies(userId?: string) {
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
  return request<Module[]>('/api/common?action=modules');
}

// ============ 图书管理 ============

export async function getBooks(filters?: { keyword?: string; category?: string; module_id?: string }) {
  const params = new URLSearchParams();
  if (filters?.keyword) params.set('keyword', filters.keyword);
  if (filters?.category) params.set('category', filters.category);
  if (filters?.module_id) params.set('module_id', filters.module_id);
  
  const query = params.toString();
  return request<Book[]>(`/api/books${query ? `?${query}` : ''}`);
}

export async function getBookById(id: string) {
  return request<Book>(`/api/books?action=get&id=${id}`);
}

export async function createBook(bookData: Omit<Book, 'id' | 'created_at' | 'updated_at'>) {
  return request<Book>('/api/books?action=create', {
    method: 'POST',
    body: JSON.stringify(bookData),
  });
}

export async function updateBook(id: string, bookData: Partial<Book>) {
  return request<Book>(`/api/books?action=update&id=${id}`, {
    method: 'POST',
    body: JSON.stringify(bookData),
  });
}

export async function deleteBook(id: string) {
  return request<null>(`/api/books?action=delete&id=${id}`, { method: 'POST' });
}

// ============ 借阅记录 ============

export async function getBorrowRecords(userId?: string) {
  const query = userId ? `?user_id=${userId}` : '';
  return request<BorrowRecordWithBook[]>(`/api/borrow-records${query}`);
}

export async function createBorrowRecord(recordData: Omit<BorrowRecord, 'id' | 'created_at' | 'updated_at'>) {
  return request<BorrowRecord>('/api/borrow-records?action=create', {
    method: 'POST',
    body: JSON.stringify({ book_id: recordData.book_id, user_id: recordData.user_id, due_date: recordData.due_date }),
  });
}

export async function returnBook(recordId: string) {
  return request<BorrowRecord>(`/api/borrow-records?action=return&id=${recordId}`, { method: 'POST' });
}

// ============ 统计 ============

export async function getStats() {
  return request<{ total_books: number; available_books: number; total_borrowed: number; total_users: number }>('/api/common?action=stats');
}
