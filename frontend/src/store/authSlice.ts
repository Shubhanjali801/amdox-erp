import { create } from 'zustand';

interface AuthState {
  user:        any | null;
  token:       string | null;
  isLoggedIn:  boolean;
  setUser:     (user: any, token: string) => void;
  clearAuth:   () => void;
}

const STORED_USER = (() => {
  try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; }
})();

export const useAuthStore = create<AuthState>()(set => ({
  user:       STORED_USER,
  token:      localStorage.getItem('accessToken'),
  isLoggedIn: !!localStorage.getItem('accessToken'),
  setUser:    (user, token) => {
    localStorage.setItem('accessToken', token);
    localStorage.setItem('user', JSON.stringify(user));
    set({ user, token, isLoggedIn: true });
  },
  clearAuth:  () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('tenantId');
    set({ user: null, token: null, isLoggedIn: false });
  },
}));
