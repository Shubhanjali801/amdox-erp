import { create } from 'zustand';

interface AuthState {
  user:        any | null;
  token:       string | null;
  isLoggedIn:  boolean;
  setUser:     (user: any, token: string) => void;
  clearAuth:   () => void;
}

export const useAuthStore = create<AuthState>()(set => ({
  user:       null,
  token:      localStorage.getItem('access_token'),
  isLoggedIn: !!localStorage.getItem('access_token'),
  setUser:    (user, token) => { localStorage.setItem('access_token', token); set({ user, token, isLoggedIn: true }); },
  clearAuth:  () => { localStorage.removeItem('access_token'); set({ user: null, token: null, isLoggedIn: false }); },
}));
