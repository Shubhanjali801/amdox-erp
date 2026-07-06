import React from 'react';
import NotificationBell from '../Notifications/NotificationBell';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../context/ThemeContext';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const name = user ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email : 'Account';

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex items-center justify-between">
      <h1 className="text-gray-900 dark:text-white font-semibold text-lg">Amdox ERP</h1>
      <div className="flex items-center gap-4">
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
        <NotificationBell />
        <span className="text-gray-600 dark:text-gray-300 text-sm hidden sm:inline">{name}</span>
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
