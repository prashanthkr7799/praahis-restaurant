import React from 'react';
import { ChevronRight } from 'lucide-react';

const NavCard = ({ icon: Icon, title, description, onClick, iconColor, iconBg }) => {
  return (
    <button
      onClick={onClick}
      className="glass-panel p-6 text-left hover:bg-white/10 transition-all duration-300 group relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
        <Icon size={64} />
      </div>
      <div className="relative z-10 flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 flex-1">
          <div className={`p-3 rounded-xl ${iconBg} ${iconColor} flex-shrink-0`}>
            <Icon size={24} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-white mb-1 group-hover:text-glow transition-all">
              {title}
            </h3>
            <p className="text-sm text-zinc-400">{description}</p>
          </div>
        </div>
        <ChevronRight className="text-zinc-600 group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0" size={20} />
      </div>
    </button>
  );
};

export default NavCard;
