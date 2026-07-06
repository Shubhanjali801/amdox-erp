import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';

interface LayoutProps { children: React.ReactNode; }

const Layout: React.FC<LayoutProps> = ({ children }) => (
  <div className="flex h-screen bg-gray-100 dark:bg-gray-950">
    <Sidebar />
    <div className="flex flex-col flex-1 overflow-hidden">
      <Header />
      <main className="flex-1 overflow-y-auto p-6 text-gray-900 dark:text-gray-100">{children}</main>
      <Footer />
    </div>
  </div>
);

export default Layout;
