import prisma from '../../config/database';
import { logger } from '../../utils/logger';

export interface ListLedgerParams {
  tenantId:  string;
  page?:     number;
  limit?:    number;
  search?:   string;
  type?:     string;   // ASSET | LIABILITY | EQUITY | REVENUE | EXPENSE
  isActive?: boolean;
}

export interface CreateAccountInput {
  tenantId:     string;
  code:         string;
  name:         string;
  type:         any;     // AccountType enum
  subType?:     string;
  currency?:    string;
  parentId?:    string;
  description?: string;
}

export interface UpdateAccountInput {
  name?:        string;
  subType?:     string;
  currency?:    string;
  parentId?:    string;
  description?: string;
  isActive?:    boolean;
}

export const ledgerService = {

  // ── List (paginated, tenant-scoped) ──────────────────────
  async list(params: ListLedgerParams) {
    const page  = Math.max(1, params.page  || 1);
    const limit = Math.min(100, params.limit || 20);
    const skip  = (page - 1) * limit;

    const where: any = { tenantId: params.tenantId };
    if (params.type)                   where.type     = params.type;
    if (params.isActive !== undefined) where.isActive = params.isActive;
    if (params.search) {
      where.OR = [
        { code: { contains: params.search, mode: 'insensitive' } },
        { name: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.chartOfAccount.findMany({ where, skip, take: limit, orderBy: { code: 'asc' } }),
      prisma.chartOfAccount.count({ where }),
    ]);

    return { data, total, page, limit };
  },

  // ── Get one ──────────────────────────────────────────────
  async getById(tenantId: string, id: string) {
    const account = await prisma.chartOfAccount.findFirst({
      where:   { id, tenantId },
      include: { children: true, parent: true },
    });
    if (!account) throw new Error('ACCOUNT_NOT_FOUND');
    return account;
  },

  // ── Create ───────────────────────────────────────────────
  async create(input: CreateAccountInput) {
    const existing = await prisma.chartOfAccount.findFirst({
      where: { tenantId: input.tenantId, code: input.code },
    });
    if (existing) throw new Error('CODE_TAKEN');

    if (input.parentId) {
      const parent = await prisma.chartOfAccount.findFirst({
        where: { id: input.parentId, tenantId: input.tenantId },
      });
      if (!parent) throw new Error('PARENT_NOT_FOUND');
    }

    const account = await prisma.chartOfAccount.create({
      data: {
        tenantId:    input.tenantId,
        code:        input.code,
        name:        input.name,
        type:        input.type,
        subType:     input.subType,
        currency:    input.currency || 'INR',
        parentId:    input.parentId,
        description: input.description,
      },
    });

    logger.info(`Account created: ${account.code} (${account.name})`);
    return account;
  },

  // ── Update ───────────────────────────────────────────────
  async update(tenantId: string, id: string, input: UpdateAccountInput) {
    const existing = await prisma.chartOfAccount.findFirst({ where: { id, tenantId } });
    if (!existing) throw new Error('ACCOUNT_NOT_FOUND');

    if (input.parentId) {
      if (input.parentId === id) throw new Error('SELF_PARENT');
      const parent = await prisma.chartOfAccount.findFirst({
        where: { id: input.parentId, tenantId },
      });
      if (!parent) throw new Error('PARENT_NOT_FOUND');
    }

    const account = await prisma.chartOfAccount.update({
      where: { id },
      data: {
        name:        input.name        ?? undefined,
        subType:     input.subType     ?? undefined,
        currency:    input.currency    ?? undefined,
        parentId:    input.parentId    ?? undefined,
        description: input.description ?? undefined,
        isActive:    input.isActive    ?? undefined,
      },
    });

    logger.info(`Account updated: ${account.code}`);
    return account;
  },

  // ── Delete (blocked if used) ─────────────────────────────
  async remove(tenantId: string, id: string) {
    const existing = await prisma.chartOfAccount.findFirst({ where: { id, tenantId } });
    if (!existing) throw new Error('ACCOUNT_NOT_FOUND');

    const usedInDebit  = await prisma.journalEntryLine.count({ where: { debitAccountId: id } });
    const usedInCredit = await prisma.journalEntryLine.count({ where: { creditAccountId: id } });
    if (usedInDebit + usedInCredit > 0) throw new Error('ACCOUNT_IN_USE');

    const hasChildren = await prisma.chartOfAccount.count({ where: { parentId: id } });
    if (hasChildren > 0) throw new Error('HAS_CHILDREN');

    await prisma.chartOfAccount.delete({ where: { id } });
    logger.info(`Account deleted: ${existing.code}`);
  },
};
