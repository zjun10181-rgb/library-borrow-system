import { createClient } from '@supabase/supabase-js';
import type { User, Book, BorrowRecord, Family, Module, BorrowRecordWithBook } from '@/types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export function isSupabaseConfigured() {
  return !!supabaseUrl && !!supabaseAnonKey;
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: null };
  
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', user.email)
    .single();
  
  return { data, error };
}

export async function login(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      console.error('Supabase Auth 登录失败:', error.message);
      
      if (error.message.includes('Invalid login credentials')) {
        if (email === 'admin@library.com' && password === 'admin123') {
          const { data: registerData, error: registerError } = await supabase.auth.signUp({ 
            email: 'admin@library.com', 
            password: 'admin123',
            options: { data: { name: '管理员', role: 'admin' } }
          });
          
          if (registerError && !registerError.message.includes('already registered')) {
            return { data: null, error: registerError };
          }
          
          const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({ email, password });
          if (loginError) return { data: null, error: loginError };
          
          const adminUser = {
            id: loginData.user!.id,
            email: loginData.user!.email!,
            name: '管理员',
            role: 'admin' as User['role'],
            approved: true,
            created_at: new Date().toISOString().split('T')[0],
            updated_at: new Date().toISOString().split('T')[0],
          };
          
          await supabase.from('users').upsert(adminUser);
          return { data: adminUser, error: null };
        }
      }
      
      return { data: null, error };
    }
    
    if (!data.user) return { data: null, error: new Error('登录失败') };
    
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (userData) {
      return { data: userData, error: null };
    }
    
    const fallbackUser = {
      id: data.user.id,
      email: data.user.email!,
      name: data.user.email!.split('@')[0],
      role: 'student' as User['role'],
      approved: true,
      created_at: new Date().toISOString().split('T')[0],
      updated_at: new Date().toISOString().split('T')[0],
    };
    
    const { error: insertError } = await supabase
      .from('users')
      .insert(fallbackUser);
    
    if (insertError) {
      console.warn('创建用户记录失败:', insertError);
    }
    
    return { data: fallbackUser, error: null };
  } catch (e) {
    console.error('登录异常:', e);
    return { data: null, error: e as Error };
  }
}

export async function logout() {
  return await supabase.auth.signOut();
}

export async function signUp(email: string, password: string, name: string, role: User['role']) {
  const { data, error } = await supabase.auth.signUp({ email, password, options: {
    data: { name, role }
  }});
  
  if (error) return { data: null, error };
  
  const newUser: User = {
    id: data.user?.id || `user_${Date.now()}`,
    email,
    name,
    role,
    approved: role === 'admin',
    created_at: new Date().toISOString().split('T')[0],
    updated_at: new Date().toISOString().split('T')[0],
  };
  
  const { error: insertError } = await supabase
    .from('users')
    .insert(newUser);
  
  return { data: newUser, error: insertError };
}

export async function insertUser(userData: { id: string; email: string; name: string; role: User['role'] }) {
  const { data, error } = await supabase.auth.signUp({ 
    email: userData.email, 
    password: 'password123',
    options: { data: { name: userData.name, role: userData.role } }
  });
  
  if (error) return { data: null, error };
  
  const newUser: User = {
    ...userData,
    approved: true,
    created_at: new Date().toISOString().split('T')[0],
    updated_at: new Date().toISOString().split('T')[0],
  };
  
  const { error: insertError } = await supabase
    .from('users')
    .insert(newUser);
  
  return { data: newUser, error: insertError };
}

export async function getUserByEmail(email: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();
  return { data, error };
}

export async function getModules() {
  const { data, error } = await supabase
    .from('modules')
    .select('*');
  return { data: data as Module[], error };
}

export async function getBooks(filters?: { keyword?: string; category?: string; module_id?: string }) {
  let query = supabase.from('books').select('*');
  if (filters?.module_id) {
    query = query.eq('module_id', filters.module_id);
  }
  if (filters?.category) {
    query = query.eq('category', filters.category);
  }
  if (filters?.keyword) {
    query = query.or(`title.ilike.%${filters.keyword}%,author.ilike.%${filters.keyword}%`);
  }
  const { data, error } = await query;
  return { data: data as Book[], error };
}

export async function getBookById(id: string) {
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .eq('id', id)
    .single();
  return { data: data as Book, error };
}

export async function createBook(bookData: Omit<Book, 'id' | 'created_at' | 'updated_at'>) {
  const newBook: Book = {
    ...bookData,
    id: `book_${Date.now()}`,
    created_at: new Date().toISOString().split('T')[0],
    updated_at: new Date().toISOString().split('T')[0],
  };
  const { data, error } = await supabase
    .from('books')
    .insert(newBook)
    .select()
    .single();
  return { data: data as Book, error };
}

export async function updateBook(id: string, bookData: Partial<Book>) {
  const { data, error } = await supabase
    .from('books')
    .update({ ...bookData, updated_at: new Date().toISOString().split('T')[0] })
    .eq('id', id)
    .select()
    .single();
  return { data: data as Book, error };
}

