/**
 * KitchenHeader - Header component for kitchen display
 */
import React from 'react';
import {
  ChefHat,
  RefreshCw,
  LogOut,
  Search,
  X,
  Volume2,
  VolumeX,
  Filter,
  Clock,
  Flame,
  CheckCircle,
  Store,
} from 'lucide-react';

export function KitchenHeader({
  restaurantName,
  branding,
  stats,
  searchText,
  setSearchText,
  filterType,
  setFilterType,
  soundEnabled,
  toggleSound,
  isRefreshing,
  onRefresh,
  onLogout,
  currentTime,
}) {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-2xl bg-slate-950/90 border-b border-white/5">
      <div className="max-w-full mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Left - Branding */}
          <div className="flex items-center gap-3">
            {branding?.logo_url ? (
              <div className="w-11 h-11 rounded-xl overflow-hidden bg-slate-800 flex items-center justify-center shadow-lg">
                <img
                  src={branding.logo_url}
                  alt={restaurantName || 'Kitchen'}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <div className="hidden w-full h-full bg-gradient-to-br from-orange-500 to-red-600 items-center justify-center">
                  <ChefHat className="w-5 h-5 text-white" />
                </div>
              </div>
            ) : (
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg shadow-orange-500/25">
                <ChefHat className="w-5 h-5 text-white" />
              </div>
            )}
            <div className="hidden sm:block">
              <h1 className="text-base font-bold text-white truncate max-w-[200px]">
                {restaurantName || 'Kitchen Display'}
              </h1>
              <p className="text-xs text-slate-500 flex items-center gap-1.5">
                <Clock className="w-3 h-3" />
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>

          {/* Center - Stats */}
          <div className="hidden lg:flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20">
              <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-xs font-semibold text-amber-400">{stats.received} New</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20">
              <Flame className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-xs font-semibold text-blue-400">{stats.preparing} Cooking</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs font-semibold text-emerald-400">{stats.ready} Ready</span>
            </div>
            {stats.delayed > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 animate-pulse">
                <span className="text-xs font-semibold text-red-400">{stats.delayed} Delayed</span>
              </div>
            )}
          </div>

          {/* Right - Actions */}
          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search orders..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-48 pl-9 pr-8 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
              />
              {searchText && (
                <button
                  onClick={() => setSearchText('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-700 rounded-full text-slate-400"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Filter */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="hidden sm:block px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
            >
              <option value="all">All Orders</option>
              <option value="dine-in">Dine-in Only</option>
              <option value="takeaway">Takeaway Only</option>
              <option value="delayed">Delayed (&gt;15min)</option>
            </select>

            <button
              onClick={toggleSound}
              className={`p-2.5 rounded-xl transition-all ${soundEnabled ? 'bg-slate-800 text-white' : 'bg-slate-800/50 text-slate-500'}`}
              title={soundEnabled ? 'Mute sounds' : 'Enable sounds'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 transition-all disabled:opacity-50"
            >
              <RefreshCw
                className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-orange-400' : 'text-white'}`}
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
    </header>
  );
}

export default KitchenHeader;
