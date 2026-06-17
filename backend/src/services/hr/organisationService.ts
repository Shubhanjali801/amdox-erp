/**
 * Organisation / Department Service — M4 / F-04
 * Departments with parent-child hierarchy. Tenant-scoped.
 */
import prisma from '../../config/database';
import { logger } from '../../utils/logger';

export interface CreateDeptInput {
  tenantId:   string;
  name:       string;
  code?:      string;
  parentId?:  string;
  managerId?: string;
}

export interface UpdateDeptInput {
  name?:      string;
  code?:      string;
  parentId?:  string;
  managerId?: string;
}

export const organisationService = {

  // ── List departments (with counts) ──────────────────────
  async list(tenantId: string) {
    const depts = await prisma.department.findMany({
      where:   { tenantId },
      orderBy: { name: 'asc' },
      include: { _count: { select: { employees: true, children: true } } },
    });
    return depts.map((d) => ({
      id: d.id, name: d.name, code: d.code, parentId: d.parentId, managerId: d.managerId,
      employeeCount: d._count.employees, subDepartments: d._count.children,
    }));
  },

  // ── Get one (with children + employees) ──────────────────
  async getById(tenantId: string, id: string) {
    const dept = await prisma.department.findFirst({
      where:   { id, tenantId },
      include: {
        parent:    { select: { id: true, name: true } },
        children:  { select: { id: true, name: true } },
        employees: { select: { id: true, employeeCode: true, designation: true } },
      },
    });
    if (!dept) throw new Error('DEPT_NOT_FOUND');
    return dept;
  },

  // ── Create ───────────────────────────────────────────────
  async create(input: CreateDeptInput) {
    const existing = await prisma.department.findFirst({
      where: { tenantId: input.tenantId, name: input.name },
    });
    if (existing) throw new Error('NAME_TAKEN');

    if (input.parentId) {
      const parent = await prisma.department.findFirst({
        where: { id: input.parentId, tenantId: input.tenantId },
      });
      if (!parent) throw new Error('PARENT_NOT_FOUND');
    }

    const dept = await prisma.department.create({
      data: {
        tenantId:  input.tenantId,
        name:      input.name,
        code:      input.code,
        parentId:  input.parentId,
        managerId: input.managerId,
      },
    });
    logger.info(`Department created: ${dept.name}`);
    return dept;
  },

  // ── Update ───────────────────────────────────────────────
  async update(tenantId: string, id: string, input: UpdateDeptInput) {
    const existing = await prisma.department.findFirst({ where: { id, tenantId } });
    if (!existing) throw new Error('DEPT_NOT_FOUND');

    if (input.parentId) {
      if (input.parentId === id) throw new Error('SELF_PARENT');
      const parent = await prisma.department.findFirst({ where: { id: input.parentId, tenantId } });
      if (!parent) throw new Error('PARENT_NOT_FOUND');
    }

    const dept = await prisma.department.update({
      where: { id },
      data: {
        name:      input.name      ?? undefined,
        code:      input.code      ?? undefined,
        parentId:  input.parentId  ?? undefined,
        managerId: input.managerId ?? undefined,
      },
    });
    return dept;
  },

  // ── Delete (blocked if it has employees or children) ─────
  async remove(tenantId: string, id: string) {
    const existing = await prisma.department.findFirst({ where: { id, tenantId } });
    if (!existing) throw new Error('DEPT_NOT_FOUND');

    const empCount = await prisma.employee.count({ where: { departmentId: id, deletedAt: null } });
    if (empCount > 0) throw new Error('HAS_EMPLOYEES');

    const childCount = await prisma.department.count({ where: { parentId: id } });
    if (childCount > 0) throw new Error('HAS_CHILDREN');

    await prisma.department.delete({ where: { id } });
    logger.info(`Department deleted: ${existing.name}`);
  },
};
