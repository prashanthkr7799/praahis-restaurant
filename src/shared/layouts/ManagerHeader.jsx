/**
 * ManagerHeader Component
 * Top header bar with hamburger menu, notifications bell, user menu, and search shortcut
 * - Shows hamburger menu button on mobile/tablet to toggle sidebar
 * - Displays restaurant logo and name
 * - Includes NotificationBell component
 * - Includes UserMenu component
 * - Shows search shortcut (Cmd+K / Ctrl+K)
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { useRestaurant } from '@/shared/hooks/useRestaurant';
import NotificationBell from '@domains/notifications/components/NotificationBell';
import UserMenu from './UserMenu';
import { LayoutDashboard, Menu, Search, Command } from 'lucide-react';

const ManagerHeader = ({ user, onMenuClick, hideOnDashboard = false }) => {
  const { restaurantName, branding, restaurantId } = useRestaurant();

  // Don't render if hideOnDashboard is true
  if (hideOnDashboard) {
    return null;
  }

  return (
    <header
      role="banner"
      className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-white/10 h-16 flex items-center justify-between px-4 sm:px-6"
    >
      {/* Left: Hamburger + Logo + Restaurant */}
      <div className="flex items-center gap-3 md:gap-4 min-w-0">
        {/* Hamburger Menu Button - Mobile/Tablet only */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg hover:bg-white/5 transition-colors text-zinc-400 hover:text-white"
          aria-label="Toggle sidebar menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Logo + Restaurant Name */}
        <Link 
          to="/manager/dashboard" 
          className="flex items-center gap-2 md:gap-3 hover:opacity-80 transition-opacity min-w-0"
        >
          {branding?.logoUrl ? (
            <img
              src={branding.logoUrl}
              alt="Restaurant logo"
              className="h-8 w-8 md:h-9 md:w-9 rounded-lg object-cover ring-1 ring-white/10 flex-shrink-0"
            />
          ) : (
            <div
              aria-hidden
              className="h-8 w-8 md:h-9 md:w-9 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 ring-1 ring-white/10 flex-shrink-0"
            />
          )}
          <div className="truncate min-w-0">
            <h1 className="text-sm md:text-base font-bold text-white truncate text-glow">
              {restaurantName || 'Manager Portal'}
            </h1>
          </div>
        </Link>
        
        {/* Divider - Hidden on mobile */}
        <div className="h-6 w-px bg-white/10 mx-1 hidden sm:block" />
        
        {/* Dashboard Link - Hidden on mobile */}
        <Link 
          to="/manager/dashboard" 
          className="hidden md:flex items-center gap-2 text-xs font-medium text-zinc-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5"
        >
          <LayoutDashboard size={14} />
          Dashboard
        </Link>
      </div>

      {/* Right: Search Shortcut + Notifications + User Menu */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Search Shortcut - Hidden on mobile */}
        <button
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-zinc-400 hover:text-white text-xs"
          aria-label="Search"
          title="Search (Cmd+K)"
        >
          <Search size={14} />
          <span className="hidden lg:inline">Search</span>
          <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white/10 border border-white/10 text-[10px] font-mono">
            <Command size={10} />
            K
          </kbd>
        </button>

        {/* Notifications Bell */}
        <NotificationBell userId={user?.id} restaurantId={restaurantId} />

        {/* User Menu */}
        <UserMenu profile={user} />
      </div>
    </header>
  );
};

export default ManagerHeader;
