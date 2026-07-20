import { create } from 'zustand';
import type { User } from '@/types';
import { getCurrentUser, getUserByEmail } from '@/utils/supabase';

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  initialize: () => void;
  login: () => void;
  logout: () => void;
  isAdmin: () => boolean;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  
  setUser: (user) => set({ 
    user, 
    isAuthenticated: user !== null && user.approved 
  }),
  
  setLoading: (loading) => set({ isLoading: loading }),
  
  initialize: async () => {
    try {
      const authUser = await Promise.race([
        getCurrentUser(),
        new Promise<null>((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000))
      ]);
      if (authUser && 'email' in authUser) {
        const { data: userData } = await getUserByEmail(authUser.email);
        if (userData) {
          set({ user: userData, isAuthenticated: userData.approved });
        }
      }
    } catch (error) {
      console.log('Auth initialize skipped:', error);
    }
    set({ isLoading: false });
  },
  
  login: () => set({ isAuthenticated: true }),
  
  logout: () => set({ user: null, isAuthenticated: false }),
  
  isAdmin: () => {
    const { user } = get();
    return user?.role === 'admin';
  },
}));