import React from 'react'
import { NavLink, Outlet } from 'react-router-dom'

const tabs = [
  { to: '/supply-chain/vendors', label: 'Vendors', icon: '🏭' },
  { to: '/supply-chain/inventory', label: 'Inventory', icon: '📦' },
  { to: '/supply-chain/purchase-orders', label: 'Purchase Orders', icon: '🧾' },
  { to: '/supply-chain/forecasting', label: 'AI Forecasting', icon: '🔮' },
]

const SupplyChainLayout: React.FC = () => (
  <div>
    <div className="mb-6">
      <h1 className="text-2xl font-bold text-white">Supply Chain</h1>
      <p className="text-gray-400 text-sm mt-1">Vendors, inventory, procurement &amp; demand planning</p>
    </div>
    <div className="flex gap-1 border-b border-gray-800 mb-6">
      {tabs.map((t) => (
        <NavLink key={t.to} to={t.to}
          className={({ isActive }) =>
            `flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              isActive ? 'border-blue-500 text-white' : 'border-transparent text-gray-400 hover:text-white'
            }`}>
          <span>{t.icon}</span>{t.label}
        </NavLink>
      ))}
    </div>
    <Outlet />
  </div>
)

export default SupplyChainLayout
