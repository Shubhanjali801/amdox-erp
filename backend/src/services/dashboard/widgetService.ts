/**
 * Widget Service — M6 / F-08
 * Widget CRUD + getData(): resolves a widget's dataSource into live
 * tenant data so the frontend can render the chart/metric.
 */
import prisma from '../../config/database';
import { logger } from '../../utils/logger';

const num = (v: any) => Number(v || 0);

async function assertDashboard(tenantId: string, dashboardId: string) {
  const d = await prisma.dashboard.findFirst({ where: { id: dashboardId, tenantId } });
  if (!d) throw new Error('DASHBOARD_NOT_FOUND');
  return d;
}

export const widgetService = {
  async list(tenantId: string, dashboardId?: string) {
    const where: any = { dashboard: { tenantId } };
    if (dashboardId) where.dashboardId = dashboardId;
    return prisma.widget.findMany({ where, orderBy: { createdAt: 'asc' } });
  },

  async getById(tenantId: string, id: string) {
    const w = await prisma.widget.findFirst({ where: { id, dashboard: { tenantId } } });
    if (!w) throw new Error('WIDGET_NOT_FOUND');
    return w;
  },

  async create(tenantId: string, input: any) {
    await assertDashboard(tenantId, input.dashboardId);
    const w = await prisma.widget.create({
      data: {
        dashboardId: input.dashboardId, title: input.title, type: input.type,
        dataSource: input.dataSource, config: input.config ?? {}, position: input.position ?? {},
        refreshInterval: input.refreshInterval,
      },
    });
    logger.info(`Widget created: ${w.title} (${w.dataSource})`);
    return w;
  },

  async update(tenantId: string, id: string, input: any) {
    await this.getById(tenantId, id);
    return prisma.widget.update({ where: { id }, data: input });
  },

  async remove(tenantId: string, id: string) {
    await this.getById(tenantId, id);
    await prisma.widget.delete({ where: { id } });
    logger.info(`Widget deleted: ${id}`);
  },

  // ── Resolve a widget's dataSource into live data ─────────
  async getData(tenantId: string, id: string) {
    const w = await this.getById(tenantId, id);
    const data = await this.resolveDataSource(tenantId, w.dataSource);
    return { widgetId: w.id, title: w.title, type: w.type, dataSource: w.dataSource, data };
  },

  async resolveDataSource(tenantId: string, dataSource: string) {
    switch (dataSource) {
      case 'finance.payments': {
        const agg = await prisma.payment.aggregate({ where: { tenantId, status: 'COMPLETED' }, _sum: { amount: true }, _count: true });
        return { value: num(agg._sum.amount), count: agg._count };
      }
      case 'finance.arVsAp': {
        const [ar, ap] = await Promise.all([
          prisma.invoice.aggregate({ where: { tenantId, type: 'AR', deletedAt: null }, _sum: { totalAmount: true } }),
          prisma.invoice.aggregate({ where: { tenantId, type: 'AP', deletedAt: null }, _sum: { totalAmount: true } }),
        ]);
        return [{ label: 'AR', value: num(ar._sum.totalAmount) }, { label: 'AP', value: num(ap._sum.totalAmount) }];
      }
      case 'inventory.lowStock': {
        const items = await prisma.inventoryItem.findMany({ where: { tenantId }, select: { sku: true, name: true, quantityOnHand: true, reorderPoint: true } });
        return items.filter((i) => num(i.quantityOnHand) <= num(i.reorderPoint))
          .map((i) => ({ sku: i.sku, name: i.name, onHand: num(i.quantityOnHand), reorderPoint: num(i.reorderPoint) }));
      }
      case 'projects.status': {
        const g = await prisma.project.groupBy({ by: ['status'], where: { tenantId, deletedAt: null }, _count: true });
        return g.map((r: any) => ({ label: r.status, value: r._count }));
      }
      case 'hr.headcount': {
        const count = await prisma.employee.count({ where: { tenantId } });
        return { value: count };
      }
      default:
        return { note: `Unknown dataSource '${dataSource}'. Supported: finance.payments, finance.arVsAp, inventory.lowStock, projects.status, hr.headcount` };
    }
  },
};
