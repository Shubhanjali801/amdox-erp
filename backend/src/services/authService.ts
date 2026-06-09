import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { ENV } from '../config/env';
import prisma from '../config/database';
import { logger } from '../utils/logger';

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
  ipAddress?: string;
  userAgent?: string;
}

export interface TokenPayload {
  userId:   string;
  tenantId: string;
  email:    string;
  roles:    string[];
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

    // 2. Generate slug from company name
    const slug = companySlug ||
      companyName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');

    // Check slug not taken
    const slugTaken = await prisma.tenant.findUnique({ where: { slug } });
    if (slugTaken) throw new Error('SLUG_TAKEN');

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
              include: { role: true },
            },
          },
        },
      },
    });

    if (!session)                          throw new Error('INVALID_REFRESH_TOKEN');
    if (session.expiresAt < new Date())    throw new Error('REFRESH_TOKEN_EXPIRED');
    if (!session.user.isActive)            throw new Error('ACCOUNT_INACTIVE');

    const roles = session.user.userRoles.map((ur: any) => ur.role.name);

    // 2. Sign new access token
    const payload: TokenPayload = {
      userId:   session.user.id,
      tenantId: session.user.tenantId,
      email:    session.user.email,
      roles,
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
};
