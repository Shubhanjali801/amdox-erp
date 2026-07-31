import { Prisma } from '@prisma/client';
import prisma from '../../config/database';
import { ConflictError, NotFoundError, ValidationError } from '../../utils/errors';

interface AttendancePayload {
  employeeId: string;
  date: string;
  clockIn?: string | null;
  clockOut?: string | null;
  totalHours?: number | null;
  overtimeHours?: number | null;
  status?: string;
  notes?: string | null;
}

const attendanceInclude = {
  employee: {
    select: {
      id: true,
      employeeCode: true,
      designation: true,
      user: { select: { firstName: true, lastName: true, email: true } },
      department: { select: { id: true, name: true, code: true } },
    },
  },
} satisfies Prisma.AttendanceInclude;

const ensureEmployee = async (tenantId: string, employeeId: string) => {
  const employee = await prisma.employee.findFirst({ where: { id: employeeId, tenantId, deletedAt: null } });
  if (!employee) throw new ValidationError('Invalid employeeId');
};

const dateOnly = (value: string) => new Date(`${value.slice(0, 10)}T00:00:00.000Z`);
const dateTime = (value?: string | null) => (value ? new Date(value) : null);

const calculateHours = (payload: AttendancePayload) => {
  if (payload.totalHours !== undefined) return payload.totalHours;
  if (!payload.clockIn || !payload.clockOut) return undefined;
  const hours = (new Date(payload.clockOut).getTime() - new Date(payload.clockIn).getTime()) / 36e5;
  return Math.max(0, Math.round(hours * 100) / 100);
};

export const attendanceService = {
  list: (tenantId: string, query: any) =>
    prisma.attendance.findMany({
      where: {
        employee: { tenantId, deletedAt: null },
        employeeId: query.employeeId || undefined,
        status: query.status || undefined,
        date: query.date ? dateOnly(query.date) : undefined,
      },
      include: attendanceInclude,
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      take: Number(query.limit || 100),
    }),

  get: async (tenantId: string, id: string) => {
    const attendance = await prisma.attendance.findFirst({
      where: { id, employee: { tenantId, deletedAt: null } },
      include: attendanceInclude,
    });
    if (!attendance) throw new NotFoundError('Attendance');
    return attendance;
  },

  create: async (tenantId: string, payload: AttendancePayload) => {
    await ensureEmployee(tenantId, payload.employeeId);
    const date = dateOnly(payload.date);
    const existing = await prisma.attendance.findUnique({
      where: { employeeId_date: { employeeId: payload.employeeId, date } },
    });
    if (existing) throw new ConflictError('Attendance already exists for this employee and date');

    const totalHours = calculateHours(payload);
    return prisma.attendance.create({
      data: {
        employeeId: payload.employeeId,
        date,
        clockIn: dateTime(payload.clockIn),
        clockOut: dateTime(payload.clockOut),
        totalHours,
        overtimeHours: payload.overtimeHours ?? (totalHours && totalHours > 8 ? Math.round((totalHours - 8) * 100) / 100 : 0),
        status: (payload.status || 'PRESENT') as any,
        notes: payload.notes || undefined,
      },
      include: attendanceInclude,
    });
  },

  update: async (tenantId: string, id: string, payload: Partial<AttendancePayload>) => {
    await attendanceService.get(tenantId, id);
    if (payload.employeeId) await ensureEmployee(tenantId, payload.employeeId);
    const totalHours = calculateHours(payload as AttendancePayload);
    return prisma.attendance.update({
      where: { id },
      data: {
        employeeId: payload.employeeId,
        date: payload.date ? dateOnly(payload.date) : undefined,
        clockIn: payload.clockIn !== undefined ? dateTime(payload.clockIn) : undefined,
        clockOut: payload.clockOut !== undefined ? dateTime(payload.clockOut) : undefined,
        totalHours,
        overtimeHours: payload.overtimeHours,
        status: payload.status as any,
        notes: payload.notes,
      },
      include: attendanceInclude,
    });
  },

  remove: async (tenantId: string, id: string) => {
    await attendanceService.get(tenantId, id);
    await prisma.attendance.delete({ where: { id } });
  },
};
