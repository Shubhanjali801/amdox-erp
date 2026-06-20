import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { ENV } from '../config/env';
import prisma from '../config/database';
import redisClient from '../config/redis';
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';

// Verify a 6-digit TOTP code against a base32 secret (±1 time-step tolerance)
const verifyTotp = (secret: string, token: string) =>
  speakeasy.totp.verify({ secret, encoding: 'base32', token, window: 1 });
import { logger } from '../utils/logger';
import { emailService } from './common/emailService';

// ─── Types ────────────────────────────────────────────────

export interface RegisterInput {
  firstName:    string;
  lastName:     string;
  email:        string;
  password:     string;
  companyName:  string;
  companySlug?: string;
}

export interface LoginInput {
  email:    string;
  password: string;
  mfaToken?: string;   // 6-digit TOTP code, required when MFA is enabled
  ipAddress?: string;
  userAgent?: string;
}

export interface TokenPayload {
  userId:      string;
  tenantId:    string;
  email:       string;
  roles:       string[];
  permissions: string[];
}

export interface AuthTokens {
  accessToken:  string;
  refreshToken: string;
  expiresIn:    number; // seconds
}

// ─── Auth Service ─────────────────────────────────────────

export const authService = {

  // ── Password ────────────────────────────────────────────

  hashPassword: (password: string): Promise<string> =>
    bcrypt.hash(password, 12),

  comparePassword: (password: string, hash: string): Promise<boolean> =>
    bcrypt.compare(password, hash),

  // ── Tokens ──────────────────────────────────────────────

  signAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, ENV.JWT_SECRET, {
      expiresIn: ENV.JWT_EXPIRES_IN || '15m',
    } as jwt.SignOptions);
  },

  signRefreshToken(payload: { userId: string; tenantId: string }): string {
    return jwt.sign(payload, ENV.JWT_REFRESH_SECRET, {
      expiresIn: ENV.JWT_REFRESH_EXPIRES_IN || '7d',
    } as jwt.SignOptions);
  },

  verifyAccessToken(token: string): TokenPayload {
    return jwt.verify(token, ENV.JWT_SECRET) as TokenPayload;
  },

  verifyRefreshToken(token: string): { userId: string; tenantId: string } {
    return jwt.verify(token, ENV.JWT_REFRESH_SECRET) as { userId: string; tenantId: string };
  },

  generateRefreshTokenString(): string {
    return crypto.randomBytes(64).toString('hex');
  },

  // ── Register ────────────────────────────────────────────

  async register(input: RegisterInput) {
    const { firstName, lastName, email, password, companyName, companySlug } = input;

    // 1. Check email not already taken
    const existing = await prisma.user.findFirst({ where: { email } });
    if (existing) {
      throw new Error('EMAIL_TAKEN');
    }

    // 2. Generate a base slug from the company name (or provided slug)
    const baseSlug = (companySlug || companyName)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // If a custom slug was explicitly provided and it's taken, reject it.
    if (companySlug) {
      const taken = await prisma.tenant.findUnique({ where: { slug: baseSlug } });
      if (taken) throw new Error('SLUG_TAKEN');
    }

    // Otherwise auto-generate a UNIQUE slug so the same company NAME is allowed.
    // e.g. "amdox", "amdox-2", "amdox-3" ... (like Slack workspaces)
    let slug = baseSlug;
    let suffix = 1;
    // eslint-disable-next-line no-await-in-loop
    while (await prisma.tenant.findUnique({ where: { slug } })) {
      suffix += 1;
      slug = `${baseSlug}-${suffix}`;
    }

    // 3. Hash password
    const passwordHash = await authService.hashPassword(password);

    // 4. Create Tenant + User + Roles in one transaction
    const result = await prisma.$transaction(async (tx) => {

      // Create tenant
      const tenant = await tx.tenant.create({
        data: {
          name:     companyName,
          slug,
          plan:     'STARTER',
          isActive: true,
          settings: {},
        },
      });

      // Create user
      const user = await tx.user.create({
        data: {
          tenantId:     tenant.id,
          email,
          passwordHash,
          firstName,
          lastName,
          isActive:     true,
          mfaEnabled:   false,
        },
      });

      // Create default roles for tenant
      const adminRole = await tx.role.create({
        data: {
          tenantId: tenant.id,
          name:     'tenant_admin',
          isSystem: true,
        },
      });

      await tx.role.createMany({
        data: [
          { tenantId: tenant.id, name: 'manager',  isSystem: true },
          { tenantId: tenant.id, name: 'viewer',   isSystem: true },
        ],
      });

      // Assign tenant_admin role to first user
      await tx.userRole.create({
        data: { userId: user.id, roleId: adminRole.id },
      });

      // Create default permissions
      const permissions = [
        { resource: 'finance',      action: 'read'    },
        { resource: 'finance',      action: 'write'   },
        { resource: 'finance',      action: 'approve' },
        { resource: 'hr',           action: 'read'    },
        { resource: 'hr',           action: 'write'   },
        { resource: 'hr',           action: 'approve' },
        { resource: 'supply',       action: 'read'    },
        { resource: 'supply',       action: 'write'   },
        { resource: 'supply',       action: 'approve' },
        { resource: 'payroll',      action: 'read'    },
        { resource: 'payroll',      action: 'approve' },
        { resource: 'projects',     action: 'read'    },
        { resource: 'projects',     action: 'write'   },
        { resource: 'dashboard',    action: 'read'    },
        { resource: 'audit',        action: 'read'    },
        { resource: 'users',        action: 'read'    },
        { resource: 'users',        action: 'write'   },
      ];

      for (const perm of permissions) {
        const p = await tx.permission.upsert({
          where:  { resource_action: perm },
          update: {},
          create: perm,
        });
        await tx.rolePermission.upsert({
          where:  { roleId_permissionId: { roleId: adminRole.id, permissionId: p.id } },
          update: {},
          create: { roleId: adminRole.id, permissionId: p.id },
        });
      }

      return { tenant, user, role: adminRole };
    });

    logger.info(`New tenant registered: ${result.tenant.slug} | user: ${result.user.email}`);
    return result;
  },

  // ── Login ────────────────────────────────────────────────

  async login(input: LoginInput): Promise<{ user: any; tokens: AuthTokens }> {
    const { email, password, ipAddress, userAgent } = input;

    // 1. Find user by email
    const user = await prisma.user.findFirst({
      where:   { email, deletedAt: null },
      include: {
        tenant:    true,
        userRoles: {
          include: {
            role: {
              include: {
                permissions: { include: { permission: true } },
              },
            },
          },
        },
      },
    });

    if (!user) throw new Error('INVALID_CREDENTIALS');
    if (!user.isActive) throw new Error('ACCOUNT_INACTIVE');
    if (!user.tenant.isActive) throw new Error('TENANT_INACTIVE');

    // 2. Verify password
    const valid = await authService.comparePassword(password, user.passwordHash);
    if (!valid) throw new Error('INVALID_CREDENTIALS');

    // 2b. MFA challenge — if enabled, a valid TOTP code is required
    if (user.mfaEnabled) {
      if (!input.mfaToken) throw new Error('MFA_REQUIRED');
      if (!verifyTotp(user.mfaSecret || '', input.mfaToken)) throw new Error('INVALID_MFA_TOKEN');
    }

    // 3. Build roles + permissions arrays
    const roles = user.userRoles.map((ur: any) => ur.role.name);
    const permissions = user.userRoles.flatMap((ur: any) =>
      ur.role.permissions.map((rp: any) => `${rp.permission.resource}:${rp.permission.action}`)
    );

    // 4. Sign tokens
    const payload: TokenPayload = {
      userId:   user.id,
      tenantId: user.tenantId,
      email:    user.email,
      roles,
      permissions,
    };

    const accessToken  = authService.signAccessToken(payload);
    const refreshToken = authService.generateRefreshTokenString();
    const expiresIn    = 15 * 60; // 15 minutes in seconds

    // 5. Save session
    await prisma.session.create({
      data: {
        userId:       user.id,
        refreshToken,
        ipAddress:    ipAddress || null,
        userAgent:    userAgent || null,
        expiresAt:    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    // 6. Update last login
    await prisma.user.update({
      where: { id: user.id },
      data:  { lastLoginAt: new Date() },
    });

    // 7. Audit log
    await prisma.auditLog.create({
      data: {
        tenantId:   user.tenantId,
        userId:     user.id,
        action:     'LOGIN',
        resource:   'auth',
        resourceId: user.id,
        ipAddress:  ipAddress || null,
        userAgent:  userAgent || null,
      },
    });

    logger.info(`User logged in: ${user.email} | tenant: ${user.tenant.slug}`);

    return {
      user: {
        id:        user.id,
        tenantId:  user.tenantId,
        email:     user.email,
        firstName: user.firstName,
        lastName:  user.lastName,
        avatarUrl: user.avatarUrl,
        roles,
        permissions,
        tenant: {
          id:   user.tenant.id,
          name: user.tenant.name,
          slug: user.tenant.slug,
          plan: user.tenant.plan,
        },
      },
      tokens: { accessToken, refreshToken, expiresIn },
    };
  },

  // ── Refresh Token ────────────────────────────────────────

  async refresh(refreshToken: string): Promise<AuthTokens> {
    // 1. Find session
    const session = await prisma.session.findUnique({
      where:   { refreshToken },
      include: {
        user: {
          include: {
            userRoles: {
              include: {
                role: {
                  include: {
                    permissions: { include: { permission: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!session)                          throw new Error('INVALID_REFRESH_TOKEN');
    if (session.expiresAt < new Date())    throw new Error('REFRESH_TOKEN_EXPIRED');
    if (!session.user.isActive)            throw new Error('ACCOUNT_INACTIVE');

    const roles = session.user.userRoles.map((ur: any) => ur.role.name);
    const permissions = session.user.userRoles.flatMap((ur: any) =>
      ur.role.permissions.map((rp: any) => `${rp.permission.resource}:${rp.permission.action}`)
    );

    // 2. Sign new access token
    const payload: TokenPayload = {
      userId:   session.user.id,
      tenantId: session.user.tenantId,
      email:    session.user.email,
      roles,
      permissions,
    };

    const newAccessToken  = authService.signAccessToken(payload);
    const newRefreshToken = authService.generateRefreshTokenString();

    // 3. Rotate refresh token (invalidate old, create new)
    await prisma.session.delete({ where: { refreshToken } });
    await prisma.session.create({
      data: {
        userId:       session.userId,
        refreshToken: newRefreshToken,
        ipAddress:    session.ipAddress,
        userAgent:    session.userAgent,
        expiresAt:    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return {
      accessToken:  newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn:    15 * 60,
    };
  },

  // ── Logout ───────────────────────────────────────────────

  async logout(refreshToken: string, userId: string): Promise<void> {
    await prisma.session.deleteMany({
      where: { refreshToken, userId },
    });

    await prisma.auditLog.create({
      data: {
        tenantId:   (await prisma.user.findUnique({ where: { id: userId }, select: { tenantId: true } }))!.tenantId,
        userId,
        action:     'LOGOUT',
        resource:   'auth',
        resourceId: userId,
      },
    });

    logger.info(`User logged out: ${userId}`);
  },

  // ── Get Me ───────────────────────────────────────────────

  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where:   { id: userId, deletedAt: null },
      include: {
        tenant:    true,
        userRoles: {
          include: {
            role: {
              include: {
                permissions: { include: { permission: true } },
              },
            },
          },
        },
        employee: {
          select: {
            id:           true,
            employeeCode: true,
            designation:  true,
            department:   { select: { name: true } },
          },
        },
      },
    });

    if (!user) throw new Error('USER_NOT_FOUND');

    const roles = user.userRoles.map((ur: any) => ur.role.name);
    const permissions = user.userRoles.flatMap((ur: any) =>
      ur.role.permissions.map((rp: any) => `${rp.permission.resource}:${rp.permission.action}`)
    );

    return {
      id:         user.id,
      tenantId:   user.tenantId,
      email:      user.email,
      firstName:  user.firstName,
      lastName:   user.lastName,
      avatarUrl:  user.avatarUrl,
      phone:      user.phone,
      mfaEnabled: user.mfaEnabled,
      lastLoginAt:user.lastLoginAt,
      roles,
      permissions,
      employee:   user.employee,
      tenant: {
        id:       user.tenant.id,
        name:     user.tenant.name,
        slug:     user.tenant.slug,
        plan:     user.tenant.plan,
        logoUrl:  user.tenant.logoUrl,
        settings: user.tenant.settings,
      },
    };
  },

  // ── Change Password ──────────────────────────────────────

  async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<void> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('USER_NOT_FOUND');

    const valid = await authService.comparePassword(oldPassword, user.passwordHash);
    if (!valid) throw new Error('INVALID_CREDENTIALS');

    const newHash = await authService.hashPassword(newPassword);
    await prisma.user.update({
      where: { id: userId },
      data:  { passwordHash: newHash },
    });

    // Revoke all sessions (force re-login)
    await prisma.session.deleteMany({ where: { userId } });

    logger.info(`Password changed for user: ${userId}`);
  },

  // ── Forgot Password — generate token + email reset link ──
  async forgotPassword(email: string): Promise<void> {
    const user = await prisma.user.findFirst({ where: { email: email.toLowerCase(), deletedAt: null } });
    // Always succeed silently (don't reveal whether the email exists)
    if (!user) {
      logger.info(`Password reset requested for unknown email: ${email}`);
      return;
    }

    const token = crypto.randomBytes(32).toString('hex');
    // Store token -> userId in Redis for 15 minutes
    await redisClient.set(`pwreset:${token}`, user.id, { EX: 900 });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetLink = `${frontendUrl}/reset-password?token=${token}`;
    await emailService.sendPasswordReset(user.email, resetLink, user.firstName);
    logger.info(`Password reset link sent to ${user.email}`);
  },

  // ── Reset Password — verify token + set new password ─────
  async resetPassword(token: string, newPassword: string): Promise<void> {
    const userId = await redisClient.get(`pwreset:${token}`);
    if (!userId) throw new Error('INVALID_OR_EXPIRED_TOKEN');

    const newHash = await authService.hashPassword(newPassword);
    await prisma.user.update({ where: { id: userId }, data: { passwordHash: newHash } });

    // One-time use: delete token + revoke existing sessions
    await redisClient.del(`pwreset:${token}`);
    await prisma.session.deleteMany({ where: { userId } });
    logger.info(`Password reset completed for user: ${userId}`);
  },

  // ── MFA: generate a secret + QR for the authenticator app ─
  async setupMfa(userId: string): Promise<{ secret: string; otpauthUrl: string; qrDataUrl: string }> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('USER_NOT_FOUND');

    const secretObj = speakeasy.generateSecret({ name: `Amdox ERP (${user.email})` });
    const secret = secretObj.base32;
    const otpauthUrl = secretObj.otpauth_url || '';
    const qrDataUrl = await qrcode.toDataURL(otpauthUrl);

    // Store the secret but DON'T enable yet — only after the user verifies a code
    await prisma.user.update({ where: { id: userId }, data: { mfaSecret: secret } });
    return { secret, otpauthUrl, qrDataUrl };
  },

  // ── MFA: verify the first code and turn MFA on ───────────
  async enableMfa(userId: string, token: string): Promise<void> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.mfaSecret) throw new Error('MFA_NOT_SETUP');

    if (!verifyTotp(user.mfaSecret, token)) throw new Error('INVALID_MFA_TOKEN');

    await prisma.user.update({ where: { id: userId }, data: { mfaEnabled: true } });
    logger.info(`MFA enabled for user: ${userId}`);
  },

  // ── MFA: disable (requires a current code) ───────────────
  async disableMfa(userId: string, token: string): Promise<void> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('USER_NOT_FOUND');
    if (!user.mfaEnabled) return;

    if (!verifyTotp(user.mfaSecret || '', token)) throw new Error('INVALID_MFA_TOKEN');

    await prisma.user.update({ where: { id: userId }, data: { mfaEnabled: false, mfaSecret: null } });
    logger.info(`MFA disabled for user: ${userId}`);
  },
};
