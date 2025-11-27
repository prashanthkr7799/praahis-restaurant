import React from 'react';
import { MessageCircle, Phone, Activity, User } from 'lucide-react';

/**
 * StaffCard Component
 * Displays staff member information with avatar, role, status, and metrics
 */
const StaffCard = ({ staff, onMessage, onCall, onViewActivity }) => {
  // Calculate if staff is currently active (last_login within last 2 minutes)
  const isActive = staff?.last_login 
    ? (Date.now() - new Date(staff.last_login).getTime() < 2 * 60 * 1000)
    : false;

  // Get initials for avatar
  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Get role display formatting
  const getRoleColor = (role) => {
    const roleLower = role?.toLowerCase() || '';
    if (roleLower.includes('chef')) return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    if (roleLower.includes('waiter')) return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    if (roleLower.includes('manager')) return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    if (roleLower.includes('admin')) return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
    return 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30';
  };

  return (
    <div className="glass-panel rounded-2xl p-6 border border-white/10 hover:border-primary/30 transition-all group">
      {/* Header with Avatar and Status */}
      <div className="flex items-start gap-4 mb-4">
        {/* Avatar */}
        <div className="relative">
          {staff?.avatar_url ? (
            <img
              src={staff?.avatar_url}
              alt={staff?.full_name || staff?.name}
              className="w-14 h-14 rounded-xl object-cover border border-white/10"
            />
          ) : (
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center border border-white/10">
              <span className="text-lg font-bold text-white">
                {getInitials(staff?.full_name || staff?.name)}
              </span>
            </div>
          )}
          
          {/* Status Indicator */}
          <div
            className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[#1a1625] ${
              isActive ? 'bg-emerald-500' : 'bg-zinc-600'
            }`}
            title={isActive ? 'Active' : 'Offline'}
          />
        </div>

        {/* Name and Role */}
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-white truncate group-hover:text-primary transition-colors">
            {staff?.full_name || staff?.name || 'Unknown'}
          </h3>
          <span
            className={`inline-block text-xs px-2 py-1 rounded-lg font-semibold mt-1 border ${getRoleColor(
              staff?.role
            )}`}
          >
            {staff?.role || 'Staff'}
          </span>
        </div>
      </div>

      {/* Contact Info */}
      {(staff?.email || staff?.phone) && (
        <div className="space-y-2 mb-4 pb-4 border-b border-white/10">
          {staff?.email && (
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <User className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{staff?.email}</span>
            </div>
          )}
          {staff?.phone && (
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <Phone className="w-3 h-3 flex-shrink-0" />
              <span>{staff?.phone}</span>
            </div>
          )}
        </div>
      )}

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white/5 rounded-lg p-3 border border-white/5">
          <div className="text-xs text-zinc-400 mb-1">Orders Served</div>
          <div className="text-xl font-bold text-white">
            {staff?.orders_served || 0}
          </div>
        </div>
        <div className="bg-white/5 rounded-lg p-3 border border-white/5">
          <div className="text-xs text-zinc-400 mb-1">Last Active</div>
          <div className="text-sm font-semibold text-white">
            {staff?.last_login
              ? new Date(staff.last_login).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })
              : 'Never'}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => onMessage?.(staff)}
          className="flex flex-col items-center gap-1 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-primary/30 transition-all group/btn"
          title="Send Message"
        >
          <MessageCircle className="w-4 h-4 text-zinc-400 group-hover/btn:text-primary transition-colors" />
          <span className="text-[10px] text-zinc-400 group-hover/btn:text-white transition-colors">
            Message
          </span>
        </button>

        <button
          onClick={() => onCall?.(staff)}
          className="flex flex-col items-center gap-1 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-emerald-500/30 transition-all group/btn"
          title="Call Staff"
        >
          <Phone className="w-4 h-4 text-zinc-400 group-hover/btn:text-emerald-400 transition-colors" />
          <span className="text-[10px] text-zinc-400 group-hover/btn:text-white transition-colors">
            Call
          </span>
        </button>

        <button
          onClick={() => onViewActivity?.(staff)}
          className="flex flex-col items-center gap-1 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-accent/30 transition-all group/btn"
          title="View Activity"
        >
          <Activity className="w-4 h-4 text-zinc-400 group-hover/btn:text-accent transition-colors" />
          <span className="text-[10px] text-zinc-400 group-hover/btn:text-white transition-colors">
            Activity
          </span>
        </button>
      </div>
    </div>
  );
};

export default StaffCard;
