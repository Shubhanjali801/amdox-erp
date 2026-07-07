// ─── Seed: Roles & Permissions ───────────────────────────────
// Owner: M2
import { PrismaClient } from '@prisma/client'

const PERMISSIONS = [
  // Finance
  { resource: 'finance', action: 'create' },
  { resource: 'finance', action: 'read' },
  { resource: 'finance', action: 'update' },
  { resource: 'finance', action: 'delete' },
  { resource: 'finance', action: 'approve' },
  { resource: 'finance', action: 'export' },
  // HR
  { resource: 'hr', action: 'create' },
  { resource: 'hr', action: 'read' },
  { resource: 'hr', action: 'update' },
  { resource: 'hr', action: 'delete' },
  { resource: 'hr', action: 'approve' },
  { resource: 'hr', action: 'run_payroll' },
  // Supply Chain
  { resource: 'supply_chain', action: 'create' },
  { resource: 'supply_chain', action: 'read' },
  { resource: 'supply_chain', action: 'update' },
  { resource: 'supply_chain', action: 'delete' },
  { resource: 'supply_chain', action: 'approve' },
  // Projects
  { resource: 'project', action: 'create' },
  { resource: 'project', action: 'read' },
  { resource: 'project', action: 'update' },
  { resource: 'project', action: 'delete' },
  // Dashboard & Reports
  { resource: 'dashboard', action: 'create' },
  { resource: 'dashboard', action: 'read' },
  { resource: 'dashboard', action: 'update' },
  { resource: 'report', action: 'read' },
  { resource: 'report', action: 'export' },
  // Admin
  { resource: 'user', action: 'create' },
  { resource: 'user', action: 'read' },
  { resource: 'user', action: 'update' },
  { resource: 'user', action: 'delete' },
  { resource: 'settings', action: 'read' },
  { resource: 'settings', action: 'update' },
  { resource: 'audit', action: 'read' },
]

export async function seedRolesAndPermissions(
  prisma: PrismaClient,
  tenantId: string
) {
  console.log('🔐 Seeding roles & permissions...')

  // Create all permissions (global, not tenant-specific)
  for (const perm of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { resource_action: perm },
      update: {},
      create: perm,
    })
  }

  const allPerms = await prisma.permission.findMany()
  const permMap = Object.fromEntries(
    allPerms.map((p) => [`${p.resource}:${p.action}`, p.id])
  )

  // ── Super Admin Role (all permissions) ──
  const superAdmin = await prisma.role.upsert({
    where: { tenantId_name: { tenantId, name: 'super_admin' } },
    update: {},
    create: { tenantId, name: 'super_admin', isSystem: true, description: 'Full access' },
  })
  for (const perm of allPerms) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: superAdmin.id, permissionId: perm.id } },
      update: {},
      create: { roleId: superAdmin.id, permissionId: perm.id },
    })
  }

  // ── Tenant Admin Role ──
  const tenantAdmin = await prisma.role.upsert({
    where: { tenantId_name: { tenantId, name: 'tenant_admin' } },
    update: {},
    create: { tenantId, name: 'tenant_admin', isSystem: true, description: 'Tenant-level admin' },
  })
  const adminPerms = ['finance:read','finance:approve','hr:read','hr:approve',
    'supply_chain:read','supply_chain:approve','project:read','dashboard:read',
    'user:create','user:read','user:update','settings:read','settings:update','audit:read']
  for (const key of adminPerms) {
    if (permMap[key]) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: tenantAdmin.id, permissionId: permMap[key] } },
        update: {},
        create: { roleId: tenantAdmin.id, permissionId: permMap[key] },
      })
    }
  }

  // ── Manager Role ──
  const manager = await prisma.role.upsert({
    where: { tenantId_name: { tenantId, name: 'manager' } },
    update: {},
    create: { tenantId, name: 'manager', isSystem: true, description: 'Department manager' },
  })
  const managerPerms = ['finance:read','hr:read','hr:approve','supply_chain:read',
    'supply_chain:create','project:read','project:update','dashboard:read','report:read']
  for (const key of managerPerms) {
    if (permMap[key]) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: manager.id, permissionId: permMap[key] } },
        update: {},
        create: { roleId: manager.id, permissionId: permMap[key] },
      })
    }
  }

  // ── Viewer Role ──
  const viewer = await prisma.role.upsert({
    where: { tenantId_name: { tenantId, name: 'viewer' } },
    update: {},
    create: { tenantId, name: 'viewer', isSystem: true, description: 'Read-only access' },
  })
  const viewerPerms = ['finance:read','hr:read','supply_chain:read','project:read','dashboard:read']
  for (const key of viewerPerms) {
    if (permMap[key]) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: viewer.id, permissionId: permMap[key] } },
        update: {},
        create: { roleId: viewer.id, permissionId: permMap[key] },
      })
    }
  }

  // ── Department-scoped roles ──────────────────────────────────
  // Each role is limited to ONE module (+ dashboard) so RBAC is visible:
  // a finance_manager sees only Finance, an hr_manager only HR, etc.
  const deptRoles: Record<string, { desc: string; perms: string[] }> = {
    finance_manager: {
      desc: 'Finance module only',
      perms: ['finance:create','finance:read','finance:update','finance:delete','finance:approve','finance:export'],
    },
    hr_manager: {
      desc: 'HR & Payroll module only',
      perms: ['hr:create','hr:read','hr:update','hr:delete','hr:approve','hr:run_payroll'],
    },
    supply_chain_manager: {
      desc: 'Supply Chain module only',
      perms: ['supply_chain:create','supply_chain:read','supply_chain:update','supply_chain:delete','supply_chain:approve'],
    },
    project_manager: {
      desc: 'Projects module only',
      perms: ['project:create','project:read','project:update','project:delete'],
    },
  }

  const dept: Record<string, any> = {}
  for (const [name, def] of Object.entries(deptRoles)) {
    const role = await prisma.role.upsert({
      where: { tenantId_name: { tenantId, name } },
      update: {},
      create: { tenantId, name, isSystem: true, description: def.desc },
    })
    for (const key of def.perms) {
      if (permMap[key]) {
        await prisma.rolePermission.upsert({
          where: { roleId_permissionId: { roleId: role.id, permissionId: permMap[key] } },
          update: {},
          create: { roleId: role.id, permissionId: permMap[key] },
        })
      }
    }
    dept[name] = role
  }

  console.log(`   ✅ ${PERMISSIONS.length} permissions + 8 roles created`)
  return { superAdmin, tenantAdmin, manager, viewer, ...dept }
}
