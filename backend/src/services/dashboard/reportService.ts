/**
 * Report Service — M6 / F-08
 * Scheduled report definitions (ScheduledReport) + on-demand generation
 * of a live report payload (JSON) for a given report type.
 */
import prisma from '../../config/database';
import { logger } from '../../utils/logger';

const num = (v: any) => Number(v || 0);

export const reportService = {
  async list(tenantId: string) {
    return prisma.scheduledReport.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' } });
  },

  async getById(tenantId: string, id: string) {
    const r = await prisma.scheduledReport.findFirst({ where: { id, tenantId } });
    if (!r) throw new Error('REPORT_NOT_FOUND');
    return r;
  },

  async create(tenantId: string, input: any) {
    const r = await prisma.scheduledReport.create({
      data: {
        tenantId, name: input.name, description: input.description,
        reportType: input.reportType, format: input.format || 'PDF',
        schedule: input.schedule, recipients: input.recipients, config: input.config ?? {},
      },
    });
    logger.info(`Scheduled report created: ${r.name} (${r.reportType})`);
    return r;
  },

  async update(tenantId: string, id: string, input: any) {
    await this.getById(tenantId, id);
    return prisma.scheduledReport.update({ where: { id }, data: input });
  },

  async remove(tenantId: string, id: string) {
    await this.getById(tenantId, id);
    await prisma.scheduledReport.delete({ where: { id } });
    logger.info(`Scheduled report deleted: ${id}`);
  },

  // Mark a scheduled report as run (stamps lastRunAt) + returns its data
  async run(tenantId: string, id: string) {
    const r = await this.getById(tenantId, id);
    const data = await this.generate(tenantId, r.reportType);
    await prisma.scheduledReport.update({ where: { id }, data: { lastRunAt: new Date() } });
    return { report: r.name, type: r.reportType, format: r.format, data };
  },

  // ── On-demand report generation (live data) ──────────────
  async generate(tenantId: string, reportType: string) {
    switch (reportType) {
      case 'financial-summary': {
        const [ar, ap, payments, invoiceCount] = await Promise.all([
          prisma.invoice.aggregate({ where: { tenantId, type: 'AR', deletedAt: null }, _sum: { totalAmount: true } }),
          prisma.invoice.aggregate({ where: { tenantId, type: 'AP', deletedAt: null }, _sum: { totalAmount: true } }),
          prisma.payment.aggregate({ where: { tenantId, status: 'COMPLETED' }, _sum: { amount: true } }),
          prisma.invoice.count({ where: { tenantId, deletedAt: null } }),
        ]);
        return {
          totalReceivable: num(ar._sum.totalAmount),
          totalPayable: num(ap._sum.totalAmount),
          paymentsReceived: num(payments._sum.amount),
          invoiceCount,
        };
      }
      case 'inventory-status': {
        const items = await prisma.inventoryItem.findMany({ where: { tenantId }, select: { sku: true, name: true, quantityOnHand: true, reorderPoint: true, unitCost: true } });
        const stockValue = items.reduce((s, i) => s + num(i.quantityOnHand) * num(i.unitCost), 0);
        const lowStock = items.filter((i) => num(i.quantityOnHand) <= num(i.reorderPoint));
        return { itemCount: items.length, stockValue, lowStockCount: lowStock.length, lowStock };
      }
      case 'hr-headcount': {
        const byStatus = await prisma.employee.groupBy({ by: ['status'], where: { tenantId }, _count: true });
        const total = await prisma.employee.count({ where: { tenantId } });
        return { total, byStatus: byStatus.reduce((a: any, r: any) => { a[r.status] = r._count; return a; }, {}) };
      }
      case 'project-portfolio': {
        const projects = await prisma.project.findMany({
          where: { tenantId, deletedAt: null },
          select: { code: true, name: true, status: true, budget: true, actualCost: true },
        });
        return projects.map((p) => ({
          ...p, budget: num(p.budget), actualCost: num(p.actualCost), variance: num(p.budget) - num(p.actualCost),
        }));
      }
      default:
        throw new Error('UNKNOWN_REPORT_TYPE');
    }
  },
};
