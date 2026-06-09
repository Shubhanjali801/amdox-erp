// ─── Seed: Projects ───────────────────────────────────────────
// Owner: M4
import { PrismaClient } from '@prisma/client'

export async function seedProjects(
  prisma: PrismaClient,
  tenantId: string,
  employees: any[]
) {
  console.log('📋 Seeding project data...')

  const manager = employees[4] // pm@amdox.com

  // ── Projects ───────────────────────────────────────────────
  const projectsData = [
    {
      code: 'PROJ-001',
      name: 'ERP Implementation Phase 1',
      status: 'ACTIVE' as const,
      budget: 2500000,
      startDate: new Date('2026-04-01'),
      endDate: new Date('2026-06-30'),
      clientName: 'Internal',
    },
    {
      code: 'PROJ-002',
      name: 'Mobile App Development',
      status: 'PLANNING' as const,
      budget: 1200000,
      startDate: new Date('2026-05-01'),
      endDate: new Date('2026-08-31'),
      clientName: 'Acme Corp',
    },
    {
      code: 'PROJ-003',
      name: 'Data Warehouse Migration',
      status: 'PLANNING' as const,
      budget: 800000,
      startDate: new Date('2026-06-01'),
      endDate: new Date('2026-09-30'),
      clientName: 'Internal',
    },
  ]

  const projects: any[] = []
  for (const p of projectsData) {
    const project = await prisma.project.upsert({
      where: { tenantId_code: { tenantId, code: p.code } },
      update: {},
      create: {
        tenantId,
        managerId: manager?.id,
        currency: 'INR',
        description: `${p.name} — seed data`,
        ...p,
      },
    })

    // ── Milestones ──────────────────────────────────────────
    const m1 = await prisma.projectMilestone.create({
      data: {
        projectId: project.id,
        name: 'Kickoff & Planning',
        dueDate: new Date(p.startDate.getTime() + 7 * 86400000),
        status: 'COMPLETED',
      },
    })
    const m2 = await prisma.projectMilestone.create({
      data: {
        projectId: project.id,
        name: 'Development Sprint 1',
        dueDate: new Date(p.startDate.getTime() + 30 * 86400000),
        status: 'IN_PROGRESS',
      },
    })

    // ── Tasks ───────────────────────────────────────────────
    await prisma.projectTask.createMany({
      data: [
        { projectId: project.id, milestoneId: m1.id, title: 'Requirements gathering', status: 'COMPLETED', priority: 'HIGH',   estimatedHours: 16, assignedTo: manager?.userId },
        { projectId: project.id, milestoneId: m1.id, title: 'Architecture design',    status: 'COMPLETED', priority: 'HIGH',   estimatedHours: 24, assignedTo: manager?.userId },
        { projectId: project.id, milestoneId: m2.id, title: 'Database schema design', status: 'COMPLETED', priority: 'HIGH',   estimatedHours: 8,  assignedTo: manager?.userId },
        { projectId: project.id, milestoneId: m2.id, title: 'API development',        status: 'IN_PROGRESS', priority: 'HIGH', estimatedHours: 40, assignedTo: manager?.userId },
        { projectId: project.id, milestoneId: m2.id, title: 'Frontend development',   status: 'TODO',      priority: 'MEDIUM', estimatedHours: 40, assignedTo: manager?.userId },
        { projectId: project.id, milestoneId: m2.id, title: 'Testing & QA',           status: 'TODO',      priority: 'HIGH',   estimatedHours: 20, assignedTo: manager?.userId },
      ],
    })

    // ── Resource Allocation ─────────────────────────────────
    if (manager) {
      await prisma.projectResource.upsert({
        where: { projectId_employeeId: { projectId: project.id, employeeId: manager.id } },
        update: {},
        create: {
          projectId: project.id,
          employeeId: manager.id,
          role: 'Project Manager',
          allocation: 80,
          startDate: p.startDate,
          endDate: p.endDate,
        },
      })
    }

    projects.push(project)
  }

  console.log(`   ✅ ${projects.length} projects + milestones + tasks created`)
  return projects
}
