import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

const StatCard = ({ icon: Icon, label, value, change, changeType, iconColor, iconBg }) => {
  return (
    <div className="glass-panel p-6 relative overflow-hidden group">
      <div className={`absolute top-0 right-0 p-4 ${iconBg} opacity-10 group-hover:opacity-20 transition-opacity`}>
        <Icon size={64} />
      </div>
      
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-2.5 rounded-lg ${iconBg} ${iconColor}`}>
            <Icon size={20} />
          </div>
          <p className="text-sm font-medium text-zinc-400 uppercase tracking-wider">{label}</p>
        </div>
        
        <div className="space-y-2">
          <p className="text-3xl font-bold text-white font-mono-nums">{value}</p>
          
          {change && (
            <div className="flex items-center gap-1.5">
              {changeType === 'up' ? (
                <TrendingUp size={16} className="text-emerald-400" />
              ) : (
                <TrendingDown size={16} className="text-rose-400" />
              )}
              <span className={`text-sm font-semibold ${
                changeType === 'up' ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {change}
              </span>
              <span className="text-xs text-zinc-500">vs yesterday</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatCard;
