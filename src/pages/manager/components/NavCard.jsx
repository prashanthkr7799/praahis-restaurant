import React from 'react';import React from 'react';

import { ChevronRight } from 'lucide-react';import { ChevronRight } from 'lucide-react';

import { Link } from 'react-router-dom';

const NavCard = ({ icon: Icon, title, description, onClick, iconColor, iconBg }) => {

  return (const NavCard = ({ title, description, icon: Icon, to, color = "violet" }) => {

    <button  const colorClasses = {

      onClick={onClick}    violet: "group-hover:text-violet-400 group-hover:bg-violet-500/10 group-hover:border-violet-500/20",

      className="glass-panel p-6 text-left hover:bg-white/10 transition-all duration-300 group relative overflow-hidden"    emerald: "group-hover:text-emerald-400 group-hover:bg-emerald-500/10 group-hover:border-emerald-500/20",

    >    amber: "group-hover:text-amber-400 group-hover:bg-amber-500/10 group-hover:border-amber-500/20",

      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">    rose: "group-hover:text-rose-400 group-hover:bg-rose-500/10 group-hover:border-rose-500/20",

        <Icon size={64} />    sky: "group-hover:text-sky-400 group-hover:bg-sky-500/10 group-hover:border-sky-500/20",

      </div>    cyan: "group-hover:text-cyan-400 group-hover:bg-cyan-500/10 group-hover:border-cyan-500/20",

      <div className="relative z-10 flex items-start justify-between gap-4">  };

        <div className="flex items-start gap-4 flex-1">

          <div className={`p-3 rounded-xl ${iconBg} ${iconColor} flex-shrink-0`}>  return (

            <Icon size={24} />    <Link to={to} className="glass-panel p-6 group hover:-translate-y-1 transition-all duration-300 relative overflow-hidden block h-full">

          </div>      <div className="flex items-start justify-between mb-4">

          <div className="flex-1 min-w-0">        <div className={`p-3 rounded-xl bg-white/5 border border-white/10 text-zinc-400 transition-colors duration-300 ${colorClasses[color] || colorClasses.violet}`}>

            <h3 className="text-lg font-bold text-white mb-1 group-hover:text-glow transition-all">          <Icon size={24} />

              {title}        </div>

            </h3>        <ChevronRight className="text-zinc-600 group-hover:text-white transition-colors" size={20} />

            <p className="text-sm text-zinc-400">{description}</p>      </div>

          </div>      

        </div>      <div>

        <ChevronRight className="text-zinc-600 group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0" size={20} />        <h3 className="text-lg font-bold text-white mb-1 group-hover:text-glow transition-all">{title}</h3>

      </div>        <p className="text-sm text-zinc-500 group-hover:text-zinc-400 transition-colors line-clamp-2">{description}</p>

    </button>      </div>

  );    </Link>

};  );

};

export default NavCard;

export default NavCard;
