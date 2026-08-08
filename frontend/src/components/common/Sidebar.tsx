import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { accessibleModules, canAccessSettings } from '../../utils/permissions';

interface SidebarProps {
  /** Mobile drawer open state (ignored at lg+, where the sidebar is always in-flow). */
  mobileOpen?: boolean;
  /** Close the mobile drawer (also fired when a nav link is tapped). */
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ mobileOpen = false, onClose }) => {
  // Desktop-only: collapsed = slim icon rail, expanded = full labels. Persisted.
  // On mobile the sidebar is a full-width slide-in drawer, so this is a no-op there.
  const [collapsed, setCollapsed] = useState<boolean>(
    () => localStorage.getItem('sidebarCollapsed') === 'true',
  );
  const toggle = () =>
    setCollapsed((c) => {
      const next = !c;
      localStorage.setItem('sidebarCollapsed', String(next));
      return next;
    });

  // Only the modules this user's role grants are shown (recomputed per render
  // so it reflects the current logged-in user). See utils/permissions.
  const modules = accessibleModules();
  const showSettings = canAccessSettings();

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `group flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition-colors ${
      collapsed ? 'lg:justify-center lg:gap-0 lg:px-0' : ''
    } ${
      isActive
        ? 'bg-blue-600 text-white'
        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white'
    }`;

  const item = (to: string, icon: string, label: string) => (
    <NavLink key={to} to={to} className={linkClass} title={collapsed ? label : undefined} onClick={onClose}>
      <span className="text-lg leading-none shrink-0">{icon}</span>
      <span
        className={`whitespace-nowrap overflow-hidden transition-all duration-200 ${
          collapsed ? 'lg:w-0 lg:opacity-0' : ''
        }`}
      >
        {label}
      </span>
    </NavLink>
  );

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 w-64 ${collapsed ? 'lg:w-16' : 'lg:w-64'} bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col transform transition-transform duration-300 ease-in-out ${
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:static lg:translate-x-0 lg:transition-[width]`}
    >
      {/* Brand + toggle (collapse on desktop, close on mobile) */}
      <div
        className={`flex items-center justify-between ${collapsed ? 'lg:justify-center' : ''} p-4 border-b border-gray-200 dark:border-gray-800`}
      >
        <span
          className={`text-blue-600 dark:text-blue-400 font-bold text-xl whitespace-nowrap ${collapsed ? 'lg:hidden' : ''}`}
        >
          AMX ERP
        </span>
        {/* Desktop: collapse to rail */}
        <button
          type="button"
          onClick={toggle}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="hidden lg:inline-flex p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-5 w-5 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`}
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M12.79 5.23a.75.75 0 0 1 0 1.06L9.06 10l3.73 3.71a.75.75 0 1 1-1.06 1.06l-4.25-4.24a.75.75 0 0 1 0-1.06l4.25-4.24a.75.75 0 0 1 1.06 0Z"
              clipRule="evenodd"
            />
          </svg>
        </button>
        {/* Mobile: close drawer */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close menu"
          className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path
              fillRule="evenodd"
              d="M4.28 4.28a.75.75 0 0 1 1.06 0L10 8.94l4.66-4.66a.75.75 0 1 1 1.06 1.06L11.06 10l4.66 4.66a.75.75 0 1 1-1.06 1.06L10 11.06l-4.66 4.66a.75.75 0 0 1-1.06-1.06L8.94 10 4.28 5.34a.75.75 0 0 1 0-1.06Z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>

      {/* Main module nav — role-filtered */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {modules.map((m) => item(m.path, m.icon, m.label))}
      </nav>

      {/* Settings pinned to the bottom — admins only */}
      {showSettings && (
        <div className="p-3 border-t border-gray-200 dark:border-gray-800">
          {item('/settings', '⚙️', 'Settings')}
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
