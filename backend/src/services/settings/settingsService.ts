/**
 * Settings Service — M2
 * Tenant profile + the free-form `settings` JSON blob.
 */
import prisma from '../../config/database';
import { logger } from '../../utils/logger';

export const settingsService = {
  async get(tenantId: string) {
    const t = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, name: true, slug: true, plan: true, logoUrl: true, isActive: true, settings: true },
    });
    if (!t) throw new Error('TENANT_NOT_FOUND');
    return t;
  },

  async update(tenantId: string, input: any) {
    const t = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!t) throw new Error('TENANT_NOT_FOUND');

    const data: any = {};
    if (input.name !== undefined) data.name = input.name;
    if (input.logoUrl !== undefined) data.logoUrl = input.logoUrl;
    // merge settings JSON rather than overwrite
    if (input.settings !== undefined) {
      data.settings = { ...(t.settings as object || {}), ...input.settings };
    }
    const updated = await prisma.tenant.update({
      where: { id: tenantId }, data,
      select: { id: true, name: true, plan: true, logoUrl: true, settings: true },
    });
    logger.info(`Tenant settings updated: ${tenantId}`);
    return updated;
  },
};
