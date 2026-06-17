/**
 * Employee Service — M4 / F-04
 * Onboarding creates a linked User + Employee in one transaction
 * (every employee is also a login user). Tenant-scoped.
 */
import bcrypt from 'bcryptjs';
import prisma from '../../config/database';
import { logger } from '../../utils/logger';

export interface CreateEmployeeInput {
  tenantId:        string;
  firstName:       string;
  lastName:        string;
  email:           string;
  password:        string;
  employeeCode:    string;
  designation:     string;
  departmentId?:   string;
  managerId?:      string;
  employmentType?: string;
  joinDate:        string;
  baseSalary:      number;
  currency?:       string;
  payFrequency?:   string;
  phone?:          string;
}

export interface UpdateEmployeeInput {
  designation?:    string;
  departmentId?:   string;
  managerId?:      string;
  employmentType?: string;
  status?:         string;
  baseSalary?:     number;
  payFrequency?:   string;
}

export interface ListEmployeeParams {
  tenantId:      string;
  page?:         number;
  limit?:        number;
  search?:       string;
  departmentId?: string;
  status?:       string;
}

const publicEmployee = (e: any) => ({
  id:             e.id,
  employeeCode:   e.employeeCode,
  designation:    e.designation,
  employmentType: e.employmentType,
  status:         e.status,
  joinDate:       e.joinDate,
  baseSalary:     e.baseSalary,
  currency:       e.currency,
  payFrequency:   e.payFrequency,
  departmentId:   e.departmentId,
  managerId:      e.managerId,
  department:     e.department ? { id: e.department.id, name: e.department.name } : undefined,
  user:           e.user ? { id: e.user.id, email: e.user.email, firstName: e.user.firstName, lastName: e.user.lastName } : undefined,
});

export const employeeService = {

  // ── List (paginated, tenant-scoped) ──────────────────────
  async list(params: ListEmployeeParams) {
    const page  = Math.max(1, params.page  || 1);
    const limit = Math.min(100, params.limit || 20);
    const skip  = (page - 1) * limit;

    const where: any = { tenantId: params.tenantId, deletedAt: null };
    if (params.departmentId) where.departmentId = params.departmentId;
    if (params.status)       where.status        = params.status;
    if (params.search) {
      where.OR = [
        { employeeCode: { contains: params.search, mode: 'insensitive' } },
        { designation:  { contains: params.search, mode: 'insensitive' } },
        { user: { firstName: { contains: params.search, mode: 'insensitive' } } },
        { user: { lastName:  { contains: params.search, mode: 'insensitive' } } },
      ];
    }

    const [rows, total] = await Promise.all([
      prisma.employee.findMany({
        where, skip, take: limit, orderBy: { createdAt: 'desc' },
        include: { user: true, department: true },
      }),
      prisma.employee.count({ where }),
    ]);
    return { data: rows.map(publicEmployee), total, page, limit };
  },

  // ── Get one ──────────────────────────────────────────────
  async getById(tenantId: string, id: string) {
    const e = await prisma.employee.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: { user: true, department: true, manager: { include: { user: true } } },
    });
    if (!e) throw new Error('EMPLOYEE_NOT_FOUND');
    return publicEmployee(e);
  },

  // ── Create (onboard user + employee) ─────────────────────
  async create(input: CreateEmployeeInput) {
    const emailTaken = await prisma.user.findFirst({
      where: { tenantId: input.tenantId, email: input.email },
    });
    if (emailTaken) throw new Error('EMAIL_TAKEN');

    const codeTaken = await prisma.employee.findFirst({
      where: { tenantId: input.tenantId, employeeCode: input.employeeCode },
    });
    if (codeTaken) throw new Error('CODE_TAKEN');

    if (input.departmentId) {
      const dept = await prisma.department.findFirst({
        where: { id: input.departmentId, tenantId: input.tenantId },
      });
      if (!dept) throw new Error('DEPARTMENT_NOT_FOUND');
    }

    const passwordHash = await bcrypt.hash(input.password, 12);

    const employee = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          tenantId:  input.tenantId,
          email:     input.email,
          passwordHash,
          firstName: input.firstName,
          lastName:  input.lastName,
          phone:     input.phone,
          isActive:  true,
        },
      });

      const viewer = await tx.role.findFirst({ where: { tenantId: input.tenantId, name: 'viewer' } });
      if (viewer) await tx.userRole.create({ data: { userId: user.id, roleId: viewer.id } });

      return tx.employee.create({
        data: {
          tenantId:       input.tenantId,
          userId:         user.id,
          employeeCode:   input.employeeCode,
          designation:    input.designation,
          departmentId:   input.departmentId,
          managerId:      input.managerId,
          employmentType: (input.employmentType as any) || 'FULL_TIME',
          status:         'ACTIVE',
          joinDate:       new Date(input.joinDate),
          baseSalary:     input.baseSalary,
          currency:       input.currency || 'INR',
          payFrequency:   (input.payFrequency as any) || 'MONTHLY',
        },
        include: { user: true, department: true },
      });
    });

    logger.info(`Employee onboarded: ${employee.employeeCode} (${input.email})`);
    return publicEmployee(employee);
  },

  // ── Update ───────────────────────────────────────────────
  async update(tenantId: string, id: string, input: UpdateEmployeeInput) {
    const existing = await prisma.employee.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!existing) throw new Error('EMPLOYEE_NOT_FOUND');

    if (input.departmentId) {
      const dept = await prisma.department.findFirst({ where: { id: input.departmentId, tenantId } });
      if (!dept) throw new Error('DEPARTMENT_NOT_FOUND');
    }

    const e = await prisma.employee.update({
      where: { id },
      data: {
        designation:    input.designation     ?? undefined,
        departmentId:   input.departmentId     ?? undefined,
        managerId:      input.managerId        ?? undefined,
        employmentType: (input.employmentType as any) ?? undefined,
        status:         (input.status as any)  ?? undefined,
        baseSalary:     input.baseSalary       ?? undefined,
        payFrequency:   (input.payFrequency as any) ?? undefined,
      },
      include: { user: true, department: true },
    });
    return publicEmployee(e);
  },

  // ── Soft delete (offboard) ───────────────────────────────
  async remove(tenantId: string, id: string) {
    const existing = await prisma.employee.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!existing) throw new Error('EMPLOYEE_NOT_FOUND');

    await prisma.$transaction(async (tx) => {
      await tx.employee.update({
        where: { id },
        data: { deletedAt: new Date(), status: 'TERMINATED', terminationDate: new Date() },
      });
      await tx.user.update({ where: { id: existing.userId }, data: { isActive: false } });
    });
    logger.info(`Employee offboarded: ${existing.employeeCode}`);
  },
};
