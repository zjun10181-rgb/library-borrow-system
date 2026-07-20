import type { User, Book, Module, BorrowRecord, Family } from '@/types';
import { mockUsers, mockBooks, mockModules, mockBorrowRecords, mockPasswords, mockFamilies } from './mockData';

const STORAGE_KEYS = {
  books: 'library_books',
  modules: 'library_modules',
  borrowRecords: 'library_borrow_records',
  users: 'library_users',
  families: 'library_families',
};

function loadData<T>(key: string, defaultValue: T[]): T[] {
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load data from localStorage:', e);
  }
  return [...defaultValue];
}

function saveData<T>(key: string, data: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save data to localStorage:', e);
  }
}

let users: User[] = loadData(STORAGE_KEYS.users, mockUsers);
let books: Book[] = loadData(STORAGE_KEYS.books, mockBooks);
let modules: Module[] = loadData(STORAGE_KEYS.modules, mockModules);
let borrowRecords: BorrowRecord[] = loadData(STORAGE_KEYS.borrowRecords, mockBorrowRecords);
let passwords: Record<string, string> = loadPasswords();
let families: Family[] = loadData(STORAGE_KEYS.families, mockFamilies);

function loadPasswords(): Record<string, string> {
  try {
    const stored = localStorage.getItem('library_passwords');
    if (stored) {
      return { ...mockPasswords, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.error('Failed to load passwords from localStorage:', e);
  }
  return { ...mockPasswords };
}

function savePasswords(data: Record<string, string>): void {
  try {
    localStorage.setItem('library_passwords', JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save passwords to localStorage:', e);
  }
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function getCurrentUser() {
  await delay(100);
  const token = localStorage.getItem('auth_token');
  if (!token) return null;
  try {
    const decoded = JSON.parse(atob(token));
    return { email: decoded.email, id: decoded.id };
  } catch {
    return null;
  }
}

export async function login(email: string, password: string) {
  await delay(300);
  const storedPassword = passwords[email];
  if (storedPassword === password) {
    const user = users.find(u => u.email === email);
    if (user) {
      const token = btoa(JSON.stringify({ email: user.email, id: user.id }));
      localStorage.setItem('auth_token', token);
      return { data: { user: { email: user.email, id: user.id } }, error: null };
    }
  }
  return { data: null, error: { message: 'Invalid credentials' } };
}

export async function logout() {
  localStorage.removeItem('auth_token');
  return { error: null };
}

export async function signUp(email: string, password: string) {
  await delay(300);
  if (passwords[email]) {
    return { data: null, error: { message: 'User already registered' } };
  }
  passwords[email] = password;
  savePasswords(passwords);
  return { data: { user: { email, id: `user_${Date.now()}` } }, error: null };
}

export async function updatePassword(email: string, oldPassword: string, newPassword: string) {
  await delay(100);
  const storedPassword = passwords[email];
  if (!storedPassword) {
    return { data: null, error: { message: 'User not found' } };
  }
  if (storedPassword !== oldPassword) {
    return { data: null, error: { message: 'Old password is incorrect' } };
  }
  passwords[email] = newPassword;
  savePasswords(passwords);
  return { data: { success: true }, error: null };
}

export async function resetPassword(email: string, newPassword: string) {
  await delay(100);
  if (!passwords[email]) {
    return { data: null, error: { message: 'User not found' } };
  }
  passwords[email] = newPassword;
  savePasswords(passwords);
  return { data: { success: true }, error: null };
}

export async function insertUser(userData: { id: string; email: string; name: string; role: User['role'] }) {
  await delay(100);
  const newUser: User = {
    ...userData,
    approved: false,
    created_at: new Date().toISOString().split('T')[0],
    updated_at: new Date().toISOString().split('T')[0],
  };
  users.push(newUser);
  saveData(STORAGE_KEYS.users, users);
  return { data: newUser, error: null };
}

export async function getUserByEmail(email: string) {
  await delay(100);
  const user = users.find(u => u.email === email);
  return { data: user || null, error: null };
}

export async function getModules() {
  await delay(100);
  return { data: modules, error: null };
}

export async function getBooks(filters?: { keyword?: string; category?: string; module_id?: string }) {
  await delay(100);
  let result = [...books];
  
  if (filters?.keyword) {
    const keyword = filters.keyword.toLowerCase();
    result = result.filter(book => 
      book.title.toLowerCase().includes(keyword) ||
      book.author.toLowerCase().includes(keyword)
    );
  }
  if (filters?.category) {
    result = result.filter(book => book.category === filters.category);
  }
  if (filters?.module_id) {
    result = result.filter(book => book.module_id === filters.module_id);
  }
  
  return { data: result.reverse(), error: null };
}

export async function getBookById(id: string) {
  await delay(100);
  const book = books.find(b => b.id === id);
  return { data: book || null, error: null };
}

export async function createBook(bookData: {
  title: string;
  author: string;
  category?: string;
  isbn?: string;
  description?: string;
  cover_url?: string;
  total_copies: number;
  available_copies: number;
  module_id: string;
}) {
  await delay(100);
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

export async function updateBook(id: string, bookData: Partial<{
  title: string;
  author: string;
  category: string;
  isbn: string;
  description: string;
  cover_url: string;
  total_copies: number;
  available_copies: number;
}>) {
  await delay(100);
  const index = books.findIndex(b => b.id === id);
  if (index !== -1) {
    books[index] = { ...books[index], ...bookData, updated_at: new Date().toISOString().split('T')[0] };
    saveData(STORAGE_KEYS.books, books);
    return { data: books[index], error: null };
  }
  return { data: null, error: { message: 'Book not found' } };
}

export async function deleteBook(id: string) {
  await delay(100);
  const index = books.findIndex(b => b.id === id);
  if (index !== -1) {
    books.splice(index, 1);
    saveData(STORAGE_KEYS.books, books);
    return { data: [], error: null };
  }
  return { data: null, error: { message: 'Book not found' } };
}

export async function getBorrowRecords(userId?: string) {
  await delay(100);
  let result = borrowRecords.map(record => ({
    ...record,
    books: books.find(b => b.id === record.book_id),
    users: users.find(u => u.id === record.user_id),
  }));
  
  if (userId) {
    result = result.filter(record => record.user_id === userId);
  }
  
  return { data: result.reverse(), error: null };
}

export async function createBorrowRecord(borrowData: {
  book_id: string;
  user_id: string;
  borrow_date: string;
  due_date: string;
  status: BorrowRecord['status'];
}) {
  await delay(100);
  const newRecord: BorrowRecord = {
    ...borrowData,
    id: `borrow_${Date.now()}`,
    return_date: null,
    created_at: new Date().toISOString().split('T')[0],
    updated_at: new Date().toISOString().split('T')[0],
  };
  borrowRecords.push(newRecord);
  saveData(STORAGE_KEYS.borrowRecords, borrowRecords);
  return { data: newRecord, error: null };
}

export async function returnBook(id: string) {
  await delay(100);
  const index = borrowRecords.findIndex(b => b.id === id);
  if (index !== -1) {
    borrowRecords[index] = { 
      ...borrowRecords[index], 
      return_date: new Date().toISOString().split('T')[0], 
      status: 'returned',
      updated_at: new Date().toISOString().split('T')[0],
    };
    saveData(STORAGE_KEYS.borrowRecords, borrowRecords);
    return { data: borrowRecords[index], error: null };
  }
  return { data: null, error: { message: 'Borrow record not found' } };
}

export async function getUsers() {
  await delay(100);
  return { data: users, error: null };
}

export async function approveUser(id: string) {
  await delay(100);
  const index = users.findIndex(u => u.id === id);
  if (index !== -1) {
    users[index] = { ...users[index], approved: true, updated_at: new Date().toISOString().split('T')[0] };
    saveData(STORAGE_KEYS.users, users);
    return { data: users[index], error: null };
  }
  return { data: null, error: { message: 'User not found' } };
}

export async function updateUserRole(id: string, role: User['role']) {
  await delay(100);
  const index = users.findIndex(u => u.id === id);
  if (index !== -1) {
    users[index] = { ...users[index], role, updated_at: new Date().toISOString().split('T')[0] };
    saveData(STORAGE_KEYS.users, users);
    return { data: users[index], error: null };
  }
  return { data: null, error: { message: 'User not found' } };
}

export async function deleteUser(id: string) {
  await delay(100);
  const index = users.findIndex(u => u.id === id);
  if (index !== -1) {
    users.splice(index, 1);
    saveData(STORAGE_KEYS.users, users);
    return { data: [], error: null };
  }
  return { data: null, error: { message: 'User not found' } };
}

export async function getFamilies(userId?: string) {
  await delay(100);
  let result = [...families];
  
  if (userId) {
    result = result.filter(family => 
      family.members.includes(userId) || family.head_of_family === userId
    );
  }
  
  return { data: result, error: null };
}

export async function getFamilyById(id: string) {
  await delay(100);
  const family = families.find(f => f.id === id);
  return { data: family || null, error: null };
}

export async function createFamily(familyData: {
  name: string;
  head_of_family: string;
}) {
  await delay(100);
  const newFamily: Family = {
    ...familyData,
    id: `family_${Date.now()}`,
    members: [familyData.head_of_family],
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
  
  const userIndex = users.findIndex(u => u.id === familyData.head_of_family);
  if (userIndex !== -1) {
    users[userIndex] = { ...users[userIndex], family_id: newFamily.id, updated_at: new Date().toISOString().split('T')[0] };
    saveData(STORAGE_KEYS.users, users);
  }
  
  return { data: { family: newFamily, module: familyModule }, error: null };
}

export async function addFamilyMember(familyId: string, userId: string) {
  await delay(100);
  const familyIndex = families.findIndex(f => f.id === familyId);
  if (familyIndex !== -1) {
    if (!families[familyIndex].members.includes(userId)) {
      families[familyIndex].members.push(userId);
      saveData(STORAGE_KEYS.families, families);
    }
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
      users[userIndex] = { ...users[userIndex], family_id: familyId, updated_at: new Date().toISOString().split('T')[0] };
      saveData(STORAGE_KEYS.users, users);
    }
    return { data: families[familyIndex], error: null };
  }
  return { data: null, error: { message: 'Family not found' } };
}

export async function getFamilyBooks(familyId: string) {
  await delay(100);
  const familyModules = modules.filter(m => m.type === 'family' && m.owner_id === familyId);
  const familyBookIds = familyModules.map(m => m.id);
  const familyBooks = books.filter(b => familyBookIds.includes(b.module_id));
  return { data: familyBooks, error: null };
}
