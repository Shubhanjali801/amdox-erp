import prisma from '../config/database';
export const userService = {
  findByEmail: (tenantId: string, email: string) => prisma.users.findFirst({ where: { tenantId, email } }),
  findById:    (id: string)                       => prisma.users.findUnique({ where: { id } }),
  update:      (id: string, data: any)            => prisma.users.update({ where: { id }, data }),
};
