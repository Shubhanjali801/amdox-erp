// ─── Seed: Users ─────────────────────────────────────────────
// Owner: M2
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

export async function seedUsers(
  prisma: PrismaClient,
  tenantId: string,
  roles: { superAdmin: any; tenantAdmin: any; manager: any; viewer: any }
) {
  console.log('👤 Seeding users...')

  const hash = (pwd: string) => bcrypt.hashSync(pwd, 10)

  const usersData = [
    {
      email: 'admin@amdox.com',
      firstName: 'Super',
      lastName: 'Admin',
      roleId: roles.superAdmin.id,
      password: 'Admin@1234',
    },
    {
      email: 'finance@amdox.com',
      firstName: 'Priya',
      lastName: 'Sharma',
      roleId: roles.tenantAdmin.id,
      password: 'Finance@1234',
    },
    {
      email: 'hr@amdox.com',
      firstName: 'Rahul',
      lastName: 'Verma',
      roleId: roles.manager.id,
      password: 'HR@1234',
    },
    {
      email: 'supply@amdox.com',
      firstName: 'Amit',
      lastName: 'Singh',
      roleId: roles.manager.id,
      password: 'Supply@1234',
    },
    {
      email: 'pm@amdox.com',
      firstName: 'Sneha',
      lastName: 'Patel',
      roleId: roles.manager.id,
      password: 'PM@1234',
    },
    {
      email: 'viewer@amdox.com',
      firstName: 'Rohit',
      lastName: 'Kumar',
      roleId: roles.viewer.id,
      password: 'Viewer@1234',
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
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId: u.roleId } },
      update: {},
      create: { userId: user.id, roleId: u.roleId },
    })
    users.push(user)
  }

  console.log(`   ✅ ${users.length} users created`)
  console.log('   📋 Test credentials:')
  usersData.forEach(u => console.log(`      ${u.email} / ${u.password}`))
  return users
}
