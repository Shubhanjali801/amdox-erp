/**
 * Attendance Service — M4 / F-04
 * Daily clock-in/out records per employee. Auto-computes hours + overtime.
 */
import prisma from '../../config/database';
import { logger } from '../../utils/logger';

export interface MarkAttendanceInput {
  tenantId:   string;
  employeeId: string;
  date:       string;       // YYYY-MM-DD
  clockIn?:   string;       // ISO datetime
  clockOut?:  string;       // ISO datetime
  status?:    string;       // PRESENT | ABSENT | HALF_DAY | HOLIDAY | WORK_FROM_HOME
  notes?:     string;
}

export interface ListAttendanceParams {
  tenantId:   string;
  employeeId?: string;
  from?:      string;
  to?:        string;
  page?:      number;
  limit?:     number;
}

const STANDARD_HOURS = 8;
const dayStart = (d: string) => { const x = new Date(d); x.setUTCHours(0, 0, 0, 0); return x; };

export const attendanceService = {

  // verify employee belongs to tenant
  async assertEmployee(tenantId: string, employeeId: string) {
    const e = await prisma.employee.findFirst({ where: { id: employeeId, tenantId, deletedAt: null } });
    if (!e) throw new Error('EMPLOYEE_NOT_FOUND');
    return e;
  },

  // ── List (by employee + date range) ──────────────────────
  async list(params: ListAttendanceParams) {
    const page  = Math.max(1, params.page  || 1);
    const limit = Math.min(100, params.limit || 31);
    const skip  = (page - 1) * limit;

    const where: any = {};
    if (params.employeeId) where.employeeId = params.employeeId;
    if (params.from || params.to) {
      where.date = {};
      if (params.from) where.date.gte = dayStart(params.from);
      if (params.to)   where.date.lte = dayStart(params.to);
    }
    // tenant scope via employee relation
    where.employee = { tenantId: params.tenantId };

    const [data, total] = await Promise.all([
      prisma.attendance.findMany({
        where, skip, take: limit, orderBy: { date: 'desc' },
        include: { employee: { select: { employeeCode: true } } },
      }),
      prisma.attendance.count({ where }),
    ]);
    return { data, total, page, limit };
  },

  // ── Mark / upsert attendance for a day ───────────────────
  async mark(input: MarkAttendanceInput) {
    await this.assertEmployee(input.tenantId, input.employeeId);
    const date = dayStart(input.date);

    let totalHours: number | undefined;
    let overtimeHours: number | undefined;
    if (input.clockIn && input.clockOut) {
      const ms = new Date(input.clockOut).getTime() - new Date(input.clockIn).getTime();
      totalHours = Math.round((ms / 3_600_000) * 100) / 100;
      overtimeHours = Math.max(0, Math.round((totalHours - STANDARD_HOURS) * 100) / 100);
    }

    const record = await prisma.attendance.upsert({
      where: { employeeId_date: { employeeId: input.employeeId, date } },
      update: {
        clockIn:  input.clockIn  ? new Date(input.clockIn)  : undefined,
        clockOut: input.clockOut ? new Date(input.clockOut) : undefined,
        totalHours, overtimeHours,
        status:   (input.status as any) || undefined,
        notes:    input.notes,
      },
      create: {
        employeeId: input.employeeId,
        date,
        clockIn:    input.clockIn  ? new Date(input.clockIn)  : null,
        clockOut:   input.clockOut ? new Date(input.clockOut) : null,
        totalHours, overtimeHours,
        status:     (input.status as any) || 'PRESENT',
        notes:      input.notes,
      },
    });

    logger.info(`Attendance marked: emp ${input.employeeId} on ${input.date} (${record.status})`);
    return record;
  },

  // ── Get one ──────────────────────────────────────────────
  async getById(tenantId: string, id: string) {
    const rec = await prisma.attendance.findFirst({
      where: { id, employee: { tenantId } },
      include: { employee: { select: { employeeCode: true } } },
    });
    if (!rec) throw new Error('ATTENDANCE_NOT_FOUND');
    return rec;
  },

  // ── Delete ───────────────────────────────────────────────
  async remove(tenantId: string, id: string) {
    const rec = await prisma.attendance.findFirst({ where: { id, employee: { tenantId } } });
    if (!rec) throw new Error('ATTENDANCE_NOT_FOUND');
    await prisma.attendance.delete({ where: { id } });
  },
};
