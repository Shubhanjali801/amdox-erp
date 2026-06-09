import prisma from '../config/database';
export const tenantService = {
  findById:  (id: string)          => prisma.tenant.findUnique({ where: { id } }),
  findBySlug:(slug: string)        => prisma.tenant.findUnique({ where: { slug } }),
  update:    (id: string, data: any) => prisma.tenant.update({ where: { id }, data }),
};
