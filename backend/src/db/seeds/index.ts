// ============================================================
// Amdox ERP — Main Seed Runner
// Run: npx ts-node src/db/seeds/index.ts
//   or: npm run seed
// ============================================================
import { PrismaClient } from '@prisma/client'
import { seedTenants }              from './01_tenants'
import { seedRolesAndPermissions }  from './02_roles_permissions'
import { seedUsers }                from './03_users'
import { seedFinance }              from './04_finance'
import { seedHR }                   from './05_hr'
import { seedSupplyChain }          from './06_supply_chain'
import { seedProjects }             from './07_projects'
import { seedDashboard }            from './08_dashboard'

const prisma = new PrismaClient()

async function main() {
  console.log('\n🌱 Starting Amdox ERP seed...\n')
  console.log('━'.repeat(50))

  // Step 1 — Tenants
  const tenants = await seedTenants(prisma)
  const tenant  = tenants[0] // Amdox demo tenant
  const tenantId = tenant.id

  // Step 2 — Roles & Permissions
  const roles = await seedRolesAndPermissions(prisma, tenantId)

  // Step 3 — Users
  const users = await seedUsers(prisma, tenantId, roles)

  // Step 4 — Finance (GL accounts, periods, FX rates)
  await seedFinance(prisma, tenantId)

  // Step 5 — HR (departments, employees, leave types)
  const { employees } = await seedHR(prisma, tenantId, users)

  // Step 6 — Supply Chain (vendors, inventory)
  await seedSupplyChain(prisma, tenantId)

  // Step 7 — Projects
  await seedProjects(prisma, tenantId, employees)

  // Step 8 — Dashboard & Widgets
  const adminUser = users[0]
  await seedDashboard(prisma, tenantId, adminUser.id)

  console.log('\n' + '━'.repeat(50))
  console.log('✅ All seed data created successfully!\n')
  console.log('🔑 Login credentials:')
  console.log('   admin@amdox.com    /  Admin@1234     (Super Admin)')
  console.log('   finance@amdox.com  /  Finance@1234   (Finance Manager)')
  console.log('   hr@amdox.com       /  HR@1234        (HR Manager)')
  console.log('   supply@amdox.com   /  Supply@1234    (Supply Chain Lead)')
  console.log('   pm@amdox.com       /  PM@1234        (Project Manager)')
  console.log('   viewer@amdox.com   /  Viewer@1234    (Read-Only)\n')
  console.log('🌐 App:     http://localhost:3000')
  console.log('📡 API:     http://localhost:5000')
  console.log('📖 Swagger: http://localhost:5000/api-docs')
  console.log('🗄️  DB UI:   http://localhost:8081\n')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
