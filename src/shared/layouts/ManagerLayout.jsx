/**
 * AdminLayout Component
 * Main layout wrapper for admin portal with top header (no sidebar)
 */

import React, { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import ManagerHeader from './ManagerHeader';
import { getCurrentUser } from '@shared/utils/auth/auth';

const AdminLayout = () => {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const { user, profile } = await getCurrentUser();
    setCurrentUser({ ...user, ...profile });
  };

  const location = useLocation();
  const onManagerDashboard = location.pathname === '/manager' || location.pathname === '/manager/';
  const onManagerDashboardExact = location.pathname === '/manager/dashboard';

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header: hide default on manager dashboard so the page can render its own */}
      {!(onManagerDashboard || onManagerDashboardExact) && (
        <ManagerHeader user={currentUser} />
      )}

      {/* Page Content */}
      <main role="main" aria-label="Admin content" className="p-6">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
