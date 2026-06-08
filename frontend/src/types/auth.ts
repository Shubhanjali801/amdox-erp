export interface User {
  id: string; tenantId: string; email: string;
  firstName: string; lastName: string;
  role: 'super_admin' | 'tenant_admin' | 'manager' | 'viewer';
  isActive: boolean; isMfaEnabled: boolean;
}
export interface LoginRequest  { email: string; password: string; }
export interface LoginResponse { accessToken: string; refreshToken: string; user: User; }
export interface TokenPayload  { sub: string; tenantId: string; email: string; roles: string[]; exp: number; }
