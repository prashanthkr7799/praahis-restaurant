import React from 'react';
import { useRestaurant } from '@shared/hooks/useRestaurant';
import NotificationsBell from '@domains/notifications/components/NotificationBell';
import UserMenu from '@shared/layouts/UserMenu';

const DashboardHeader = ({ user }) => {
  const { restaurantName, branding } = useRestaurant();

  return (
    <header className="sticky top-0 z-20 border-b border-border/60 bg-card/60 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Brand */}
        <div className="flex items-center gap-3">
          {branding?.logoUrl ? (
            <img
              src={branding.logoUrl}
              alt="Restaurant logo"
              className="h-8 w-8 rounded object-cover"
            />
          ) : (
            <div className="h-8 w-8 rounded bg-primary" aria-hidden />
          )}
          <div>
            <p className="text-sm text-muted-foreground">Restaurant Management</p>
            <h1 className="text-lg font-semibold text-foreground">
              {restaurantName || 'Manager Portal'}
            </h1>
          </div>
        </div>

        {/* Right: Notifications + User Menu */}
        <div className="flex items-center gap-3">
          <NotificationsBell />
          <UserMenu profile={user} />
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
