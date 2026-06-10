import prisma from '../config/database';
import { logger } from '../utils/logger';

export interface UpdateTenantInput {
  name?:     string;
  domain?:   string;
  logoUrl?:  string;
  settings?: Record<string, any>;
}

const publicTenant = (t: any) => ({
  id:         t.id,
  name:       t.name,
  slug:       t.slug,
  domain:     t.domain,
  plan:       t.plan,
  isActive:   t.isActive,
  logoUrl:    t.logoUrl,
  settings:   t.settings,
  createdAt:  t.createdAt,
  updatedAt:  t.updatedAt,
  userCount:  t._count?.users,
});

export const tenantService = {

  // ── Get current tenant (with stats) ──────────────────────
  async getById(id: string) {
    const tenant = await prisma.tenant.findUnique({
      where:   { id },
      include: { _count: { select: { users: true, employees: true } } },
    });
    if (!tenant) throw new Error('TENANT_NOT_FOUND');
    return publicTenant(tenant);
  },

  // ── Update current tenant ────────────────────────────────
  async update(id: string, input: UpdateTenantInput) {
    const existing = await prisma.tenant.findUnique({ where: { id } });
    if (!existing) throw new Error('TENANT_NOT_FOUND');

    // Merge settings (don't overwrite the whole object)
    const mergedSettings = input.settings
      ? { ...(existing.settings as object), ...input.settings }
      : undefined;

    await prisma.tenant.update({
      where: { id },
      data: {
        name:     input.name    ?? undefined,
        domain:   input.domain  ?? undefined,
        logoUrl:  input.logoUrl ?? undefined,
        settings: mergedSettings,
      },
    });

    logger.info(`Tenant updated: ${id}`);
    return tenantService.getById(id);
  },
};
