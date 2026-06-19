/**
 * Vendor Service — M5 / F-05
 * Suppliers the tenant buys from. Tenant-scoped, soft-deleted.
 */
import prisma from '../../config/database';
import { logger } from '../../utils/logger';

export interface VendorListParams { tenantId: string; status?: string; search?: string; page?: number; limit?: number; }

export const vendorService = {
  async list(p: VendorListParams) {
    const page = Math.max(1, p.page || 1);
    const limit = Math.min(100, p.limit || 20);
    const where: any = { tenantId: p.tenantId, deletedAt: null };
    if (p.status) where.status = p.status;
    if (p.search) where.OR = [
      { name: { contains: p.search, mode: 'insensitive' } },
      { code: { contains: p.search, mode: 'insensitive' } },
    ];
    const [data, total] = await Promise.all([
      prisma.vendor.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { name: 'asc' } }),
      prisma.vendor.count({ where }),
    ]);
    return { data, total, page, limit };
  },

  async getById(tenantId: string, id: string) {
    const vendor = await prisma.vendor.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: { _count: { select: { purchaseOrders: true, inventoryItems: true } } },
    });
    if (!vendor) throw new Error('VENDOR_NOT_FOUND');
    return vendor;
  },

  async create(tenantId: string, input: any) {
    // The DB unique constraint on (tenantId, code) also covers soft-deleted rows,
    // so check for ANY existing vendor with this code — not just active ones.
    const existing = await prisma.vendor.findFirst({ where: { tenantId, code: input.code } });
    if (existing) {
      if (!existing.deletedAt) throw new Error('VENDOR_CODE_EXISTS');
      // Revive a previously soft-deleted vendor with the same code
      const revived = await prisma.vendor.update({
        where: { id: existing.id },
        data: { ...input, deletedAt: null, status: 'ACTIVE' },
      });
      logger.info(`Vendor revived: ${revived.code} (${revived.id})`);
      return revived;
    }
    const vendor = await prisma.vendor.create({ data: { tenantId, ...input } });
    logger.info(`Vendor created: ${vendor.code} (${vendor.id})`);
    return vendor;
  },

  async update(tenantId: string, id: string, input: any) {
    await this.getById(tenantId, id);
    return prisma.vendor.update({ where: { id }, data: input });
  },

  async remove(tenantId: string, id: string) {
    await this.getById(tenantId, id);
    await prisma.vendor.update({ where: { id }, data: { deletedAt: new Date(), status: 'INACTIVE' } });
    logger.info(`Vendor soft-deleted: ${id}`);
  },
};
