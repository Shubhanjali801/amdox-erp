import React from 'react';
import NotificationBell from '../Notifications/NotificationBell';

const Header: React.FC = () => (
  <header className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
    <h1 className="text-white font-semibold text-lg">Amdox ERP</h1>
    <div className="flex items-center gap-4">
      <NotificationBell />
    </div>
  </header>
);

export default Header;
