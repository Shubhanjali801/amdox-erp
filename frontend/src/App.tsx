import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import Layout from './components/common/Layout'
import PrivateRoute from './components/Auth/PrivateRoute'
import SettingsLayout from './components/Settings/SettingsLayout'
import SupplyChainLayout from './components/SupplyChain/SupplyChainLayout'
import FinanceLayout from './components/Finance/FinanceLayout'
import HRLayout from './components/HR/HRLayout'

// Eagerly loaded
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import NotFound from './pages/NotFound'

// Lazy-loaded pages
const Dashboard      = lazy(() => import('./pages/Dashboard'))

// Finance (M3)
const Ledger         = lazy(() => import('./pages/Finance/Ledger'))
const Payables       = lazy(() => import('./pages/Finance/Payables'))
const Receivables    = lazy(() => import('./pages/Finance/Receivables'))
const FinReports     = lazy(() => import('./pages/Finance/Reports'))

// HR (M4)
const Employees      = lazy(() => import('./pages/HR/Employees'))
const Payroll        = lazy(() => import('./pages/HR/Payroll'))
const Leave          = lazy(() => import('./pages/HR/Leave'))
const Attendance     = lazy(() => import('./pages/HR/Attendance'))

// Projects (M4)
const ProjectsList   = lazy(() => import('./pages/Projects/ProjectsList'))
const ProjectDetail  = lazy(() => import('./pages/Projects/ProjectDetail'))
const ResourcePlanning = lazy(() => import('./pages/Projects/ResourcePlanning'))

// Supply Chain (M5)
const PurchaseOrders = lazy(() => import('./pages/SupplyChain/PurchaseOrders'))
const Inventory      = lazy(() => import('./pages/SupplyChain/Inventory'))
const Vendors        = lazy(() => import('./pages/SupplyChain/Vendors'))
const Forecasting    = lazy(() => import('./pages/SupplyChain/Forecasting'))

// Settings (M2)
const SettingsGeneral = lazy(() => import('./pages/Settings/General'))
const SettingsUsers   = lazy(() => import('./pages/Settings/Users'))
const SettingsRoles   = lazy(() => import('./pages/Settings/Roles'))
const SettingsIntegrations = lazy(() => import('./pages/Settings/Integrations'))
const SettingsSecurity = lazy(() => import('./pages/Settings/Security'))
const SettingsAppearance = lazy(() => import('./pages/Settings/Appearance'))

const Loader = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
  </div>
)

// Wraps protected pages in the sidebar/topbar shell
const ProtectedLayout = () => (
  <Layout>
    <Suspense fallback={<Loader />}>
      <Outlet />
    </Suspense>
  </Layout>
)

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Protected — requires JWT, rendered inside Layout shell */}
      <Route element={<PrivateRoute />}>
        <Route element={<ProtectedLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />

          {/* Finance */}
          <Route path="/finance" element={<FinanceLayout />}>
            <Route index element={<Ledger />} />
            <Route path="ledger"      element={<Ledger />} />
            <Route path="payables"    element={<Payables />} />
            <Route path="receivables" element={<Receivables />} />
            <Route path="reports"     element={<FinReports />} />
          </Route>

          {/* HR */}
          <Route path="/hr" element={<HRLayout />}>
            <Route index element={<Employees />} />
            <Route path="employees"  element={<Employees />} />
            <Route path="attendance" element={<Attendance />} />
            <Route path="leave"      element={<Leave />} />
            <Route path="payroll"    element={<Payroll />} />
          </Route>

          {/* Projects */}
          <Route path="/projects"           element={<ProjectsList />} />
          <Route path="/projects/resources" element={<ResourcePlanning />} />
          <Route path="/projects/:id"       element={<ProjectDetail />} />

          {/* Supply Chain */}
          <Route path="/supply-chain" element={<SupplyChainLayout />}>
            <Route index element={<Vendors />} />
            <Route path="vendors"         element={<Vendors />} />
            <Route path="inventory"       element={<Inventory />} />
            <Route path="purchase-orders" element={<PurchaseOrders />} />
            <Route path="forecasting"     element={<Forecasting />} />
          </Route>

          {/* Settings */}
          <Route path="/settings" element={<SettingsLayout />}>
            <Route index element={<SettingsGeneral />} />
            <Route path="users" element={<SettingsUsers />} />
            <Route path="roles" element={<SettingsRoles />} />
            <Route path="security" element={<SettingsSecurity />} />
            <Route path="appearance" element={<SettingsAppearance />} />
            <Route path="integrations" element={<SettingsIntegrations />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
