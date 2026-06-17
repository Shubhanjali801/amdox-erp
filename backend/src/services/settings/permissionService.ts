/**
 * Permission Service — M2 / RBAC
 * Global permission catalog (resource + action). Shared across tenants.
 */
import prisma from '../../config/database';
import { logger } from '../../utils/logger';

export const permissionService = {
  // List all permissions, grouped by resource
  async list() {
    const perms = await prisma.permission.findMany({ orderBy: [{ resource: 'asc' }, { action: 'asc' }] });
    const grouped: Record<string, any[]> = {};
    for (const p of perms) {
      (grouped[p.resource] ||= []).push({ id: p.id, action: p.action, description: p.description, key: `${p.resource}:${p.action}` });
    }
    return { total: perms.length, byResource: grouped, all: perms };
  },

  async getById(id: string) {
    const p = await prisma.permission.findUnique({ where: { id } });
    if (!p) throw new Error('PERMISSION_NOT_FOUND');
    return p;
  },

  async create(input: any) {
    const dup = await prisma.permission.findFirst({ where: { resource: input.resource, action: input.action } });
    if (dup) throw new Error('PERMISSION_EXISTS');
    const p = await prisma.permission.create({ data: input });
    logger.info(`Permission created: ${p.resource}:${p.action}`);
    return p;
  },

  async remove(id: string) {
    await this.getById(id);
    await prisma.$transaction([
      prisma.rolePermission.deleteMany({ where: { permissionId: id } }),
      prisma.permission.delete({ where: { id } }),
    ]);
    logger.info(`Permission deleted: ${id}`);
  },
};
