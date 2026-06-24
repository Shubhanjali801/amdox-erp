import React from 'react'
import { NavLink, Outlet } from 'react-router-dom'

const tabs = [
  { to: '/finance/ledger', label: 'General Ledger', icon: '📒' },
  { to: '/finance/payables', label: 'Payables (AP)', icon: '📤' },
  { to: '/finance/receivables', label: 'Receivables (AR)', icon: '📥' },
  { to: '/finance/reports', label: 'Reports', icon: '📊' },
]

const FinanceLayout: React.FC = () => (
  <div>
    <div className="mb-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Finance</h1>
      <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Ledger, invoices, payments &amp; reporting</p>
    </div>
    <div className="flex gap-1 border-b border-gray-200 dark:border-gray-800 mb-6">
      {tabs.map((t) => (
        <NavLink key={t.to} to={t.to}
          className={({ isActive }) =>
            `flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              isActive ? 'border-blue-500 text-blue-600 dark:text-white' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}>
          <span>{t.icon}</span>{t.label}
        </NavLink>
      ))}
    </div>
    <Outlet />
  </div>
)

export default FinanceLayout
