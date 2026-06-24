import React from 'react'
import { NavLink, Outlet } from 'react-router-dom'

const tabs = [
  { to: '/hr/employees', label: 'Employees', icon: '👥' },
  { to: '/hr/attendance', label: 'Attendance', icon: '🕒' },
  { to: '/hr/leave', label: 'Leave', icon: '🌴' },
  { to: '/hr/payroll', label: 'Payroll', icon: '💵' },
]

const HRLayout: React.FC = () => (
  <div>
    <div className="flex justify-center gap-2 border-b border-gray-200 dark:border-gray-800 mb-6">
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

export default HRLayout
