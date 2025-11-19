/**
 * AdminHeader Component
 * Top header bar with notifications bell and user menu
 */

import React from 'react';
import { useRestaurant } from '@/shared/hooks/useRestaurant';
import NotificationsBell from '@domains/notifications/components/NotificationBell';
import UserMenu from './UserMenu';

const AdminHeader = ({ user }) => {
  const { restaurantName, branding } = useRestaurant();

  return (
    <header
      role="banner"
      className="sticky top-0 z-40 bg-card/80 backdrop-blur border-b border-border h-16 flex items-center justify-between px-4 sm:px-6"
    >
      {/* Left: Logo + Restaurant */}
      <div className="flex items-center gap-3 min-w-0">
        {branding?.logoUrl ? (
          <img
            src={branding.logoUrl}
            alt="Restaurant logo"
            className="h-8 w-8 rounded object-cover"
          />
        ) : (
          <div
            aria-hidden
            className="h-8 w-8 rounded bg-gradient-to-br from-primary to-primary/70"
          />
        )}
        <div className="truncate">
          <h1 className="text-base sm:text-lg font-semibold text-foreground truncate">
            {restaurantName || 'Manager Portal'}
          </h1>
          <p className="text-xs text-muted-foreground truncate">
            Restaurant Management
          </p>
        </div>
      </div>

      {/* Right: Notifications + User Menu */}
      <div className="flex items-center gap-3">
        <NotificationsBell />
        <UserMenu profile={user} />
      </div>
    </header>
  );
};

export default AdminHeader;
