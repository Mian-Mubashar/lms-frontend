import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 overflow-x-hidden">
      <Header onMenuClick={() => setSidebarOpen(true)} />
      {sidebarOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-[35] bg-black/40 backdrop-blur-[1px] lg:hidden"
          aria-label="Close menu"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}
      <div className="flex">
        <Sidebar isOpen={sidebarOpen} onNavigate={() => setSidebarOpen(false)} />
        <main className="flex-1 min-w-0 w-full p-4 pt-20 pb-8 sm:p-6 sm:pt-24 lg:pl-72">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;

