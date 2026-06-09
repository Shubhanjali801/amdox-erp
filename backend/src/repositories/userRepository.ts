import prisma from '../config/database';
export const userRepository = {
  findAll:      (tenantId: string)              => prisma.user.findMany({ where: { tenantId } }),
  findById:     (id: string)                    => prisma.user.findUnique({ where: { id } }),
  findByEmail:  (tenantId: string, email: string) => prisma.user.findFirst({ where: { tenantId, email } }),
  create:       (data: any)                     => prisma.user.create({ data }),
  update:       (id: string, data: any)         => prisma.user.update({ where: { id }, data }),
  delete:       (id: string)                    => prisma.user.delete({ where: { id } }),
};
