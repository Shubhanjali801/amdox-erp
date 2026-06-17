/**
 * Task Service — M4 / F-07
 * Project tasks (with sub-tasks, milestone link, assignees).
 * Scoped to tenant via the parent project.
 */
import prisma from '../../config/database';
import { logger } from '../../utils/logger';

export interface TaskListParams { tenantId: string; projectId?: string; status?: string; assignedToUserId?: string; page?: number; limit?: number; }

async function assertProject(tenantId: string, projectId: string) {
  const p = await prisma.project.findFirst({ where: { id: projectId, tenantId, deletedAt: null } });
  if (!p) throw new Error('PROJECT_NOT_FOUND');
  return p;
}

export const taskService = {
  async list(p: TaskListParams) {
    const page = Math.max(1, p.page || 1);
    const limit = Math.min(100, p.limit || 50);
    const where: any = { project: { tenantId: p.tenantId, deletedAt: null } };
    if (p.projectId) where.projectId = p.projectId;
    if (p.status) where.status = p.status;
    if (p.assignedToUserId) where.assignedToUserId = p.assignedToUserId;
    const [data, total] = await Promise.all([
      prisma.projectTask.findMany({
        where, skip: (page - 1) * limit, take: limit, orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
        include: { _count: { select: { subTasks: true } } },
      }),
      prisma.projectTask.count({ where }),
    ]);
    return { data, total, page, limit };
  },

  async getById(tenantId: string, id: string) {
    const task = await prisma.projectTask.findFirst({
      where: { id, project: { tenantId } },
      include: { subTasks: true, milestone: { select: { name: true } }, project: { select: { name: true, code: true } } },
    });
    if (!task) throw new Error('TASK_NOT_FOUND');
    return task;
  },

  async create(tenantId: string, input: any) {
    await assertProject(tenantId, input.projectId);
    const { assignedToEmployeeId, assignedToUserId, milestoneId, parentTaskId, ...rest } = input;
    const task = await prisma.projectTask.create({
      data: {
        ...rest,
        milestoneId: milestoneId || null,
        parentTaskId: parentTaskId || null,
        assignedToEmployeeId: assignedToEmployeeId || null,
        assignedToUserId: assignedToUserId || null,
      },
    });
    logger.info(`Task created: ${task.title} (${task.id})`);
    return task;
  },

  async update(tenantId: string, id: string, input: any) {
    await this.getById(tenantId, id);
    const data: any = { ...input };
    // Auto-stamp completedAt when moving to COMPLETED
    if (input.status === 'COMPLETED') data.completedAt = new Date();
    if (input.status && input.status !== 'COMPLETED') data.completedAt = null;
    return prisma.projectTask.update({ where: { id }, data });
  },

  async remove(tenantId: string, id: string) {
    await this.getById(tenantId, id);
    await prisma.projectTask.delete({ where: { id } });
    logger.info(`Task deleted: ${id}`);
  },
};
