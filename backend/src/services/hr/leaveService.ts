/**
 * Leave Service — M4 / F-04
 * Leave types + leave requests with approve/reject workflow.
 */
import prisma from '../../config/database';
import { logger } from '../../utils/logger';

const dayStart = (d: string) => { const x = new Date(d); x.setUTCHours(0, 0, 0, 0); return x; };
const daysBetween = (a: Date, b: Date) =>
  Math.floor((b.getTime() - a.getTime()) / 86_400_000) + 1; // inclusive

export const leaveService = {

  // ─── Leave Types ───────────────────────────────────────
  async createType(tenantId: string, data: { name: string; daysAllowedPerYear: number; isPaid?: boolean; carryForward?: boolean }) {
    const existing = await prisma.leaveType.findFirst({ where: { tenantId, name: data.name } });
    if (existing) throw new Error('TYPE_NAME_TAKEN');
    return prisma.leaveType.create({
      data: {
        tenantId, name: data.name,
        daysAllowedPerYear: data.daysAllowedPerYear,
        isPaid: data.isPaid ?? true,
        carryForward: data.carryForward ?? false,
      },
    });
  },

  async listTypes(tenantId: string) {
    return prisma.leaveType.findMany({ where: { tenantId }, orderBy: { name: 'asc' } });
  },

  // ─── Leave Requests ────────────────────────────────────
  async list(params: { tenantId: string; employeeId?: string; status?: string; page?: number; limit?: number }) {
    const page  = Math.max(1, params.page  || 1);
    const limit = Math.min(100, params.limit || 20);
    const skip  = (page - 1) * limit;

    const where: any = { employee: { tenantId: params.tenantId } };
    if (params.employeeId) where.employeeId = params.employeeId;
    if (params.status)     where.status     = params.status;

    const [data, total] = await Promise.all([
      prisma.leaveRequest.findMany({
        where, skip, take: limit, orderBy: { createdAt: 'desc' },
        include: { leaveType: { select: { name: true } }, employee: { select: { employeeCode: true } } },
      }),
      prisma.leaveRequest.count({ where }),
    ]);
    return { data, total, page, limit };
  },

  async getById(tenantId: string, id: string) {
    const req = await prisma.leaveRequest.findFirst({
      where: { id, employee: { tenantId } },
      include: { leaveType: true, employee: { select: { employeeCode: true } } },
    });
    if (!req) throw new Error('REQUEST_NOT_FOUND');
    return req;
  },

  // ── Submit a leave request ───────────────────────────────
  async create(tenantId: string, data: { employeeId: string; leaveTypeId: string; startDate: string; endDate: string; reason?: string }) {
    const emp = await prisma.employee.findFirst({ where: { id: data.employeeId, tenantId, deletedAt: null } });
    if (!emp) throw new Error('EMPLOYEE_NOT_FOUND');

    const type = await prisma.leaveType.findFirst({ where: { id: data.leaveTypeId, tenantId } });
    if (!type) throw new Error('LEAVE_TYPE_NOT_FOUND');

    const start = dayStart(data.startDate);
    const end   = dayStart(data.endDate);
    if (end < start) throw new Error('INVALID_DATE_RANGE');

    const totalDays = daysBetween(start, end);

    const req = await prisma.leaveRequest.create({
      data: {
        employeeId:  data.employeeId,
        leaveTypeId: data.leaveTypeId,
        startDate:   start,
        endDate:     end,
        totalDays,
        reason:      data.reason,
        status:      'PENDING',
      },
    });
    logger.info(`Leave requested: emp ${data.employeeId}, ${totalDays} days`);
    return req;
  },

  // ── Approve ──────────────────────────────────────────────
  async approve(tenantId: string, id: string, approvedBy: string) {
    const req = await prisma.leaveRequest.findFirst({ where: { id, employee: { tenantId } } });
    if (!req) throw new Error('REQUEST_NOT_FOUND');
    if (req.status !== 'PENDING') throw new Error('NOT_PENDING');

    const updated = await prisma.leaveRequest.update({
      where: { id }, data: { status: 'APPROVED', approvedBy, approvedAt: new Date() },
    });
    // mark employee ON_LEAVE
    await prisma.employee.update({ where: { id: req.employeeId }, data: { status: 'ON_LEAVE' } });
    logger.info(`Leave approved: ${id}`);
    return updated;
  },

  // ── Reject ───────────────────────────────────────────────
  async reject(tenantId: string, id: string, approvedBy: string, reason?: string) {
    const req = await prisma.leaveRequest.findFirst({ where: { id, employee: { tenantId } } });
    if (!req) throw new Error('REQUEST_NOT_FOUND');
    if (req.status !== 'PENDING') throw new Error('NOT_PENDING');

    const updated = await prisma.leaveRequest.update({
      where: { id }, data: { status: 'REJECTED', approvedBy, approvedAt: new Date(), rejectedReason: reason },
    });
    logger.info(`Leave rejected: ${id}`);
    return updated;
  },

  // ── Cancel ───────────────────────────────────────────────
  async remove(tenantId: string, id: string) {
    const req = await prisma.leaveRequest.findFirst({ where: { id, employee: { tenantId } } });
    if (!req) throw new Error('REQUEST_NOT_FOUND');
    await prisma.leaveRequest.update({ where: { id }, data: { status: 'CANCELLED' } });
  },
};
