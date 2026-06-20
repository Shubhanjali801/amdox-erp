import api from './api';
import { API_ENDPOINTS } from '../config/apiConfig';

export interface LoginPayload { email: string; password: string; mfaToken?: string }
export interface LoginResult { user?: AuthUser; mfaRequired?: boolean }
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
  async login(payload: LoginPayload): Promise<LoginResult> {
    const res = await api.post(API_ENDPOINTS.AUTH.LOGIN, payload);
    // MFA: backend returns 200 with { success:false, mfaRequired:true }
    if (res.data?.mfaRequired) return { mfaRequired: true };
    const data = res.data.data ?? res.data;
    persistSession(data);
    return { user: data.user };
  },

  // ── MFA management ──
  async mfaSetup(): Promise<{ qrDataUrl: string; secret: string; otpauthUrl: string }> {
    const res = await api.post('/auth/mfa/setup');
    return res.data.data ?? res.data;
  },
  async mfaEnable(token: string): Promise<void> {
    await api.post('/auth/mfa/enable', { token });
  },
  async mfaDisable(token: string): Promise<void> {
    await api.post('/auth/mfa/disable', { token });
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

  async forgotPassword(email: string): Promise<void> {
    await api.post('/auth/forgot-password', { email });
  },

  async resetPassword(token: string, newPassword: string): Promise<void> {
    await api.post('/auth/reset-password', { token, newPassword });
  },

  getCurrentUser(): AuthUser | null {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('accessToken');
  },
};
