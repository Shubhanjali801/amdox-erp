import { useNavigate, Navigate } from 'react-router-dom'
import PublicNavbar from '../components/common/PublicNavbar'

const modules = [
  { icon: '💰', name: 'Finance', desc: 'Ledger, AP/AR, payments, multi-currency' },
  { icon: '👥', name: 'HR & Payroll', desc: 'Employees, attendance, leave, gross-to-net payroll' },
  { icon: '📦', name: 'Supply Chain', desc: 'Vendors, inventory, purchase orders, GRN' },
  { icon: '📋', name: 'Projects', desc: 'Tasks, milestones, resources, budgets' },
  { icon: '🔮', name: 'AI Forecasting', desc: 'LSTM + Prophet demand prediction' },
  { icon: '📊', name: 'BI Dashboards', desc: 'Live KPIs, widgets, scheduled reports' },
]

const features = [
  { icon: '🤖', title: 'AI-Native', desc: 'Built-in demand forecasting and tamper-evident audit — not bolted-on add-ons.' },
  { icon: '🏢', title: 'Multi-Tenant SaaS', desc: 'Full row-level tenant isolation from day one. One platform, many companies.' },
  { icon: '⚡', title: 'Modern & API-First', desc: 'React + Node + Prisma + FastAPI. Fast, webhook-driven, no vendor lock-in.' },
  { icon: '🔐', title: 'Enterprise Security', desc: 'JWT + RBAC, Joi validation, hash-chained audit logs, OWASP-aligned.' },
]

export default function Landing() {
  const navigate = useNavigate()
  // Logged-in users skip the marketing page
  if (localStorage.getItem('accessToken')) return <Navigate to="/dashboard" replace />

  return (
    <div className="min-h-screen bg-white">
      <PublicNavbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-white">
        <div className="max-w-7xl mx-auto px-6 py-20 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-sm font-semibold tracking-wide text-blue-600 uppercase mb-3">
              AI-Powered Cloud ERP Suite
            </p>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 leading-tight">
              The intelligent ERP<br />for modern business
            </h1>
            <p className="mt-5 text-lg text-gray-600 max-w-xl">
              Unify finance, supply chain, HR, projects and business intelligence on one
              AI-augmented, multi-tenant platform — built for mid-market and enterprise teams.
            </p>
            <div className="mt-8 flex gap-4">
              <button
                onClick={() => navigate('/register')}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition"
              >
                Get started free
              </button>
              <button
                onClick={() => navigate('/login')}
                className="border border-gray-300 hover:border-blue-600 hover:text-blue-600 text-gray-700 font-semibold px-6 py-3 rounded-lg transition"
              >
                Sign in
              </button>
            </div>
            <p className="mt-4 text-xs text-gray-400">99.9% uptime target · SOC 2-aligned · GDPR-ready architecture</p>
          </div>

          {/* Hero visual — mock dashboard */}
          <div className="relative">
            <div className="rounded-2xl bg-white shadow-2xl border border-gray-100 p-5">
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[['Revenue', '$1.2M', 'text-green-600'], ['Orders', '348', 'text-blue-600'], ['Low stock', '7', 'text-amber-600']].map(([l, v, c]) => (
                  <div key={l} className="rounded-xl bg-gray-50 p-3">
                    <div className="text-xs text-gray-500">{l}</div>
                    <div className={`text-lg font-bold ${c}`}>{v}</div>
                  </div>
                ))}
              </div>
              <div className="h-32 rounded-xl bg-gradient-to-tr from-blue-100 to-indigo-100 flex items-end gap-2 p-3">
                {[40, 65, 50, 80, 60, 95, 75].map((h, i) => (
                  <div key={i} className="flex-1 rounded-t bg-blue-500/70" style={{ height: `${h}%` }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="why" className="max-w-7xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-3">Why Amdox ERP</h2>
        <p className="text-center text-gray-500 mb-12">What sets us apart from SAP, Odoo, Dynamics 365 and NetSuite</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f) => (
            <div key={f.title} className="rounded-xl border border-gray-100 p-6 hover:shadow-lg transition">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-semibold text-gray-900 mb-1">{f.title}</h3>
              <p className="text-sm text-gray-600">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Modules */}
      <section id="modules" className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">One platform, every workflow</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map((m) => (
              <div key={m.name} className="rounded-xl bg-white border border-gray-100 p-6 hover:shadow-lg transition">
                <div className="text-3xl mb-3">{m.icon}</div>
                <h3 className="font-semibold text-gray-900 mb-1">{m.name}</h3>
                <p className="text-sm text-gray-600">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-600 py-16">
        <div className="max-w-3xl mx-auto px-6 text-center text-white">
          <h2 className="text-3xl font-bold mb-3">Ready to run your business smarter?</h2>
          <p className="text-blue-100 mb-8">Spin up your company in minutes — no credit card required.</p>
          <button
            onClick={() => navigate('/register')}
            className="bg-white text-blue-600 font-semibold px-8 py-3 rounded-lg hover:bg-blue-50 transition"
          >
            Create your company
          </button>
        </div>
      </section>

      <footer className="bg-gray-900 text-gray-400 text-sm py-8 text-center">
        © {new Date().getFullYear()} Amdox Technologies · AI-Powered Cloud ERP Suite
      </footer>
    </div>
  )
}
