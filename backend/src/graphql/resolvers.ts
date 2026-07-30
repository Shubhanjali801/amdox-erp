/**
 * GraphQL resolvers. Every resolver:
 *   • requires a valid JWT (context.user)
 *   • checks the same RBAC permission the REST route would
 *   • filters by the caller's tenantId (multi-tenant isolation)
 * Reads go straight to Prisma (this is a read/BI layer); stats reuse the service.
 */
import { GraphQLError } from 'graphql';
import prisma from '../config/database';
import { dashboardService } from '../services/dashboard/dashboardService';
import type { GqlContext } from './context';

const num = (v: any) => Number(v ?? 0);

function requireAuth(ctx: GqlContext) {
  if (!ctx.user) throw new GraphQLError('Unauthorized', { extensions: { code: 'UNAUTHENTICATED', http: { status: 401 } } });
  return ctx.user;
}

function requirePerm(ctx: GqlContext, perm: string) {
  const u = requireAuth(ctx);
  if (!u.permissions.includes(perm)) {
    throw new GraphQLError(`Missing permission: ${perm}`, { extensions: { code: 'FORBIDDEN', http: { status: 403 } } });
  }
  return u;
}

export const resolvers = {
  Query: {
    me: (_: unknown, __: unknown, ctx: GqlContext) => {
      const u = requireAuth(ctx);
      return { id: u.userId, email: u.email, tenantId: u.tenantId, roles: u.roles, permissions: u.permissions };
    },

    dashboard: async (_: unknown, __: unknown, ctx: GqlContext) => {
      const u = requirePerm(ctx, 'dashboard:read');
      const s = await dashboardService.statsOverview(u.tenantId);
      return {
        ...s,
        projects: {
          total: s.projects.total,
          byStatus: Object.entries(s.projects.byStatus).map(([status, count]) => ({ status, count })),
        },
      };
    },

    invoices: async (_: unknown, args: { type?: string; status?: string; limit: number }, ctx: GqlContext) => {
      const u = requirePerm(ctx, 'finance:read');
      const where: any = { tenantId: u.tenantId, deletedAt: null };
      if (args.type) where.type = args.type;
      if (args.status) where.status = args.status;
      const rows = await prisma.invoice.findMany({ where, take: args.limit, orderBy: { createdAt: 'desc' } });
      return rows.map((r) => ({
        id: r.id, invoiceNumber: r.invoiceNumber, type: r.type,
        totalAmount: num(r.totalAmount), status: r.status, currency: r.currency,
        dueDate: r.dueDate?.toISOString() ?? null,
      }));
    },

    inventory: async (_: unknown, args: { lowStockOnly: boolean; limit: number }, ctx: GqlContext) => {
      const u = requirePerm(ctx, 'supply_chain:read');
      const rows = await prisma.inventoryItem.findMany({ where: { tenantId: u.tenantId }, take: args.limit, orderBy: { name: 'asc' } });
      return rows
        .map((r) => ({
          id: r.id, sku: r.sku, name: r.name, category: r.category,
          quantityOnHand: num(r.quantityOnHand), reorderPoint: num(r.reorderPoint),
          lowStock: num(r.quantityOnHand) <= num(r.reorderPoint),
        }))
        .filter((r) => (args.lowStockOnly ? r.lowStock : true));
    },

    employees: async (_: unknown, args: { limit: number }, ctx: GqlContext) => {
      const u = requirePerm(ctx, 'hr:read');
      const rows = await prisma.employee.findMany({ where: { tenantId: u.tenantId, deletedAt: null }, take: args.limit, orderBy: { employeeCode: 'asc' } });
      return rows.map((r) => ({ id: r.id, employeeCode: r.employeeCode, designation: r.designation, status: r.status }));
    },

    projects: async (_: unknown, args: { limit: number }, ctx: GqlContext) => {
      const u = requirePerm(ctx, 'project:read');
      const rows = await prisma.project.findMany({ where: { tenantId: u.tenantId, deletedAt: null }, take: args.limit, orderBy: { createdAt: 'desc' } });
      return rows.map((r) => ({ id: r.id, name: r.name, code: (r as any).code ?? null, status: r.status, budget: num((r as any).budget) }));
    },
  },
};
