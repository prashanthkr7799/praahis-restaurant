import React from 'react';import React from 'react';

import { TrendingUp, TrendingDown } from 'lucide-react';import { TrendingUp, TrendingDown } from 'lucide-react';



const StatCard = ({ icon: Icon, label, value, change, changeType, iconColor, iconBg }) => {const StatCard = ({ title, value, trend, trendValue, icon: Icon, color = "primary" }) => {

  return (  const isPositive = trend === 'up';

    <div className="glass-panel p-6 relative overflow-hidden group">  

      <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity ${iconColor}`}>  const colorClasses = {

        <Icon size={64} />    primary: "text-violet-400 bg-violet-500/10 border-violet-500/20",

      </div>    emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",

      <div className="relative z-10">    amber: "text-amber-400 bg-amber-500/10 border-amber-500/20",

        <div className="flex items-center gap-3 mb-4">    rose: "text-rose-400 bg-rose-500/10 border-rose-500/20",

          <div className={`p-3 rounded-xl ${iconBg} ${iconColor}`}>    sky: "text-sky-400 bg-sky-500/10 border-sky-500/20",

            <Icon size={24} />  };

          </div>

          <p className="text-zinc-400 text-sm font-bold uppercase tracking-wider">{label}</p>  return (

        </div>    <div className="glass-panel p-6 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">

        <h3 className="text-3xl font-bold text-white font-mono-nums text-glow">{value}</h3>      <div className="absolute -right-6 -bottom-6 opacity-10 group-hover:opacity-20 transition-opacity duration-300 text-white">

        {change !== undefined && (        <Icon size={120} />

          <div className={`flex items-center gap-2 mt-4 text-sm ${      </div>

            changeType === 'up' ? 'text-emerald-400' : 'text-rose-400'      

          }`}>      <div className="relative z-10">

            {changeType === 'up' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}        <div className="flex justify-between items-start mb-4">

            <span>{change}</span>          <div className={`p-3 rounded-xl ${colorClasses[color] || colorClasses.primary}`}>

          </div>            <Icon size={24} />

        )}          </div>

      </div>          {trendValue && (

    </div>            <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${

  );              isPositive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'

};            }`}>

              {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}

export default StatCard;              <span>{trendValue}</span>

            </div>
          )}
        </div>
        
        <div className="space-y-1">
          <h3 className="text-3xl font-bold text-white font-mono-nums tracking-tight">{value}</h3>
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{title}</p>
        </div>
      </div>
    </div>
  );
};

export default StatCard;
