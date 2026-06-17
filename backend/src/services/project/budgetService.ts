/**
 * Budget Service — M4 / F-07
 * Project budget tracking: budget vs actualCost → variance & utilization.
 * Operates on the Project model (budget + actualCost columns).
 */
import prisma from '../../config/database';
import { logger } from '../../utils/logger';

const round2 = (n: number) => Math.round(n * 100) / 100;
const num = (v: any) => Number(v);

function summarise(p: any) {
  const budget = num(p.budget);
  const actual = num(p.actualCost);
  const variance = round2(budget - actual);
  const utilization = budget > 0 ? round2((actual / budget) * 100) : 0;
  return {
    projectId: p.id, code: p.code, name: p.name, currency: p.currency,
    budget, actualCost: actual, variance,
    utilizationPct: utilization,
    overBudget: actual > budget,
  };
}

export const budgetService = {
  // Budget summary for every project
  async list(tenantId: string) {
    const projects = await prisma.project.findMany({
      where: { tenantId, deletedAt: null }, orderBy: { createdAt: 'desc' },
      select: { id: true, code: true, name: true, currency: true, budget: true, actualCost: true },
    });
    return projects.map(summarise);
  },

  async getByProject(tenantId: string, projectId: string) {
    const p = await prisma.project.findFirst({ where: { id: projectId, tenantId, deletedAt: null } });
    if (!p) throw new Error('PROJECT_NOT_FOUND');

    // Roll up estimated vs actual task hours for context
    const tasks = await prisma.projectTask.aggregate({
      where: { projectId }, _sum: { estimatedHours: true, actualHours: true },
    });
    return {
      ...summarise(p),
      estimatedHours: num(tasks._sum.estimatedHours || 0),
      actualHours: num(tasks._sum.actualHours || 0),
    };
  },

  async update(tenantId: string, projectId: string, input: any) {
    const p = await prisma.project.findFirst({ where: { id: projectId, tenantId, deletedAt: null } });
    if (!p) throw new Error('PROJECT_NOT_FOUND');

    const data: any = {};
    if (input.budget !== undefined) data.budget = input.budget;
    if (input.setCost !== undefined) data.actualCost = input.setCost;
    if (input.addCost !== undefined) data.actualCost = round2(num(p.actualCost) + num(input.addCost));

    const updated = await prisma.project.update({ where: { id: projectId }, data });
    logger.info(`Budget updated for project ${p.code}: budget=${updated.budget} actual=${updated.actualCost}`);
    return summarise(updated);
  },
};
