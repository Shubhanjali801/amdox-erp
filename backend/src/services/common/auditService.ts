/**
 * Audit Service — F-09 (Audit & Compliance)
 * Immutable, tamper-evident audit trail. Each entry's `hash` chains off the
 * previous entry's hash (per tenant), so any tampering breaks the chain.
 *
 * log() is the reusable entry point other modules call on mutations.
 */
import crypto from 'crypto';
import prisma from '../../config/database';

export interface AuditInput {
  tenantId:    string;
  userId?:     string | null;
  action:      string;            // CREATE | UPDATE | DELETE | LOGIN | APPROVE ...
  resource:    string;            // invoice | employee | vendor ...
  resourceId?: string | null;
  oldValues?:  any;
  newValues?:  any;
  ipAddress?:  string | null;
  userAgent?:  string | null;
}

export interface AuditListParams {
  tenantId:   string;
  resource?:  string;
  action?:    string;
  userId?:    string;
  page?:      number;
  limit?:     number;
}

function computeHash(prevHash: string, entry: Record<string, any>): string {
  const payload = JSON.stringify({
    prevHash,
    tenantId: entry.tenantId,
    userId: entry.userId ?? null,
    action: entry.action,
    resource: entry.resource,
    resourceId: entry.resourceId ?? null,
    newValues: entry.newValues ?? null,
    createdAt: entry.createdAt,
  });
  return crypto.createHash('sha256').update(payload).digest('hex');
}

export const auditService = {
  // ── Reusable: write a tamper-evident audit entry ─────────
  async log(input: AuditInput) {
    const last = await prisma.auditLog.findFirst({
      where: { tenantId: input.tenantId },
      orderBy: { createdAt: 'desc' },
      select: { hash: true },
    });
    const prevHash = last?.hash || 'GENESIS';
    const createdAt = new Date();
    const hash = computeHash(prevHash, { ...input, createdAt: createdAt.toISOString() });

    return prisma.auditLog.create({
      data: {
        tenantId:   input.tenantId,
        userId:     input.userId ?? null,
        action:     input.action,
        resource:   input.resource,
        resourceId: input.resourceId ?? null,
        oldValues:  input.oldValues ?? undefined,
        newValues:  input.newValues ?? undefined,
        ipAddress:  input.ipAddress ?? null,
        userAgent:  input.userAgent ?? null,
        hash,
        createdAt,
      },
    });
  },

  async list(p: AuditListParams) {
    const page = Math.max(1, p.page || 1);
    const limit = Math.min(200, p.limit || 50);
    const where: any = { tenantId: p.tenantId };
    if (p.resource) where.resource = p.resource;
    if (p.action) where.action = p.action;
    if (p.userId) where.userId = p.userId;

    const [data, total] = await Promise.all([
      prisma.auditLog.findMany({
        where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' },
        include: { user: { select: { email: true, firstName: true, lastName: true } } },
      }),
      prisma.auditLog.count({ where }),
    ]);
    return { data, total, page, limit };
  },

  async getById(tenantId: string, id: string) {
    const entry = await prisma.auditLog.findFirst({
      where: { id, tenantId },
      include: { user: { select: { email: true, firstName: true, lastName: true } } },
    });
    if (!entry) throw new Error('AUDIT_NOT_FOUND');
    return entry;
  },

  // ── Verify the hash chain is intact (tamper detection) ───
  async verifyChain(tenantId: string) {
    const entries = await prisma.auditLog.findMany({
      where: { tenantId }, orderBy: { createdAt: 'asc' },
    });
    let prevHash = 'GENESIS';
    let brokenAt: string | null = null;
    for (const e of entries) {
      const expected = computeHash(prevHash, { ...e, createdAt: e.createdAt.toISOString() });
      if (expected !== e.hash) { brokenAt = e.id; break; }
      prevHash = e.hash || '';
    }
    return { entries: entries.length, intact: brokenAt === null, brokenAt };
  },
};
