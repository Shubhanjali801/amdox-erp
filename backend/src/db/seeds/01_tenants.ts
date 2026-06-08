// ─── Seed: Tenants ───────────────────────────────────────────
// Owner: M2
import { PrismaClient } from '@prisma/client'

export async function seedTenants(prisma: PrismaClient) {
  console.log('🏢 Seeding tenants...')

  const tenants = await Promise.all([
    prisma.tenant.upsert({
      where: { slug: 'amdox-demo' },
      update: {},
      create: {
        name: 'Amdox Technologies',
        slug: 'amdox-demo',
        domain: 'amdox.com',
        plan: 'ENTERPRISE',
        isActive: true,
        settings: {
          timezone: 'Asia/Kolkata',
          currency: 'INR',
          dateFormat: 'DD/MM/YYYY',
          fiscalYearStart: '04', // April
        },
      },
    }),
    prisma.tenant.upsert({
      where: { slug: 'acme-corp' },
      update: {},
      create: {
        name: 'Acme Corporation',
        slug: 'acme-corp',
        domain: 'acme.com',
        plan: 'PROFESSIONAL',
        isActive: true,
        settings: {
          timezone: 'America/New_York',
          currency: 'USD',
          dateFormat: 'MM/DD/YYYY',
          fiscalYearStart: '01',
        },
      },
    }),
  ])

  console.log(`   ✅ ${tenants.length} tenants created`)
  return tenants
}
