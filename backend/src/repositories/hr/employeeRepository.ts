import { Prisma } from '@prisma/client';
import prisma from '../../config/database';

export interface EmployeeFilters {
  search?: string;
  status?: string;
  departmentId?: string;
  page?: number;
  limit?: number;
}

export const employeeInclude = {
  user: {
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      isActive: true,
    },
  },
  department: {
    select: {
      id: true,
      name: true,
      code: true,
    },
  },
  manager: {
    select: {
      id: true,
      employeeCode: true,
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  },
} satisfies Prisma.EmployeeInclude;

const buildWhere = (tenantId: string, filters: EmployeeFilters = {}): Prisma.EmployeeWhereInput => {
  const where: Prisma.EmployeeWhereInput = {
    tenantId,
    deletedAt: null,
  };

  if (filters.status) where.status = filters.status as any;
  if (filters.departmentId) where.departmentId = filters.departmentId;

  if (filters.search) {
    const search = filters.search.trim();
    where.OR = [
      { employeeCode: { contains: search, mode: 'insensitive' } },
      { designation: { contains: search, mode: 'insensitive' } },
      { user: { firstName: { contains: search, mode: 'insensitive' } } },
      { user: { lastName: { contains: search, mode: 'insensitive' } } },
      { user: { email: { contains: search, mode: 'insensitive' } } },
    ];
  }

  return where;
};

export const employeeRepository = {
  findAll: async (tenantId: string, filters: EmployeeFilters = {}) => {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const where = buildWhere(tenantId, filters);

    const [data, total] = await prisma.$transaction([
      prisma.employee.findMany({
        where,
        include: employeeInclude,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.employee.count({ where }),
    ]);

    return { data, total, page, limit };
  },

  findById: (tenantId: string, id: string) =>
    prisma.employee.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: employeeInclude,
    }),

  findByCode: (tenantId: string, employeeCode: string) =>
    prisma.employee.findFirst({
      where: { tenantId, employeeCode, deletedAt: null },
      include: employeeInclude,
    }),

  create: (data: Prisma.EmployeeCreateInput) =>
    prisma.employee.create({
      data,
      include: employeeInclude,
    }),

  softDelete: (id: string) =>
    prisma.employee.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: 'TERMINATED',
      },
    }),
};
