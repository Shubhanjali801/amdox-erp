import prisma from '../../config/database';
import { NotFoundError, ValidationError } from '../../utils/errors';

interface DepartmentPayload {
  name: string;
  code?: string | null;
  managerId?: string | null;
  parentId?: string | null;
}

const ensureDepartmentRefs = async (tenantId: string, payload: Partial<DepartmentPayload>, id?: string) => {
  if (payload.parentId) {
    if (payload.parentId === id) throw new ValidationError('Department cannot be its own parent');
    const parent = await prisma.department.findFirst({ where: { id: payload.parentId, tenantId } });
    if (!parent) throw new ValidationError('Invalid parentId');
  }

  if (payload.managerId) {
    const manager = await prisma.employee.findFirst({ where: { id: payload.managerId, tenantId, deletedAt: null } });
    if (!manager) throw new ValidationError('Invalid managerId');
  }
};

const withEmployeeInclude = {
  employees: {
    where: { deletedAt: null },
    select: {
      id: true,
      employeeCode: true,
      designation: true,
      status: true,
      user: { select: { firstName: true, lastName: true, email: true } },
    },
  },
};

export const organisationService = {
  listDepartments: (tenantId: string) =>
    prisma.department.findMany({
      where: { tenantId },
      include: withEmployeeInclude,
      orderBy: [{ parentId: 'asc' }, { name: 'asc' }],
    }),

  getDepartment: async (tenantId: string, id: string) => {
    const department = await prisma.department.findFirst({
      where: { id, tenantId },
      include: withEmployeeInclude,
    });
    if (!department) throw new NotFoundError('Department');
    return department;
  },

  createDepartment: async (tenantId: string, payload: DepartmentPayload) => {
    await ensureDepartmentRefs(tenantId, payload);
    return prisma.department.create({
      data: {
        tenantId,
        name: payload.name,
        code: payload.code || undefined,
        managerId: payload.managerId || undefined,
        parentId: payload.parentId || undefined,
      },
      include: withEmployeeInclude,
    });
  },

  updateDepartment: async (tenantId: string, id: string, payload: Partial<DepartmentPayload>) => {
    await organisationService.getDepartment(tenantId, id);
    await ensureDepartmentRefs(tenantId, payload, id);
    return prisma.department.update({
      where: { id },
      data: {
        name: payload.name,
        code: payload.code,
        managerId: payload.managerId || null,
        parentId: payload.parentId || null,
      },
      include: withEmployeeInclude,
    });
  },

  removeDepartment: async (tenantId: string, id: string) => {
    await organisationService.getDepartment(tenantId, id);
    const employeeCount = await prisma.employee.count({ where: { tenantId, departmentId: id, deletedAt: null } });
    if (employeeCount > 0) throw new ValidationError('Move employees before deleting this department');
    await prisma.department.delete({ where: { id } });
  },

  orgChart: async (tenantId: string) => {
    const employees = await prisma.employee.findMany({
      where: { tenantId, deletedAt: null },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        department: { select: { id: true, name: true, code: true } },
      },
      orderBy: { employeeCode: 'asc' },
    });
    return employees.map(employee => ({
      id: employee.id,
      employeeCode: employee.employeeCode,
      name: `${employee.user.firstName} ${employee.user.lastName}`,
      email: employee.user.email,
      designation: employee.designation,
      status: employee.status,
      managerId: employee.managerId,
      department: employee.department,
    }));
  },
};
