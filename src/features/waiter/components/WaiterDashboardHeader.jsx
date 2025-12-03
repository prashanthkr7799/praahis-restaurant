/**
 * WaiterDashboardHeader - Header component for waiter dashboard
 * Contains branding, stats, and action buttons
 */
import React from 'react';
import {
  LogOut,
  RefreshCw,
  Volume2,
  VolumeX,
  List,
  LayoutGrid,
  ChefHat,
  TrendingUp,
  Store,
} from 'lucide-react';

export function WaiterDashboardHeader({
  restaurantName,
  branding,
  alerts,
  stats,
  activeTab,
  setActiveTab,
  soundEnabled,
  toggleSound,
  isRefreshing,
  onRefresh,
  onLogout,
}) {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-2xl bg-slate-950/80 border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Left - Restaurant Branding */}
          <div className="flex items-center gap-3">
            <div className="relative">
              {branding?.logo_url ? (
                <div className="w-11 h-11 rounded-xl overflow-hidden bg-slate-800 flex items-center justify-center shadow-lg">
                  <img
                    src={branding.logo_url}
                    alt={restaurantName || 'Restaurant'}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  <div className="hidden w-full h-full bg-gradient-to-br from-amber-500 to-orange-600 items-center justify-center">
                    <Store className="w-5 h-5 text-white" />
                  </div>
                </div>
              ) : (
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/25">
                  <Store className="w-5 h-5 text-white" />
                </div>
              )}
              {alerts.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full text-[10px] font-bold flex items-center justify-center border-2 border-slate-950 animate-bounce">
                  {alerts.length}
                </span>
              )}
            </div>
            <div className="hidden sm:block">
              <h1 className="text-base font-bold text-white truncate max-w-[200px]">
                {restaurantName || 'Service Hub'}
              </h1>
              <p className="text-xs text-slate-500 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Waiter Dashboard
              </p>
            </div>
          </div>

          {/* Center - Quick Stats (desktop) */}
          <div className="hidden md:flex items-center gap-6">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold text-emerald-400">{stats.ready} Ready</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20">
              <ChefHat className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-semibold text-amber-400">
                {stats.inService} Cooking
              </span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-500/10 border border-slate-500/20">
              <TrendingUp className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs font-semibold text-slate-400">
                {stats.servedToday} Served
              </span>
            </div>
          </div>

          {/* Right - Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleSound}
              className={`p-2.5 rounded-xl transition-all ${soundEnabled ? 'bg-slate-800 text-white' : 'bg-slate-800/50 text-slate-500'}`}
              title={soundEnabled ? 'Mute sounds' : 'Enable sounds'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              onClick={() => onRefresh({ showToast: true })}
              disabled={isRefreshing}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 transition-all disabled:opacity-50"
            >
              <RefreshCw
                className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-amber-400' : 'text-white'}`}
              />
            </button>
            <button
              onClick={onLogout}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-red-500/20 hover:text-red-400 transition-all"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex gap-1 pb-3">
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'orders'
                ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <List className="w-4 h-4" />
            Orders
            {stats.ready > 0 && (
              <span
                className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                  activeTab === 'orders' ? 'bg-white/20' : 'bg-emerald-500 text-white'
                }`}
              >
                {stats.ready}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('tables')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'tables'
                ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            Tables
            <span
              className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                activeTab === 'tables' ? 'bg-white/20' : 'bg-slate-700'
              }`}
            >
              {stats.myTables}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}

export default WaiterDashboardHeader;