export async function deleteBook(id: string) {
  return await supabase
    .from('books')
    .delete()
    .eq('id', id);
}

export async function getBorrowRecords(userId?: string) {
  let query = supabase.from('borrow_records').select('*, books(*)');
  if (userId) {
    query = query.eq('user_id', userId);
  }
  const { data, error } = await query;
  return { data: data as BorrowRecordWithBook[], error };
}

export async function createBorrowRecord(recordData: Omit<BorrowRecord, 'id' | 'created_at' | 'updated_at'>) {
  const newRecord: BorrowRecord = {
    ...recordData,
    id: `borrow_${Date.now()}`,
    created_at: new Date().toISOString().split('T')[0],
    updated_at: new Date().toISOString().split('T')[0],
  };
  
  const { error: updateError } = await supabase
    .from('books')
    .update({ available_copies: supabase.rpc('decrement', { table: 'books', column: 'available_copies', id: recordData.book_id }) })
    .eq('id', recordData.book_id);
  
  if (updateError) return { data: null, error: updateError };
  
  const { data, error } = await supabase
    .from('borrow_records')
    .insert(newRecord)
    .select()
    .single();
  
  return { data: data as BorrowRecord, error };
}

export async function returnBook(recordId: string) {
  const { data: record, error: recordError } = await supabase
    .from('borrow_records')
    .select('book_id')
    .eq('id', recordId)
    .single();
  
  if (recordError) return { data: null, error: recordError };
  
  const { error: updateError } = await supabase
    .from('books')
    .update({ available_copies: supabase.rpc('increment', { table: 'books', column: 'available_copies', id: record.book_id }) })
    .eq('id', record.book_id);
  
  if (updateError) return { data: null, error: updateError };
  
  const { data, error } = await supabase
    .from('borrow_records')
    .update({ 
      return_date: new Date().toISOString().split('T')[0], 
      status: 'returned',
      updated_at: new Date().toISOString().split('T')[0]
    })
    .eq('id', recordId)
    .select()
    .single();
  
  return { data: data as BorrowRecord, error };
}

export async function getUsers() {
  const { data, error } = await supabase
    .from('users')
    .select('*');
  return { data: data as User[], error };
}

export async function approveUser(id: string) {
  const { data, error } = await supabase
    .from('users')
    .update({ approved: true, updated_at: new Date().toISOString().split('T')[0] })
    .eq('id', id)
    .select()
    .single();
  return { data: data as User, error };
}

export async function updateUserRole(id: string, role: User['role']) {
  const { data, error } = await supabase
    .from('users')
    .update({ role, updated_at: new Date().toISOString().split('T')[0] })
    .eq('id', id)
    .select()
    .single();
  return { data: data as User, error };
}

export async function deleteUser(id: string) {
  return await supabase
    .from('users')
    .delete()
    .eq('id', id);
}

export async function getFamilies(userId?: string) {
  let query = supabase.from('families').select('*');
  if (userId) {
    const { data: user } = await supabase.from('users').select('family_id').eq('id', userId).single();
    if (user?.family_id) {
      query = query.eq('id', user.family_id);
    }
  }
  const { data, error } = await query;
  return { data: data as Family[], error };
}

export async function getFamilyById(id: string) {
  const { data, error } = await supabase
    .from('families')
    .select('*')
    .eq('id', id)
    .single();
  return { data: data as Family, error };
}

export async function createFamily(familyData: Omit<Family, 'id' | 'created_at' | 'updated_at'>) {
  const newFamily: Family = {
    ...familyData,
    id: `family_${Date.now()}`,
    created_at: new Date().toISOString().split('T')[0],
    updated_at: new Date().toISOString().split('T')[0],
  };
  const { data, error } = await supabase
    .from('families')
    .insert(newFamily)
    .select()
    .single();
  return { data: data as Family, error };
}

export async function addFamilyMember(familyId: string, userId: string) {
  const { data, error } = await supabase
    .from('users')
    .update({ family_id: familyId, updated_at: new Date().toISOString().split('T')[0] })
    .eq('id', userId)
    .select()
    .single();
  return { data: data as User, error };
}

export async function getFamilyBooks(familyId: string) {
  const { data, error } = await supabase
    .from('family_books')
    .select('*, books(*)')
    .eq('family_id', familyId);
  return { data: data as { books: Book }[], error };
}

export async function updatePassword(email: string, oldPassword: string, newPassword: string) {
  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password: oldPassword });
  if (signInError) return { data: null, error: signInError };
  
  const { data, error } = await supabase.auth.updateUser({ password: newPassword });
  return { data: { success: true }, error };
}

export async function resetPassword(email: string, newPassword: string) {
  const { data, error } = await supabase.auth.admin.updateUserById(email, { password: newPassword });
  return { data: { success: true }, error };
}