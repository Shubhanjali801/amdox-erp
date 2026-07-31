// Seed: Dashboard & Widgets
// Owner: M6
import { PrismaClient } from '@prisma/client'

export async function seedDashboard(
  prisma: PrismaClient,
  tenantId: string,
  adminUserId: string
) {
  console.log('Seeding dashboard data...')

  const dashboardData = {
    tenantId,
    name: 'Executive Overview',
    description: 'Company-wide KPI dashboard',
    createdBy: adminUserId,
    isPublic: true,
    layout: [
      { i: 'w1', x: 0, y: 0, w: 3, h: 2 },
      { i: 'w2', x: 3, y: 0, w: 3, h: 2 },
      { i: 'w3', x: 6, y: 0, w: 3, h: 2 },
      { i: 'w4', x: 9, y: 0, w: 3, h: 2 },
      { i: 'w5', x: 0, y: 2, w: 6, h: 4 },
      { i: 'w6', x: 6, y: 2, w: 6, h: 4 },
    ],
  }

  const existingDashboard = await prisma.dashboard.findFirst({
    where: { tenantId, name: dashboardData.name },
  })

  const dashboard = existingDashboard
    ? await prisma.dashboard.update({
        where: { id: existingDashboard.id },
        data: dashboardData,
      })
    : await prisma.dashboard.create({
        data: dashboardData,
      })

  await prisma.widget.deleteMany({ where: { dashboardId: dashboard.id } })

  await prisma.widget.createMany({
    data: [
      {
        dashboardId: dashboard.id,
        title: 'Total Revenue',
        type: 'METRIC_CARD',
        dataSource: 'finance.revenue',
        config: { period: 'current_month', currency: 'INR' },
        position: { x: 0, y: 0, w: 3, h: 2 },
        refreshInterval: 300,
      },
      {
        dashboardId: dashboard.id,
        title: 'Total Employees',
        type: 'METRIC_CARD',
        dataSource: 'hr.headcount',
        config: { status: 'ACTIVE' },
        position: { x: 3, y: 0, w: 3, h: 2 },
        refreshInterval: 3600,
      },
      {
        dashboardId: dashboard.id,
        title: 'Open Purchase Orders',
        type: 'METRIC_CARD',
        dataSource: 'supply_chain.open_pos',
        config: { status: ['DRAFT', 'SENT', 'ACKNOWLEDGED'] },
        position: { x: 6, y: 0, w: 3, h: 2 },
        refreshInterval: 300,
      },
      {
        dashboardId: dashboard.id,
        title: 'Active Projects',
        type: 'METRIC_CARD',
        dataSource: 'project.active_count',
        config: { status: 'ACTIVE' },
        position: { x: 9, y: 0, w: 3, h: 2 },
        refreshInterval: 3600,
      },
      {
        dashboardId: dashboard.id,
        title: 'Monthly Revenue Trend',
        type: 'LINE_CHART',
        dataSource: 'finance.monthly_revenue',
        config: { months: 12, currency: 'INR' },
        position: { x: 0, y: 2, w: 6, h: 4 },
        refreshInterval: 3600,
      },
      {
        dashboardId: dashboard.id,
        title: 'Expense Breakdown',
        type: 'PIE_CHART',
        dataSource: 'finance.expense_by_category',
        config: { period: 'current_quarter' },
        position: { x: 6, y: 2, w: 6, h: 4 },
        refreshInterval: 3600,
      },
    ],
  })

  const reportData = {
    tenantId,
    name: 'Weekly Finance Summary',
    reportType: 'finance_summary',
    format: 'PDF' as const,
    schedule: '0 8 * * 1',
    recipients: ['admin@amdox.com', 'finance@amdox.com'],
    config: { includePL: true, includeAging: true },
    isActive: true,
    nextRunAt: new Date('2026-04-07T08:00:00Z'),
  }

  const existingReport = await prisma.scheduledReport.findFirst({
    where: { tenantId, name: reportData.name },
  })

  if (existingReport) {
    await prisma.scheduledReport.update({
      where: { id: existingReport.id },
      data: reportData,
    })
  } else {
    await prisma.scheduledReport.create({ data: reportData })
  }

  console.log('   1 dashboard + 6 widgets + 1 scheduled report ready')
  return dashboard
}
