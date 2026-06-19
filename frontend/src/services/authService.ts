import api from './api';
import { API_ENDPOINTS } from '../config/apiConfig';

export interface LoginPayload { email: string; password: string }
export interface RegisterPayload {
  companyName: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  tenantId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  roles?: string[];
  permissions?: string[];
}

// Persist tokens + user under the keys the axios interceptor expects.
function persistSession(data: any) {
  if (data?.accessToken) localStorage.setItem('accessToken', data.accessToken);
  if (data?.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
  if (data?.user) {
    localStorage.setItem('user', JSON.stringify(data.user));
    if (data.user.tenantId) localStorage.setItem('tenantId', data.user.tenantId);
  }
}

export const authService = {
  async login(payload: LoginPayload): Promise<AuthUser> {
    const res = await api.post(API_ENDPOINTS.AUTH.LOGIN, payload);
    const data = res.data.data ?? res.data;
    persistSession(data);
    return data.user;
  },

  async register(payload: RegisterPayload): Promise<AuthUser> {
    const res = await api.post(API_ENDPOINTS.AUTH.REGISTER, payload);
    const data = res.data.data ?? res.data;
    persistSession(data);
    return data.user;
  },

  async logout(): Promise<void> {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      await api.post(API_ENDPOINTS.AUTH.LOGOUT, { refreshToken });
    } catch {
      /* ignore network errors on logout */
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      localStorage.removeItem('tenantId');
    }
  },

  getCurrentUser(): AuthUser | null {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('accessToken');
  },
};
