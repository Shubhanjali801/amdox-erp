import React from 'react';
import NotificationBell from '../Notifications/NotificationBell';
import { useAuth } from '../../hooks/useAuth';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const name = user ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email : 'Account';

  return (
    <header className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
      <h1 className="text-white font-semibold text-lg">Amdox ERP</h1>
      <div className="flex items-center gap-4">
        <NotificationBell />
        <span className="text-gray-300 text-sm hidden sm:inline">{name}</span>
        <button
          onClick={logout}
          className="px-3 py-1.5 rounded-lg text-sm bg-gray-800 text-gray-300 hover:bg-red-600 hover:text-white transition-colors"
        >
          Logout
        </button>
      </div>
    </header>
  );
};

export default Header;
