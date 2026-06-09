import prisma from '../config/database';
export const tenantService = {
  findById:  (id: string)          => prisma.tenants.findUnique({ where: { id } }),
  findBySlug:(slug: string)        => prisma.tenants.findUnique({ where: { slug } }),
  update:    (id: string, data: any) => prisma.tenants.update({ where: { id }, data }),
};
