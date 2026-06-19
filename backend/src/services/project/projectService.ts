/**
 * Project Service — M4 / F-07
 * Projects + milestones. Tenant-scoped, soft-deleted.
 */
import prisma from '../../config/database';
import { logger } from '../../utils/logger';

export interface ProjectListParams { tenantId: string; status?: string; search?: string; page?: number; limit?: number; }

export const projectService = {
  async list(p: ProjectListParams) {
    const page = Math.max(1, p.page || 1);
    const limit = Math.min(100, p.limit || 20);
    const where: any = { tenantId: p.tenantId, deletedAt: null };
    if (p.status) where.status = p.status;
    if (p.search) where.OR = [
      { name: { contains: p.search, mode: 'insensitive' } },
      { code: { contains: p.search, mode: 'insensitive' } },
    ];
    const [data, total] = await Promise.all([
      prisma.project.findMany({
        where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' },
        include: { _count: { select: { tasks: true, milestones: true, resources: true } } },
      }),
      prisma.project.count({ where }),
    ]);
    return { data, total, page, limit };
  },

  async getById(tenantId: string, id: string) {
    const project = await prisma.project.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        milestones: { orderBy: { dueDate: 'asc' } },
        resources: { include: { employee: { select: { employeeCode: true, designation: true } } } },
        _count: { select: { tasks: true } },
      },
    });
    if (!project) throw new Error('PROJECT_NOT_FOUND');
    return project;
  },

  async create(tenantId: string, input: any) {
    // Unique (tenantId, code) also covers soft-deleted rows — check all, revive if deleted.
    const existing = await prisma.project.findFirst({ where: { tenantId, code: input.code } });
    if (existing) {
      if (!existing.deletedAt) throw new Error('PROJECT_CODE_EXISTS');
      const revived = await prisma.project.update({
        where: { id: existing.id },
        data: { ...input, deletedAt: null, status: input.status ?? 'PLANNING' },
      });
      logger.info(`Project revived: ${revived.code} (${revived.id})`);
      return revived;
    }
    const project = await prisma.project.create({ data: { tenantId, ...input } });
    logger.info(`Project created: ${project.code} (${project.id})`);
    return project;
  },

  async update(tenantId: string, id: string, input: any) {
    await this.getById(tenantId, id);
    return prisma.project.update({ where: { id }, data: input });
  },

  async remove(tenantId: string, id: string) {
    await this.getById(tenantId, id);
    await prisma.project.update({ where: { id }, data: { deletedAt: new Date(), status: 'CANCELLED' } });
    logger.info(`Project soft-deleted: ${id}`);
  },

  // ── Milestones ───────────────────────────────────────────
  async listMilestones(tenantId: string, projectId: string) {
    await this.getById(tenantId, projectId);
    return prisma.projectMilestone.findMany({ where: { projectId }, orderBy: { dueDate: 'asc' } });
  },

  async addMilestone(tenantId: string, projectId: string, input: any) {
    await this.getById(tenantId, projectId);
    const m = await prisma.projectMilestone.create({
      data: {
        projectId, name: input.name, description: input.description,
        dueDate: new Date(input.dueDate), status: input.status || 'PENDING',
      },
    });
    logger.info(`Milestone added to project ${projectId}: ${m.name}`);
    return m;
  },
};
