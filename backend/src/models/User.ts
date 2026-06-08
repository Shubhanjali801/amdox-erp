export interface IUser {
  id: string; tenantId: string; email: string; passwordHash: string;
  firstName: string; lastName: string; phone?: string; avatar?: string;
  isActive: boolean; isMfaEnabled: boolean; mfaSecret?: string;
  lastLoginAt?: Date; createdAt: Date; updatedAt: Date;
}
