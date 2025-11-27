/**
 * ManagerLayout Component
 * Main layout wrapper for manager portal with header only (sidebar removed)
 * - Full-width content area
 * - Navigation via tabs within dashboard
 */

import React, { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import ManagerHeader from './ManagerHeader';
// SIDEBAR REMOVED - Removed import: import ManagerSidebar from './ManagerSidebar';
import { getCurrentUser } from '@shared/utils/auth/auth';

const ManagerLayout = () => {
  const [currentUser, setCurrentUser] = useState(null);
  // SIDEBAR REMOVED - No sidebar state needed
  // const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const { user, profile } = await getCurrentUser();
    setCurrentUser({ ...user, ...profile });
  };

  // SIDEBAR REMOVED - No toggle function needed
  // const toggleSidebar = () => {
  //   setSidebarOpen((prev) => !prev);
  // };

  // SIDEBAR REMOVED - No close function needed
  // const closeSidebar = () => {
  //   if (window.innerWidth < 1024) {
  //     setSidebarOpen(false);
  //   }
  // };

  const location = useLocation();
  const onManagerDashboard = location.pathname === '/manager' || location.pathname === '/manager/';
  const onManagerDashboardExact = location.pathname === '/manager/dashboard';

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* SIDEBAR REMOVED - Sidebar component no longer rendered */}
      {/* <ManagerSidebar isOpen={sidebarOpen} onClose={closeSidebar} /> */}

      {/* Main Content Area - Full Width */}
      <div className="w-full">
        {/* Header */}
        <ManagerHeader 
          user={currentUser} 
          onMenuClick={() => {}} // SIDEBAR REMOVED - No menu click handler needed
          hideOnDashboard={onManagerDashboard || onManagerDashboardExact}
        />

        {/* Page Content */}
        <main 
          role="main" 
          aria-label="Manager content" 
          className="p-4 md:p-6"
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default ManagerLayout;

