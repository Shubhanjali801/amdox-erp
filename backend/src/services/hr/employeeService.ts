import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import prisma from '../../config/database';
import { ConflictError, NotFoundError, ValidationError } from '../../utils/errors';
import { employeeInclude, employeeRepository, EmployeeFilters } from '../../repositories/hr/employeeRepository';

interface EmployeePayload {
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  departmentId?: string | null;
  designation: string;
  managerId?: string | null;
  employmentType?: string;
  status?: string;
  joinDate: string;
  baseSalary: number;
  currency?: string;
  payFrequency?: string;
  dateOfBirth?: string | null;
  gender?: string | null;
  nationality?: string | null;
  taxId?: string | null;
  bankAccount?: string | null;
  bankName?: string | null;
  bankIfsc?: string | null;
  address?: Prisma.InputJsonValue;
  emergencyContact?: Prisma.InputJsonValue;
}

const DEFAULT_PASSWORD = 'Employee@1234';

const blankToNull = (value?: string | null) => (value === '' ? null : value);

const ensureDepartment = async (tenantId: string, departmentId?: string | null) => {
  if (!departmentId) return;
  const department = await prisma.department.findFirst({ where: { id: departmentId, tenantId } });
  if (!department) throw new ValidationError('Invalid departmentId');
};

const ensureManager = async (tenantId: string, managerId?: string | null, employeeId?: string) => {
  if (!managerId) return;
  if (managerId === employeeId) throw new ValidationError('Employee cannot be their own manager');
  const manager = await prisma.employee.findFirst({ where: { id: managerId, tenantId, deletedAt: null } });
  if (!manager) throw new ValidationError('Invalid managerId');
};

const createEmployeeData = (tenantId: string, payload: EmployeePayload): Prisma.EmployeeCreateInput => ({
  tenant: { connect: { id: tenantId } },
  user: {
    create: {
      tenantId,
      email: payload.email.toLowerCase(),
      passwordHash: bcrypt.hashSync(DEFAULT_PASSWORD, 10),
      firstName: payload.firstName,
      lastName: payload.lastName,
      phone: blankToNull(payload.phone),
      isActive: true,
    },
  },
  employeeCode: payload.employeeCode,
  department: payload.departmentId ? { connect: { id: payload.departmentId } } : undefined,
  designation: payload.designation,
  manager: payload.managerId ? { connect: { id: payload.managerId } } : undefined,
  employmentType: (payload.employmentType || 'FULL_TIME') as any,
  status: (payload.status || 'ACTIVE') as any,
  joinDate: new Date(payload.joinDate),
  baseSalary: payload.baseSalary,
  currency: payload.currency || 'INR',
  payFrequency: (payload.payFrequency || 'MONTHLY') as any,
  dateOfBirth: payload.dateOfBirth ? new Date(payload.dateOfBirth) : undefined,
  gender: blankToNull(payload.gender),
  nationality: blankToNull(payload.nationality),
  taxId: blankToNull(payload.taxId),
  bankAccount: blankToNull(payload.bankAccount),
  bankName: blankToNull(payload.bankName),
  bankIfsc: blankToNull(payload.bankIfsc),
  address: payload.address,
  emergencyContact: payload.emergencyContact,
});

export const employeeService = {
  list: (tenantId: string, filters: EmployeeFilters) => employeeRepository.findAll(tenantId, filters),

  get: async (tenantId: string, id: string) => {
    const employee = await employeeRepository.findById(tenantId, id);
    if (!employee) throw new NotFoundError('Employee');
    return employee;
  },

  create: async (tenantId: string, payload: EmployeePayload) => {
    await ensureDepartment(tenantId, payload.departmentId);
    await ensureManager(tenantId, payload.managerId);

    const existingCode = await employeeRepository.findByCode(tenantId, payload.employeeCode);
    if (existingCode) throw new ConflictError('Employee code already exists');

    const existingUser = await prisma.user.findFirst({
      where: { tenantId, email: payload.email.toLowerCase(), deletedAt: null },
    });
    if (existingUser) throw new ConflictError('Email already belongs to another user');

    return employeeRepository.create(createEmployeeData(tenantId, payload));
  },

  update: async (tenantId: string, id: string, payload: Partial<EmployeePayload>) => {
    const current = await employeeRepository.findById(tenantId, id);
    if (!current) throw new NotFoundError('Employee');

    await ensureDepartment(tenantId, payload.departmentId);
    await ensureManager(tenantId, payload.managerId, id);

    if (payload.employeeCode && payload.employeeCode !== current.employeeCode) {
      const existingCode = await employeeRepository.findByCode(tenantId, payload.employeeCode);
      if (existingCode) throw new ConflictError('Employee code already exists');
    }

    if (payload.email && payload.email.toLowerCase() !== current.user.email) {
      const existingUser = await prisma.user.findFirst({
        where: { tenantId, email: payload.email.toLowerCase(), deletedAt: null, id: { not: current.user.id } },
      });
      if (existingUser) throw new ConflictError('Email already belongs to another user');
    }

    return prisma.$transaction(async tx => {
      if (payload.firstName || payload.lastName || payload.email || payload.phone !== undefined) {
        await tx.user.update({
          where: { id: current.user.id },
          data: {
            firstName: payload.firstName,
            lastName: payload.lastName,
            email: payload.email?.toLowerCase(),
            phone: blankToNull(payload.phone),
          },
        });
      }

      return tx.employee.update({
        where: { id },
        data: {
          employeeCode: payload.employeeCode,
          designation: payload.designation,
          departmentId: blankToNull(payload.departmentId),
          managerId: blankToNull(payload.managerId),
          employmentType: payload.employmentType as any,
          status: payload.status as any,
          joinDate: payload.joinDate ? new Date(payload.joinDate) : undefined,
          baseSalary: payload.baseSalary,
          currency: payload.currency,
          payFrequency: payload.payFrequency as any,
          dateOfBirth: payload.dateOfBirth ? new Date(payload.dateOfBirth) : payload.dateOfBirth === null ? null : undefined,
          gender: blankToNull(payload.gender),
          nationality: blankToNull(payload.nationality),
          taxId: blankToNull(payload.taxId),
          bankAccount: blankToNull(payload.bankAccount),
          bankName: blankToNull(payload.bankName),
          bankIfsc: blankToNull(payload.bankIfsc),
          address: payload.address,
          emergencyContact: payload.emergencyContact,
        },
        include: employeeInclude,
      });
    });
  },

  remove: async (tenantId: string, id: string) => {
    const employee = await employeeRepository.findById(tenantId, id);
    if (!employee) throw new NotFoundError('Employee');
    await employeeRepository.softDelete(id);
  },

  departments: (tenantId: string) =>
    prisma.department.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, code: true, managerId: true, parentId: true },
    }),
};
