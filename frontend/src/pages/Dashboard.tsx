import { useQuery } from '@tanstack/react-query'
import { dashboardService } from '../services/dashboardService'
import MetricsCard from '../components/Dashboard/MetricsCard'
import PieChart from '../components/Charts/PieChart'
import BarChart from '../components/Charts/BarChart'

const money = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n || 0)

export default function Dashboard() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardService.getStats,
  })

  if (isLoading) {
    return <div className="text-gray-400">Loading dashboard…</div>
  }

  if (isError || !data) {
    return (
      <div className="bg-red-900/30 border border-red-700 text-red-300 rounded-xl p-6">
        Could not load dashboard stats. Make sure the backend is running and the
        Dashboard/BI module is available at <code>/dashboards/stats/overview</code>.
      </div>
    )
  }

  const arVsAp = [
    { name: 'AR Outstanding', value: data.finance.arOutstanding },
    { name: 'AP Outstanding', value: data.finance.apOutstanding },
  ]
  const projectsByStatus = Object.entries(data.projects.byStatus || {}).map(([name, value]) => ({ name, value }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Executive Dashboard</h1>
        <p className="text-gray-400 text-sm mt-1">
          Company-wide KPIs · updated {new Date(data.generatedAt).toLocaleString()}
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricsCard label="Payments Received" value={money(data.finance.paymentsReceived)} icon="💵" accent="green" />
        <MetricsCard label="AR Outstanding" value={money(data.finance.arOutstanding)} icon="📈" accent="blue" />
        <MetricsCard label="AP Outstanding" value={money(data.finance.apOutstanding)} icon="📉" accent="amber" />
        <MetricsCard label="Invoices" value={data.finance.invoices} icon="🧾" accent="violet" />
        <MetricsCard label="Employees" value={data.hr.employees} icon="👥" accent="blue" />
        <MetricsCard label="Inventory Items" value={data.supply.inventoryItems} icon="📦" accent="blue" />
        <MetricsCard
          label="Low-Stock Items"
          value={data.supply.lowStockItems}
          icon="⚠️"
          accent={data.supply.lowStockItems > 0 ? 'red' : 'green'}
          hint={data.supply.lowStockItems > 0 ? 'Need reordering' : 'All stocked'}
        />
        <MetricsCard label="Active Projects" value={data.projects.total} icon="📋" accent="violet" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <PieChart title="Receivables vs Payables" data={arVsAp} />
        <BarChart title="Projects by Status" data={projectsByStatus} color="#8b5cf6" />
      </div>
    </div>
  )
}
