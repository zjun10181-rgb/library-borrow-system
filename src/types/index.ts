export type UserRole = 'student' | 'teacher' | 'parent' | 'admin';

export interface Family {
  id: string;
  name: string;
  head_of_family: string;
  members: string[];
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  password_hash?: string;
  name: string;
  role: UserRole;
  approved: boolean;
  family_id?: string;
  created_at: string;
  updated_at: string;
}

export type ModuleType = 'school' | 'family';

export interface Module {
  id: string;
  name: string;
  type: ModuleType;
  owner_id?: string;
  is_public: boolean;
  created_at: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  category?: string;
  isbn?: string;
  description?: string;
  cover_url?: string;
  total_copies: number;
  available_copies: number;
  module_id: string;
  created_at: string;
  updated_at: string;
}

export type BorrowStatus = 'borrowed' | 'returned' | 'overdue';

export interface BorrowRecord {
  id: string;
  book_id: string;
  user_id: string;
  borrow_date: string;
  due_date: string;
  return_date?: string;
  status: BorrowStatus;
  created_at: string;
  updated_at?: string;
}

export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  email: string;
  password: string;
  name: string;
  role: UserRole;
}

export interface BookFormData {
  title: string;
  author: string;
  category?: string;
  isbn?: string;
  description?: string;
  cover_url?: string;
  total_copies: number;
  module_id: string;
}

export interface BorrowFormData {
  book_id: string;
  user_id: string;
  due_date: string;
}

export interface SearchFilters {
  keyword?: string;
  category?: string;
  status?: 'available' | 'borrowed';
  module_id?: string;
}

export interface Statistics {
  total_books: number;
  total_borrowed: number;
  total_users: number;
  monthly_borrows: number[];
  top_categories: { name: string; count: number }[];
}