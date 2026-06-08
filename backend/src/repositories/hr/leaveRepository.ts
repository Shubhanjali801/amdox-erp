import prisma from '../../config/database';
export const repository = { findAll: (tenantId: string) => Promise.resolve([]) };

