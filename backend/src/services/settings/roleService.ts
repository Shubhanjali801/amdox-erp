/**
 * Role Service — M2 / RBAC
 * Tenant-scoped roles with attached permissions + user assignment.
 */
import prisma from '../../config/database';
import { logger } from '../../utils/logger';

export const roleService = {
  async list(tenantId: string) {
    return prisma.role.findMany({
      where: { tenantId }, orderBy: { name: 'asc' },
      include: {
        permissions: { include: { permission: true } },
        _count: { select: { userRoles: true } },
      },
    });
  },

  async getById(tenantId: string, id: string) {
    const role = await prisma.role.findFirst({
      where: { id, tenantId },
      include: { permissions: { include: { permission: true } }, _count: { select: { userRoles: true } } },
    });
    if (!role) throw new Error('ROLE_NOT_FOUND');
    return role;
  },

  async create(tenantId: string, input: any) {
    const dup = await prisma.role.findFirst({ where: { tenantId, name: input.name } });
    if (dup) throw new Error('ROLE_EXISTS');
    const role = await prisma.role.create({
      data: {
        tenantId, name: input.name, description: input.description,
        permissions: input.permissionIds?.length
          ? { create: input.permissionIds.map((permissionId: string) => ({ permissionId })) }
          : undefined,
      },
      include: { permissions: { include: { permission: true } } },
    });
    logger.info(`Role created: ${role.name} (${role.id})`);
    return role;
  },

  async update(tenantId: string, id: string, input: any) {
    const role = await this.getById(tenantId, id);
    if (role.isSystem && input.permissionIds) throw new Error('SYSTEM_ROLE_LOCKED');

    return prisma.$transaction(async (tx) => {
      await tx.role.update({
        where: { id },
        data: {
          name: input.name ?? role.name,
          description: input.description ?? role.description,
        },
      });
      // Replace permission set if provided
      if (input.permissionIds) {
        await tx.rolePermission.deleteMany({ where: { roleId: id } });
        if (input.permissionIds.length) {
          await tx.rolePermission.createMany({
            data: input.permissionIds.map((permissionId: string) => ({ roleId: id, permissionId })),
            skipDuplicates: true,
          });
        }
      }
      return tx.role.findUnique({ where: { id }, include: { permissions: { include: { permission: true } } } });
    });
  },

  async remove(tenantId: string, id: string) {
    const role = await this.getById(tenantId, id);
    if (role.isSystem) throw new Error('SYSTEM_ROLE_LOCKED');
    await prisma.$transaction([
      prisma.rolePermission.deleteMany({ where: { roleId: id } }),
      prisma.userRole.deleteMany({ where: { roleId: id } }),
      prisma.role.delete({ where: { id } }),
    ]);
    logger.info(`Role deleted: ${id}`);
  },

  // ── Assign / revoke role to a user ───────────────────────
  async assign(tenantId: string, roleId: string, userId: string) {
    await this.getById(tenantId, roleId);
    const user = await prisma.user.findFirst({ where: { id: userId, tenantId } });
    if (!user) throw new Error('USER_NOT_FOUND');
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId, roleId } },
      create: { userId, roleId },
      update: {},
    });
    logger.info(`Role ${roleId} assigned to user ${userId}`);
    return { userId, roleId };
  },

  async revoke(tenantId: string, roleId: string, userId: string) {
    await this.getById(tenantId, roleId);
    await prisma.userRole.deleteMany({ where: { roleId, userId } });
    logger.info(`Role ${roleId} revoked from user ${userId}`);
  },
};
