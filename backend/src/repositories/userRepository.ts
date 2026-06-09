import prisma from '../config/database';
export const userRepository = {
  findAll:      (tenantId: string)              => prisma.users.findMany({ where: { tenantId } }),
  findById:     (id: string)                    => prisma.users.findUnique({ where: { id } }),
  findByEmail:  (tenantId: string, email: string) => prisma.users.findFirst({ where: { tenantId, email } }),
  create:       (data: any)                     => prisma.users.create({ data }),
  update:       (id: string, data: any)         => prisma.users.update({ where: { id }, data }),
  delete:       (id: string)                    => prisma.users.delete({ where: { id } }),
};
