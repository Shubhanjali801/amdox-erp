import { useNavigate, Navigate } from 'react-router-dom'
import PublicNavbar from '../components/common/PublicNavbar'
import { firstAccessiblePath } from '../utils/permissions'

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
  // Logged-in users skip the marketing page → their first accessible area
  if (localStorage.getItem('accessToken')) return <Navigate to={firstAccessiblePath()} replace />

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
      <section id="features" className="max-w-7xl mx-auto px-6 py-20">
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

      <footer className="bg-gray-900 text-gray-400 text-sm py-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>
            © {new Date().getFullYear()}{' '}
            <a href="https://www.amdox.in/" target="_blank" rel="noopener noreferrer" className="hover:text-white">Amdox Technologies</a>
            {' '}· AI-Powered Cloud ERP Suite
          </span>
          <div className="flex items-center gap-5">
            <a href="https://www.amdox.in/" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400" title="Website">🌐 Website</a>
            <a href="https://www.linkedin.com/company/amdox-technologies/" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400">
              <svg className="w-5 h-5 inline" fill="currentColor" viewBox="0 0 24 24"><path d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM0 8h5v16H0V8zm7.5 0h4.8v2.2h.07c.67-1.2 2.3-2.46 4.73-2.46 5.06 0 6 3.33 6 7.66V24h-5v-7.4c0-1.77-.03-4.04-2.46-4.04-2.46 0-2.84 1.92-2.84 3.9V24h-5V8z"/></svg>
            </a>
            <a href="https://www.instagram.com/amdoxtech/" target="_blank" rel="noopener noreferrer" className="hover:text-pink-400">
              <svg className="w-5 h-5 inline" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.72 3.72 0 01-1.38-.9 3.72 3.72 0 01-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16zM12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.33 4.14.63c-.79.3-1.46.72-2.12 1.38C1.36 2.67.94 3.34.63 4.14.33 4.9.13 5.78.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.26 2.15.56 2.91.3.79.72 1.46 1.38 2.12.66.66 1.33 1.08 2.12 1.38.76.3 1.64.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.27-.06 2.15-.26 2.91-.56.79-.3 1.46-.72 2.12-1.38.66-.66 1.08-1.33 1.38-2.12.3-.76.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.26-2.15-.56-2.91-.3-.79-.72-1.46-1.38-2.12C21.33 1.36 20.66.94 19.86.63 19.1.33 18.22.13 16.95.07 15.67.01 15.26 0 12 0zm0 5.84A6.16 6.16 0 105.84 12 6.16 6.16 0 0012 5.84zM12 16a4 4 0 110-8 4 4 0 010 8zm6.41-10.85a1.44 1.44 0 11-1.44-1.44 1.44 1.44 0 011.44 1.44z"/></svg>
            </a>
            <a href="https://x.com/AmdoxTech" target="_blank" rel="noopener noreferrer" className="hover:text-white">
              <svg className="w-5 h-5 inline" fill="currentColor" viewBox="0 0 24 24"><path d="M18.9 1.5h3.68l-8.04 9.19L24 22.5h-7.41l-5.8-7.58-6.64 7.58H.46l8.6-9.83L0 1.5h7.6l5.24 6.93L18.9 1.5zm-1.29 18.8h2.04L6.48 3.6H4.3l13.31 16.7z"/></svg>
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
