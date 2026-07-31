import prisma from '../config/database';
export const userService = {
  findByEmail: (tenantId: string, email: string) => prisma.user.findFirst({ where: { tenantId, email } }),
  findById:    (id: string)                       => prisma.user.findUnique({ where: { id } }),
  update:      (id: string, data: any)            => prisma.user.update({ where: { id }, data }),
};
