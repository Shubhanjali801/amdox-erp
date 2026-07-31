import { Prisma } from '@prisma/client';
import prisma from '../../config/database';
import { NotFoundError, ValidationError } from '../../utils/errors';

interface LeavePayload {
  employeeId: string;
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  totalDays?: number;
  reason?: string | null;
  status?: string;
  approvedBy?: string | null;
  rejectedReason?: string | null;
}

const leaveInclude = {
  employee: {
    select: {
      id: true,
      employeeCode: true,
      user: { select: { firstName: true, lastName: true, email: true } },
      department: { select: { id: true, name: true, code: true } },
    },
  },
  leaveType: true,
} satisfies Prisma.LeaveRequestInclude;

const ensureLeaveRefs = async (tenantId: string, employeeId?: string, leaveTypeId?: string) => {
  if (employeeId) {
    const employee = await prisma.employee.findFirst({ where: { id: employeeId, tenantId, deletedAt: null } });
    if (!employee) throw new ValidationError('Invalid employeeId');
  }
  if (leaveTypeId) {
    const leaveType = await prisma.leaveType.findFirst({ where: { id: leaveTypeId, tenantId } });
    if (!leaveType) throw new ValidationError('Invalid leaveTypeId');
  }
};

const daysBetween = (startDate: string, endDate: string) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diff = Math.floor((end.getTime() - start.getTime()) / 86400000) + 1;
  if (diff <= 0) throw new ValidationError('endDate must be on or after startDate');
  return diff;
};

export const leaveService = {
  listTypes: (tenantId: string) =>
    prisma.leaveType.findMany({ where: { tenantId }, orderBy: { name: 'asc' } }),

  list: (tenantId: string, query: any) =>
    prisma.leaveRequest.findMany({
      where: {
        employee: { tenantId, deletedAt: null },
        employeeId: query.employeeId || undefined,
        leaveTypeId: query.leaveTypeId || undefined,
        status: query.status || undefined,
      },
      include: leaveInclude,
      orderBy: { createdAt: 'desc' },
      take: Number(query.limit || 100),
    }),

  get: async (tenantId: string, id: string) => {
    const leave = await prisma.leaveRequest.findFirst({
      where: { id, employee: { tenantId, deletedAt: null } },
      include: leaveInclude,
    });
    if (!leave) throw new NotFoundError('Leave request');
    return leave;
  },

  create: async (tenantId: string, payload: LeavePayload) => {
    await ensureLeaveRefs(tenantId, payload.employeeId, payload.leaveTypeId);
    const totalDays = payload.totalDays || daysBetween(payload.startDate, payload.endDate);
    return prisma.leaveRequest.create({
      data: {
        employeeId: payload.employeeId,
        leaveTypeId: payload.leaveTypeId,
        startDate: new Date(payload.startDate),
        endDate: new Date(payload.endDate),
        totalDays,
        reason: payload.reason || undefined,
        status: (payload.status || 'PENDING') as any,
      },
      include: leaveInclude,
    });
  },

  update: async (tenantId: string, id: string, payload: Partial<LeavePayload>) => {
    const current = await leaveService.get(tenantId, id);
    await ensureLeaveRefs(tenantId, payload.employeeId, payload.leaveTypeId);
    const startDate = payload.startDate || current.startDate.toISOString();
    const endDate = payload.endDate || current.endDate.toISOString();
    return prisma.leaveRequest.update({
      where: { id },
      data: {
        employeeId: payload.employeeId,
        leaveTypeId: payload.leaveTypeId,
        startDate: payload.startDate ? new Date(payload.startDate) : undefined,
        endDate: payload.endDate ? new Date(payload.endDate) : undefined,
        totalDays: payload.totalDays || daysBetween(startDate, endDate),
        reason: payload.reason,
        status: payload.status as any,
        approvedBy: payload.approvedBy,
        approvedAt: payload.status === 'APPROVED' ? new Date() : undefined,
        rejectedReason: payload.rejectedReason,
      },
      include: leaveInclude,
    });
  },

  remove: async (tenantId: string, id: string) => {
    await leaveService.get(tenantId, id);
    await prisma.leaveRequest.delete({ where: { id } });
  },
};
