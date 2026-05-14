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
        <main className="flex-1 min-w-0 w-full pt-20 pb-8 pl-4 pr-4 sm:pt-24 sm:pl-6 sm:pr-6 lg:pl-[calc(18rem+2.75rem)] lg:pr-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;

