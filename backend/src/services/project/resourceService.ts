/**
 * Resource Service — M4 / F-07
 * Allocates employees to projects (with % allocation + role).
 * Scoped to tenant via the parent project.
 */
import prisma from '../../config/database';
import { logger } from '../../utils/logger';

async function assertProject(tenantId: string, projectId: string) {
  const p = await prisma.project.findFirst({ where: { id: projectId, tenantId, deletedAt: null } });
  if (!p) throw new Error('PROJECT_NOT_FOUND');
}

export const resourceService = {
  async list(tenantId: string, projectId?: string) {
    const where: any = { project: { tenantId, deletedAt: null } };
    if (projectId) where.projectId = projectId;
    return prisma.projectResource.findMany({
      where, orderBy: { createdAt: 'desc' },
      include: { employee: { select: { employeeCode: true, designation: true } }, project: { select: { name: true, code: true } } },
    });
  },

  async getById(tenantId: string, id: string) {
    const r = await prisma.projectResource.findFirst({
      where: { id, project: { tenantId } },
      include: { employee: true, project: { select: { name: true, code: true } } },
    });
    if (!r) throw new Error('RESOURCE_NOT_FOUND');
    return r;
  },

  async create(tenantId: string, input: any) {
    await assertProject(tenantId, input.projectId);
    // Employee must belong to tenant
    const emp = await prisma.employee.findFirst({ where: { id: input.employeeId, tenantId } });
    if (!emp) throw new Error('EMPLOYEE_NOT_FOUND');

    const dup = await prisma.projectResource.findFirst({ where: { projectId: input.projectId, employeeId: input.employeeId } });
    if (dup) throw new Error('ALREADY_ALLOCATED');

    const resource = await prisma.projectResource.create({
      data: {
        projectId: input.projectId, employeeId: input.employeeId, role: input.role,
        allocation: input.allocation,
        startDate: input.startDate ? new Date(input.startDate) : null,
        endDate: input.endDate ? new Date(input.endDate) : null,
      },
    });
    logger.info(`Employee ${input.employeeId} allocated ${input.allocation}% to project ${input.projectId}`);
    return resource;
  },

  async update(tenantId: string, id: string, input: any) {
    await this.getById(tenantId, id);
    return prisma.projectResource.update({ where: { id }, data: input });
  },

  async remove(tenantId: string, id: string) {
    await this.getById(tenantId, id);
    await prisma.projectResource.delete({ where: { id } });
    logger.info(`Resource allocation removed: ${id}`);
  },
};
