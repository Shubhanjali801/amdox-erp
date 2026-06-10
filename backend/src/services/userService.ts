import bcrypt from 'bcryptjs';
import prisma from '../config/database';
import { logger } from '../utils/logger';

export interface ListUsersParams {
  tenantId:  string;
  page?:     number;
  limit?:    number;
  search?:   string;
  isActive?: boolean;
}

export interface CreateUserInput {
  tenantId:   string;
  firstName:  string;
  lastName:   string;
  email:      string;
  password:   string;
  phone?:     string;
  roleNames?: string[];   // role names to assign, e.g. ['manager']
}

export interface UpdateUserInput {
  firstName?: string;
  lastName?:  string;
  phone?:     string;
  isActive?:  boolean;
  roleNames?: string[];
}

// Strip sensitive fields before returning
const publicUser = (u: any) => ({
  id:          u.id,
  tenantId:    u.tenantId,
  email:       u.email,
  firstName:   u.firstName,
  lastName:    u.lastName,
  phone:       u.phone,
  avatarUrl:   u.avatarUrl,
  isActive:    u.isActive,
  mfaEnabled:  u.mfaEnabled,
  lastLoginAt: u.lastLoginAt,
  createdAt:   u.createdAt,
  roles:       u.userRoles?.map((ur: any) => ur.role.name) ?? [],
});

export const userService = {

  // ── List (paginated, tenant-scoped, searchable) ──────────
  async list(params: ListUsersParams) {
    const page  = Math.max(1, params.page  || 1);
    const limit = Math.min(100, params.limit || 20);
    const skip  = (page - 1) * limit;

    const where: any = {
      tenantId:  params.tenantId,
      deletedAt: null,
    };

    if (params.isActive !== undefined) where.isActive = params.isActive;

    if (params.search) {
      where.OR = [
        { firstName: { contains: params.search, mode: 'insensitive' } },
        { lastName:  { contains: params.search, mode: 'insensitive' } },
        { email:     { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const [rows, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { userRoles: { include: { role: true } } },
      }),
      prisma.user.count({ where }),
    ]);

    return { data: rows.map(publicUser), total, page, limit };
  },

  // ── Get one (tenant-scoped) ──────────────────────────────
  async getById(tenantId: string, id: string) {
    const user = await prisma.user.findFirst({
      where:   { id, tenantId, deletedAt: null },
      include: { userRoles: { include: { role: true } } },
    });
    if (!user) throw new Error('USER_NOT_FOUND');
    return publicUser(user);
  },

  // ── Create (invite a teammate) ───────────────────────────
  async create(input: CreateUserInput) {
    const existing = await prisma.user.findFirst({
      where: { tenantId: input.tenantId, email: input.email },
    });
    if (existing) throw new Error('EMAIL_TAKEN');

    const passwordHash = await bcrypt.hash(input.password, 12);

    const user = await prisma.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: {
          tenantId:     input.tenantId,
          email:        input.email,
          passwordHash,
          firstName:    input.firstName,
          lastName:     input.lastName,
          phone:        input.phone,
          isActive:     true,
        },
      });

      const roleNames = input.roleNames?.length ? input.roleNames : ['viewer'];
      const roles = await tx.role.findMany({
        where: { tenantId: input.tenantId, name: { in: roleNames } },
      });
      for (const role of roles) {
        await tx.userRole.create({ data: { userId: u.id, roleId: role.id } });
      }
      return u;
    });

    logger.info(`User created: ${user.email} in tenant ${input.tenantId}`);
    return userService.getById(input.tenantId, user.id);
  },

  // ── Update ───────────────────────────────────────────────
  async update(tenantId: string, id: string, input: UpdateUserInput) {
    const existing = await prisma.user.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!existing) throw new Error('USER_NOT_FOUND');

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id },
        data: {
          firstName: input.firstName ?? undefined,
          lastName:  input.lastName  ?? undefined,
          phone:     input.phone     ?? undefined,
          isActive:  input.isActive  ?? undefined,
        },
      });

      if (input.roleNames) {
        await tx.userRole.deleteMany({ where: { userId: id } });
        const roles = await tx.role.findMany({
          where: { tenantId, name: { in: input.roleNames } },
        });
        for (const role of roles) {
          await tx.userRole.create({ data: { userId: id, roleId: role.id } });
        }
      }
    });

    logger.info(`User updated: ${id}`);
    return userService.getById(tenantId, id);
  },

  // ── Soft delete ──────────────────────────────────────────
  async remove(tenantId: string, id: string, currentUserId: string) {
    const existing = await prisma.user.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!existing) throw new Error('USER_NOT_FOUND');
    if (id === currentUserId) throw new Error('CANNOT_DELETE_SELF');

    await prisma.user.update({
      where: { id },
      data:  { deletedAt: new Date(), isActive: false },
    });
    await prisma.session.deleteMany({ where: { userId: id } });

    logger.info(`User soft-deleted: ${id}`);
  },
};
