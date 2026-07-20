import { create } from 'zustand';
import type { User } from '@/types';
import { getCurrentUser, logout as apiLogout } from '@/utils/supabase';

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  initialize: () => void;
  logout: () => Promise<void>;
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
      const result = await getCurrentUser();
      if (result.data) {
        set({ user: result.data, isAuthenticated: result.data.approved });
      }
    } catch (error) {
      console.log('Auth initialize skipped:', error);
    }
    set({ isLoading: false });
  },
  
  logout: async () => {
    await apiLogout();
    set({ user: null, isAuthenticated: false });
  },
  
  isAdmin: () => {
    const { user } = get();
    return user?.role === 'admin';
  },
}));
