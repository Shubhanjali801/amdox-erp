import React from 'react'
import { NavLink, Outlet } from 'react-router-dom'

const tabs = [
  { to: '/settings', label: 'General', end: true },
  { to: '/settings/users', label: 'Users' },
  { to: '/settings/roles', label: 'Roles & Permissions' },
  { to: '/settings/integrations', label: 'Integrations' },
]

const SettingsLayout: React.FC = () => (
  <div className="space-y-6">
    <div className="flex gap-1 border-b border-gray-800">
      {tabs.map((t) => (
        <NavLink
          key={t.to}
          to={t.to}
          end={t.end}
          className={({ isActive }) =>
            `px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              isActive ? 'border-blue-500 text-white' : 'border-transparent text-gray-400 hover:text-white'
            }`
          }
        >
          {t.label}
        </NavLink>
      ))}
    </div>
    <Outlet />
  </div>
)

export default SettingsLayout
