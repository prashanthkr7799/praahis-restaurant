/**
 * AdminHeader Component
 * Top header bar with notifications bell and user menu
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { useRestaurant } from '@/shared/hooks/useRestaurant';
import NotificationsBell from '@domains/notifications/components/NotificationBell';
import UserMenu from './UserMenu';
import { LayoutDashboard } from 'lucide-react';

const AdminHeader = ({ user }) => {
  const { restaurantName, branding } = useRestaurant();

  return (
    <header
      role="banner"
      className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-white/10 h-16 flex items-center justify-between px-4 sm:px-6"
    >
      {/* Left: Logo + Restaurant */}
      <div className="flex items-center gap-4 min-w-0">
        <Link to="/manager/dashboard" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          {branding?.logoUrl ? (
            <img
              src={branding.logoUrl}
              alt="Restaurant logo"
              className="h-8 w-8 rounded-lg object-cover ring-1 ring-white/10"
            />
          ) : (
            <div
              aria-hidden
              className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-violet-600 ring-1 ring-white/10"
            />
          )}
          <div className="truncate">
            <h1 className="text-base sm:text-lg font-bold text-white truncate text-glow">
              {restaurantName || 'Manager Portal'}
            </h1>
          </div>
        </Link>
        
        <div className="h-6 w-px bg-white/10 mx-2 hidden sm:block" />
        
        <Link 
          to="/manager/dashboard" 
          className="hidden sm:flex items-center gap-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5"
        >
          <LayoutDashboard size={16} />
          Dashboard
        </Link>
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
