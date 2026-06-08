// ─── Seed: Dashboard & Widgets ────────────────────────────────
// Owner: M6
import { PrismaClient } from '@prisma/client'

export async function seedDashboard(
  prisma: PrismaClient,
  tenantId: string,
  adminUserId: string
) {
  console.log('📊 Seeding dashboard data...')

  const dashboard = await prisma.dashboard.create({
    data: {
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
    },
  })

  await prisma.widget.createMany({
    data: [
      {
        id: 'w1', dashboardId: dashboard.id,
        title: 'Total Revenue',
        type: 'METRIC_CARD',
        dataSource: 'finance.revenue',
        config: { period: 'current_month', currency: 'INR' },
        position: { x: 0, y: 0, w: 3, h: 2 },
        refreshInterval: 300,
      },
      {
        id: 'w2', dashboardId: dashboard.id,
        title: 'Total Employees',
        type: 'METRIC_CARD',
        dataSource: 'hr.headcount',
        config: { status: 'ACTIVE' },
        position: { x: 3, y: 0, w: 3, h: 2 },
        refreshInterval: 3600,
      },
      {
        id: 'w3', dashboardId: dashboard.id,
        title: 'Open Purchase Orders',
        type: 'METRIC_CARD',
        dataSource: 'supply_chain.open_pos',
        config: { status: ['DRAFT', 'SENT', 'ACKNOWLEDGED'] },
        position: { x: 6, y: 0, w: 3, h: 2 },
        refreshInterval: 300,
      },
      {
        id: 'w4', dashboardId: dashboard.id,
        title: 'Active Projects',
        type: 'METRIC_CARD',
        dataSource: 'project.active_count',
        config: { status: 'ACTIVE' },
        position: { x: 9, y: 0, w: 3, h: 2 },
        refreshInterval: 3600,
      },
      {
        id: 'w5', dashboardId: dashboard.id,
        title: 'Monthly Revenue Trend',
        type: 'LINE_CHART',
        dataSource: 'finance.monthly_revenue',
        config: { months: 12, currency: 'INR' },
        position: { x: 0, y: 2, w: 6, h: 4 },
        refreshInterval: 3600,
      },
      {
        id: 'w6', dashboardId: dashboard.id,
        title: 'Expense Breakdown',
        type: 'PIE_CHART',
        dataSource: 'finance.expense_by_category',
        config: { period: 'current_quarter' },
        position: { x: 6, y: 2, w: 6, h: 4 },
        refreshInterval: 3600,
      },
    ],
  })

  // Scheduled report
  await prisma.scheduledReport.create({
    data: {
      tenantId,
      name: 'Weekly Finance Summary',
      reportType: 'finance_summary',
      format: 'PDF',
      schedule: '0 8 * * 1', // Every Monday 8am
      recipients: ['admin@amdox.com', 'finance@amdox.com'],
      config: { includePL: true, includeAging: true },
      isActive: true,
      nextRunAt: new Date('2026-04-07T08:00:00Z'),
    },
  })

  console.log('   ✅ 1 dashboard + 6 widgets + 1 scheduled report created')
  return dashboard
}
