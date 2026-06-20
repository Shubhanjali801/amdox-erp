import React from 'react';
import { NavLink } from 'react-router-dom';

const links = [
  { to: '/dashboard',                     label: '📊 Dashboard' },
  { to: '/finance/ledger',                label: '💰 Finance' },
  { to: '/hr/employees',                  label: '👥 HR & Payroll' },
  { to: '/supply-chain/purchase-orders',  label: '📦 Supply Chain' },
  { to: '/projects',                      label: '📋 Projects' },
];

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition-colors ${
    isActive ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
  }`;

const Sidebar: React.FC = () => (
  <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
    <div className="p-6 border-b border-gray-800">
      <span className="text-blue-400 font-bold text-xl">AMX ERP</span>
    </div>

    {/* Main module nav */}
    <nav className="flex-1 p-4 space-y-1">
      {links.map((l) => (
        <NavLink key={l.to} to={l.to} className={linkClass}>
          {l.label}
        </NavLink>
      ))}
    </nav>

    {/* Settings pinned to the bottom */}
    <div className="p-4 border-t border-gray-800">
      <NavLink to="/settings" className={linkClass}>
        ⚙️ Settings
      </NavLink>
    </div>
  </aside>
);

export default Sidebar;
