import prisma from '../config/database';
export const tenantRepository = {
  findAll:   ()             => prisma.tenants.findMany(),
  findById:  (id: string)   => prisma.tenants.findUnique({ where: { id } }),
  findBySlug:(slug: string) => prisma.tenants.findUnique({ where: { slug } }),
  create:    (data: any)    => prisma.tenants.create({ data }),
  update:    (id: string, data: any) => prisma.tenants.update({ where: { id }, data }),
};
