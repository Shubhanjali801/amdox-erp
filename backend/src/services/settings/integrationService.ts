/**
 * Integration Service — M2
 * Third-party integration configs stored under tenant.settings.integrations.
 * (No dedicated table — kept as a JSON map keyed by integration name.)
 */
import prisma from '../../config/database';
import { logger } from '../../utils/logger';

async function loadIntegrations(tenantId: string): Promise<Record<string, any>> {
  const t = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { settings: true } });
  if (!t) throw new Error('TENANT_NOT_FOUND');
  return ((t.settings as any)?.integrations) || {};
}

async function saveIntegrations(tenantId: string, integrations: Record<string, any>) {
  const t = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { settings: true } });
  const settings = { ...((t?.settings as object) || {}), integrations };
  await prisma.tenant.update({ where: { id: tenantId }, data: { settings } });
}

export const integrationService = {
  async list(tenantId: string) {
    const integrations = await loadIntegrations(tenantId);
    return Object.entries(integrations).map(([key, value]) => ({ key, ...(value as object) }));
  },

  async get(tenantId: string, key: string) {
    const integrations = await loadIntegrations(tenantId);
    if (!integrations[key]) throw new Error('INTEGRATION_NOT_FOUND');
    return { key, ...integrations[key] };
  },

  async upsert(tenantId: string, key: string, input: any) {
    const integrations = await loadIntegrations(tenantId);
    integrations[key] = {
      enabled: input.enabled ?? integrations[key]?.enabled ?? false,
      config: { ...(integrations[key]?.config || {}), ...(input.config || {}) },
      updatedAt: new Date().toISOString(),
    };
    await saveIntegrations(tenantId, integrations);
    logger.info(`Integration upserted: ${key} for tenant ${tenantId}`);
    return { key, ...integrations[key] };
  },

  async remove(tenantId: string, key: string) {
    const integrations = await loadIntegrations(tenantId);
    if (!integrations[key]) throw new Error('INTEGRATION_NOT_FOUND');
    delete integrations[key];
    await saveIntegrations(tenantId, integrations);
    logger.info(`Integration removed: ${key}`);
  },
};
