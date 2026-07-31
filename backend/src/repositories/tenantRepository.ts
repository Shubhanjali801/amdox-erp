import prisma from '../config/database';
export const tenantRepository = {
  findAll:   ()             => prisma.tenant.findMany(),
  findById:  (id: string)   => prisma.tenant.findUnique({ where: { id } }),
  findBySlug:(slug: string) => prisma.tenant.findUnique({ where: { slug } }),
  create:    (data: any)    => prisma.tenant.create({ data }),
  update:    (id: string, data: any) => prisma.tenant.update({ where: { id }, data }),
};
