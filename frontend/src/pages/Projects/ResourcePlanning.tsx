import { useQuery } from '@tanstack/react-query'
import { projectService } from '../../services/projectService'
import DataTable, { Column } from '../../components/common/DataTable'
import { PageHeader } from '../../components/common/Modal'

const money = (n: any) => `$${Number(n ?? 0).toLocaleString()}`

export default function ResourcePlanning() {
  const budgetQ = useQuery({ queryKey: ['budget-summary'], queryFn: () => projectService.budgetSummary() })
  const resQ = useQuery({ queryKey: ['resources'], queryFn: () => projectService.listResources() })

  const budgets = Array.isArray(budgetQ.data) ? budgetQ.data : (budgetQ.data?.data ?? [])
  const resources = Array.isArray(resQ.data) ? resQ.data : (resQ.data?.data ?? [])

  const budgetCols: Column<any>[] = [
    { key: 'code', header: 'Project', render: (b) => `${b.code} — ${b.name}` },
    { key: 'budget', header: 'Budget', render: (b) => money(b.budget) },
    { key: 'actualCost', header: 'Actual', render: (b) => money(b.actualCost) },
    { key: 'variance', header: 'Variance', render: (b) => <span className={b.overBudget ? 'text-red-400' : 'text-green-500'}>{money(b.variance)}</span> },
    { key: 'utilizationPct', header: 'Used %', render: (b) => `${b.utilizationPct ?? 0}%` },
  ]

  const resCols: Column<any>[] = [
    { key: 'project', header: 'Project', render: (r) => r.project?.name || '—' },
    { key: 'employee', header: 'Employee', render: (r) => r.employee?.employeeCode || '—' },
    { key: 'role', header: 'Role', render: (r) => r.role || '—' },
    { key: 'allocation', header: 'Allocation', render: (r) => `${Number(r.allocation ?? 0)}%` },
  ]

  return (
    <div className="space-y-8">
      <PageHeader title="Resource Planning" subtitle="Budgets &amp; allocations across projects" />

      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Budget vs Actual</h2>
        <DataTable columns={budgetCols} rows={budgets} loading={budgetQ.isLoading} error={budgetQ.isError ? 'Could not load budgets' : null} rowKey={(b) => b.projectId} />
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Resource Allocations</h2>
        <DataTable columns={resCols} rows={resources} loading={resQ.isLoading} error={resQ.isError ? 'Could not load resources' : null} rowKey={(r) => r.id} />
      </div>
    </div>
  )
}
