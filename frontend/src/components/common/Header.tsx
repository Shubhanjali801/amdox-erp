import React from 'react';
import NotificationBell from '../Notifications/NotificationBell';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../context/ThemeContext';

interface HeaderProps {
  /** Opens the mobile sidebar drawer (hamburger is hidden at lg+). */
  onMenuClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const name = user ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email : 'Account';

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 sm:px-6 py-4 flex items-center justify-between gap-2">
      <div className="flex items-center gap-2 min-w-0">
        {/* Mobile: open the sidebar drawer */}
        <button
          onClick={onMenuClick}
          aria-label="Open menu"
          className="lg:hidden p-2 -ml-1 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <h1 className="text-gray-900 dark:text-white font-semibold text-lg truncate">Amdox ERP</h1>
      </div>
      <div className="flex items-center gap-1.5 sm:gap-4 shrink-0">
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
        <NotificationBell />
        <span className="text-gray-600 dark:text-gray-300 text-sm hidden sm:inline max-w-[10rem] truncate">{name}</span>
        <button
          onClick={logout}
          className="px-3 py-1.5 rounded-lg text-sm bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 hover:bg-red-600 hover:text-white transition-colors"
        >
          Logout
        </button>
      </div>
    </header>
  );
};

export default Header;
