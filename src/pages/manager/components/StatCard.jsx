import React from 'react';import React from 'react';import React from 'react';

import { TrendingUp, TrendingDown } from 'lucide-react';

import { TrendingUp, TrendingDown } from 'lucide-react';import { TrendingUp, TrendingDown } from 'lucide-react';

const StatCard = ({ icon: Icon, label, value, change, changeType, iconColor, iconBg }) => {

  return (

    <div className="glass-panel p-6 relative overflow-hidden group">

      {/* Large background icon */}const StatCard = ({ icon: Icon, label, value, change, changeType, iconColor, iconBg }) => {const StatCard = ({ title, value, trend, trendValue, icon: Icon, color = "primary" }) => {

      <div className={`absolute top-0 right-0 p-4 ${iconBg} opacity-10 group-hover:opacity-20 transition-opacity`}>

        <Icon size={64} />  return (  const isPositive = trend === 'up';

      </div>

          <div className="glass-panel p-6 relative overflow-hidden group">  

      {/* Content */}

      <div className="relative z-10">      <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity ${iconColor}`}>  const colorClasses = {

        <div className="flex items-center gap-3 mb-4">

          <div className={`p-2.5 rounded-lg ${iconBg} ${iconColor}`}>        <Icon size={64} />    primary: "text-violet-400 bg-violet-500/10 border-violet-500/20",

            <Icon size={20} />

          </div>      </div>    emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",

          <p className="text-sm font-medium text-zinc-400 uppercase tracking-wider">{label}</p>

        </div>      <div className="relative z-10">    amber: "text-amber-400 bg-amber-500/10 border-amber-500/20",

        

        <div className="space-y-2">        <div className="flex items-center gap-3 mb-4">    rose: "text-rose-400 bg-rose-500/10 border-rose-500/20",

          <p className="text-3xl font-bold text-white font-mono-nums">{value}</p>

                    <div className={`p-3 rounded-xl ${iconBg} ${iconColor}`}>    sky: "text-sky-400 bg-sky-500/10 border-sky-500/20",

          {change && (

            <div className="flex items-center gap-1.5">            <Icon size={24} />  };

              {changeType === 'up' ? (

                <TrendingUp size={16} className="text-emerald-400" />          </div>

              ) : (

                <TrendingDown size={16} className="text-rose-400" />          <p className="text-zinc-400 text-sm font-bold uppercase tracking-wider">{label}</p>  return (

              )}

              <span className={`text-sm font-semibold ${        </div>    <div className="glass-panel p-6 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">

                changeType === 'up' ? 'text-emerald-400' : 'text-rose-400'

              }`}>        <h3 className="text-3xl font-bold text-white font-mono-nums text-glow">{value}</h3>      <div className="absolute -right-6 -bottom-6 opacity-10 group-hover:opacity-20 transition-opacity duration-300 text-white">

                {change}

              </span>        {change !== undefined && (        <Icon size={120} />

              <span className="text-xs text-zinc-500">vs yesterday</span>

            </div>          <div className={`flex items-center gap-2 mt-4 text-sm ${      </div>

          )}

        </div>            changeType === 'up' ? 'text-emerald-400' : 'text-rose-400'      

      </div>

    </div>          }`}>      <div className="relative z-10">

  );

};            {changeType === 'up' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}        <div className="flex justify-between items-start mb-4">



export default StatCard;            <span>{change}</span>          <div className={`p-3 rounded-xl ${colorClasses[color] || colorClasses.primary}`}>


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
