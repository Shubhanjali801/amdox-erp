import { useQuery } from '@tanstack/react-query'
import api from '../../services/api'
import { financeService } from '../../services/financeService'
import DataTable, { Column } from '../../components/common/DataTable'
import MetricsCard from '../../components/Dashboard/MetricsCard'
import { PageHeader } from '../../components/common/Modal'

const money = (n: number) => `$${Number(n ?? 0).toLocaleString()}`

export default function Reports() {
  const summaryQ = useQuery({
    queryKey: ['fin-report'],
    queryFn: () => api.get('/reports/generate/financial-summary').then((r) => r.data?.data?.data ?? r.data?.data ?? {}),
  })
  const paymentsQ = useQuery({ queryKey: ['payments'], queryFn: () => financeService.listPayments() })
  const s = summaryQ.data || {}
  const payments = Array.isArray(paymentsQ.data) ? paymentsQ.data : (paymentsQ.data?.data ?? [])

  const columns: Column<any>[] = [
    { key: 'invoice', header: 'Invoice', render: (p) => p.invoice?.invoiceNumber || '—' },
    { key: 'amount', header: 'Amount', render: (p) => money(p.amount) },
    { key: 'method', header: 'Method' },
    { key: 'status', header: 'Status', render: (p) => <span className="text-green-500">{p.status}</span> },
    { key: 'paymentDate', header: 'Date', render: (p) => p.paymentDate ? new Date(p.paymentDate).toLocaleDateString() : '—' },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title="Financial Reports" subtitle="Live financial summary" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricsCard label="Total Receivable" value={money(s.totalReceivable)} icon="📈" accent="blue" />
        <MetricsCard label="Total Payable" value={money(s.totalPayable)} icon="📉" accent="amber" />
        <MetricsCard label="Payments Received" value={money(s.paymentsReceived)} icon="💵" accent="green" />
        <MetricsCard label="Invoices" value={s.invoiceCount ?? 0} icon="🧾" accent="violet" />
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Recent Payments</h2>
        <DataTable columns={columns} rows={payments} loading={paymentsQ.isLoading} error={paymentsQ.isError ? 'Could not load payments' : null} rowKey={(p) => p.id} />
      </div>
    </div>
  )
}
