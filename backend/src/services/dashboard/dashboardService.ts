/**
 * Dashboard Service — M6 / F-08 (Business Intelligence)
 * Dashboard CRUD + a cross-module KPI overview for the tenant.
 */
import prisma from '../../config/database';
import { logger } from '../../utils/logger';

const num = (v: any) => Number(v || 0);

export const dashboardService = {
  async list(tenantId: string) {
    return prisma.dashboard.findMany({
      where: { tenantId }, orderBy: { createdAt: 'desc' },
      include: { _count: { select: { widgets: true } } },
    });
  },

  async getById(tenantId: string, id: string) {
    const d = await prisma.dashboard.findFirst({
      where: { id, tenantId },
      include: { widgets: { orderBy: { createdAt: 'asc' } } },
    });
    if (!d) throw new Error('DASHBOARD_NOT_FOUND');
    return d;
  },

  async create(tenantId: string, createdBy: string, input: any) {
    const d = await prisma.dashboard.create({
      data: {
        tenantId, createdBy, name: input.name, description: input.description,
        isPublic: input.isPublic ?? false, layout: input.layout ?? [],
      },
    });
    logger.info(`Dashboard created: ${d.name} (${d.id})`);
    return d;
  },

  async update(tenantId: string, id: string, input: any) {
    await this.getById(tenantId, id);
    return prisma.dashboard.update({ where: { id }, data: input });
  },

  async remove(tenantId: string, id: string) {
    await this.getById(tenantId, id);
    await prisma.$transaction([
      prisma.widget.deleteMany({ where: { dashboardId: id } }),
      prisma.dashboard.delete({ where: { id } }),
    ]);
    logger.info(`Dashboard deleted: ${id}`);
  },

  // ── Cross-module KPI overview (the BI summary) ───────────
  async statsOverview(tenantId: string) {
    const [
      employees, projects, invoices, payments, items, vendors, pos,
      arOutstanding, apOutstanding, lowStock,
    ] = await Promise.all([
      prisma.employee.count({ where: { tenantId } }),
      prisma.project.count({ where: { tenantId, deletedAt: null } }),
      prisma.invoice.count({ where: { tenantId, deletedAt: null } }),
      prisma.payment.aggregate({ where: { tenantId, status: 'COMPLETED' }, _sum: { amount: true } }),
      prisma.inventoryItem.count({ where: { tenantId } }),
      prisma.vendor.count({ where: { tenantId, deletedAt: null } }),
      prisma.purchaseOrder.count({ where: { tenantId } }),
      prisma.invoice.aggregate({ where: { tenantId, type: 'AR', status: { in: ['APPROVED', 'PARTIALLY_PAID', 'OVERDUE'] }, deletedAt: null }, _sum: { totalAmount: true } }),
      prisma.invoice.aggregate({ where: { tenantId, type: 'AP', status: { in: ['APPROVED', 'PARTIALLY_PAID', 'OVERDUE'] }, deletedAt: null }, _sum: { totalAmount: true } }),
      prisma.inventoryItem.findMany({ where: { tenantId }, select: { quantityOnHand: true, reorderPoint: true } }),
    ]);

    const projectsByStatus = await prisma.project.groupBy({
      by: ['status'], where: { tenantId, deletedAt: null }, _count: true,
    });
    const lowStockCount = lowStock.filter((i) => num(i.quantityOnHand) <= num(i.reorderPoint)).length;

    return {
      finance: {
        invoices,
        paymentsReceived: num(payments._sum.amount),
        arOutstanding: num(arOutstanding._sum.totalAmount),
        apOutstanding: num(apOutstanding._sum.totalAmount),
      },
      hr: { employees },
      supply: { inventoryItems: items, vendors, purchaseOrders: pos, lowStockItems: lowStockCount },
      projects: {
        total: projects,
        byStatus: projectsByStatus.reduce((acc: any, r: any) => { acc[r.status] = r._count; return acc; }, {}),
      },
      generatedAt: new Date().toISOString(),
    };
  },
};
