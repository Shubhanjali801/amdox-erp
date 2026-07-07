// ─── Seed: Users ─────────────────────────────────────────────
// Owner: M2
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

export async function seedUsers(
  prisma: PrismaClient,
  tenantId: string,
  roles: Record<string, any>
) {
  console.log('👤 Seeding users...')

  const hash = (pwd: string) => bcrypt.hashSync(pwd, 10)

  // Each demo user is bound to a role scoped to one module, so logging in as
  // finance@ shows only Finance, hr@ only HR, etc. — a live RBAC demo.
  const usersData = [
    {
      email: 'admin@amdox.com',
      firstName: 'Super',
      lastName: 'Admin',
      roleId: roles.superAdmin.id,
      password: 'Admin@1234',
      sees: 'everything',
    },
    {
      email: 'finance@amdox.com',
      firstName: 'Priya',
      lastName: 'Sharma',
      roleId: roles.finance_manager.id,
      password: 'Finance@1234',
      sees: 'Finance only',
    },
    {
      email: 'hr@amdox.com',
      firstName: 'Rahul',
      lastName: 'Verma',
      roleId: roles.hr_manager.id,
      password: 'HR@1234',
      sees: 'HR & Payroll only',
    },
    {
      email: 'supply@amdox.com',
      firstName: 'Amit',
      lastName: 'Singh',
      roleId: roles.supply_chain_manager.id,
      password: 'Supply@1234',
      sees: 'Supply Chain only',
    },
    {
      email: 'pm@amdox.com',
      firstName: 'Sneha',
      lastName: 'Patel',
      roleId: roles.project_manager.id,
      password: 'PM@1234',
      sees: 'Projects only',
    },
    {
      email: 'viewer@amdox.com',
      firstName: 'Rohit',
      lastName: 'Kumar',
      roleId: roles.viewer.id,
      password: 'Viewer@1234',
      sees: 'read-only, all modules',
    },
  ]

  const users = []
  for (const u of usersData) {
    const user = await prisma.user.upsert({
      where: { tenantId_email: { tenantId, email: u.email } },
      update: {},
      create: {
        tenantId,
        email: u.email,
        passwordHash: hash(u.password),
        firstName: u.firstName,
        lastName: u.lastName,
        isActive: true,
        mfaEnabled: false,
      },
    })
    // Ensure the user has EXACTLY the intended role — clear any prior
    // assignments first so re-seeding an existing DB reassigns cleanly.
    await prisma.userRole.deleteMany({ where: { userId: user.id } })
    await prisma.userRole.create({ data: { userId: user.id, roleId: u.roleId } })
    users.push(user)
  }

  console.log(`   ✅ ${users.length} users created`)
  console.log('   📋 Test credentials (role-based access):')
  usersData.forEach(u => console.log(`      ${u.email} / ${u.password}  → ${u.sees}`))
  return users
}
