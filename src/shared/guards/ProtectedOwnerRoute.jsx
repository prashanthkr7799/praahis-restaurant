/**
 * ProtectedOwnerRoute Component
 * Restricts access to superadmin routes to is_owner users. No restaurant context required.
 */

import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getCurrentOwnerUser as getCurrentUser } from '@shared/utils/auth/authOwner';
import LoadingSpinner from '@shared/components/feedback/LoadingSpinner';

const ProtectedOwnerRoute = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const location = useLocation();

  useEffect(() => {
    (async () => {
      const { user: authUser, profile: userProfile } = await getCurrentUser();
      setUser(authUser || null);
      setProfile(userProfile || null);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user || !profile) {
    return <Navigate to="/superadmin-login" state={{ from: location }} replace />;
  }

  const isOwner = !!(profile.is_owner || String(profile.role || '').toLowerCase() === 'owner');
  if (!isOwner) {
    return <Navigate to="/superadmin-login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedOwnerRoute;
