import { Routes, Route, Navigate } from 'react-router-dom'
import { Suspense, lazy } from 'react'

// Eagerly loaded
import Login from './pages/Login'
import NotFound from './pages/NotFound'

// Lazy loaded pages (each member adds their routes here)
const Dashboard     = lazy(() => import('./pages/Dashboard'))

// Finance (M3)
const Ledger        = lazy(() => import('./pages/Finance/Ledger'))
const Payables      = lazy(() => import('./pages/Finance/Payables'))
const Receivables   = lazy(() => import('./pages/Finance/Receivables'))
const FinReports    = lazy(() => import('./pages/Finance/Reports'))

// HR (M4)
const Employees     = lazy(() => import('./pages/HR/Employees'))
const Payroll       = lazy(() => import('./pages/HR/Payroll'))
const Leave         = lazy(() => import('./pages/HR/Leave'))
const Attendance    = lazy(() => import('./pages/HR/Attendance'))

// Projects (M4)
const ProjectsList  = lazy(() => import('./pages/Projects/ProjectsList'))
const ProjectDetail = lazy(() => import('./pages/Projects/ProjectDetail'))

// Supply Chain (M5)
const PurchaseOrders = lazy(() => import('./pages/SupplyChain/PurchaseOrders'))
const Inventory      = lazy(() => import('./pages/SupplyChain/Inventory'))
const Vendors        = lazy(() => import('./pages/SupplyChain/Vendors'))
const Forecasting    = lazy(() => import('./pages/SupplyChain/Forecasting'))

// Settings (M2)
const SettingsGeneral = lazy(() => import('./pages/Settings/General'))
const SettingsUsers   = lazy(() => import('./pages/Settings/Users'))
const SettingsRoles   = lazy(() => import('./pages/Settings/Roles'))

const Loader = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
  </div>
)

export default function App() {
  return (
    <Suspense fallback={<Loader />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Finance — M3 */}
        <Route path="/finance/ledger"       element={<Ledger />} />
        <Route path="/finance/payables"     element={<Payables />} />
        <Route path="/finance/receivables"  element={<Receivables />} />
        <Route path="/finance/reports"      element={<FinReports />} />

        {/* HR — M4 */}
        <Route path="/hr/employees"  element={<Employees />} />
        <Route path="/hr/payroll"    element={<Payroll />} />
        <Route path="/hr/leave"      element={<Leave />} />
        <Route path="/hr/attendance" element={<Attendance />} />

        {/* Projects — M4 */}
        <Route path="/projects"         element={<ProjectsList />} />
        <Route path="/projects/:id"     element={<ProjectDetail />} />

        {/* Supply Chain — M5 */}
        <Route path="/supply-chain/purchase-orders" element={<PurchaseOrders />} />
        <Route path="/supply-chain/inventory"       element={<Inventory />} />
        <Route path="/supply-chain/vendors"         element={<Vendors />} />
        <Route path="/supply-chain/forecasting"     element={<Forecasting />} />

        {/* Settings — M2 */}
        <Route path="/settings"              element={<SettingsGeneral />} />
        <Route path="/settings/users"        element={<SettingsUsers />} />
        <Route path="/settings/roles"        element={<SettingsRoles />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  )
}
