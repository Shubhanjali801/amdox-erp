import React from 'react'
import { NavLink, Outlet } from 'react-router-dom'

const tabs = [
  { to: '/settings', label: 'General', end: true },
  { to: '/settings/users', label: 'Users' },
  { to: '/settings/roles', label: 'Roles & Permissions' },
  { to: '/settings/security', label: 'Security (2FA)' },
  { to: '/settings/appearance', label: 'Appearance' },
  { to: '/settings/integrations', label: 'Integrations'},
]

const SettingsLayout: React.FC = () => (
  <div>
    <div className="mb-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
      <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Manage your organisation, users, and access</p>
    </div>

    <div className="flex gap-6">
      {/* Vertical side nav */}
      <aside className="w-56 shrink-0">
        <nav className="space-y-1">
          {tabs.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              end={t.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white'
                }`
              }
            >
              <span>{t.icon}</span>
              {t.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <Outlet />
      </div>
    </div>
  </div>
)

export default SettingsLayout
