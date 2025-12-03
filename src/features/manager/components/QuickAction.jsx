import React from 'react';

const QuickAction = ({
  icon,
  label,
  onClick,
  badge,
  color = 'text-primary',
  'data-testid': testId,
}) => {
  const Icon = icon;
  return (
    <button
      onClick={onClick}
      data-testid={testId}
      className="flex flex-col items-center gap-2 min-w-[72px] p-2 rounded-2xl hover:bg-white/5 transition-all active:scale-95 group border border-transparent hover:border-white/5 min-h-[44px]"
      aria-label={label}
    >
      <div
        className={`p-3 rounded-xl bg-white/5 border border-white/5 group-hover:border-white/20 transition-all relative shadow-lg ${color.replace('text-', 'shadow-')}/20`}
      >
        <Icon className={`h-5 w-5 md:h-6 md:w-6 ${color} drop-shadow-md`} />
        {badge > 0 && (
          <span className="absolute -top-1.5 -right-1.5 h-4 w-4 md:h-5 md:w-5 bg-rose-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold ring-2 ring-black shadow-lg shadow-rose-500/50">
            {badge}
          </span>
        )}
      </div>
      <span className="text-[10px] md:text-xs font-medium text-zinc-400 group-hover:text-white transition-colors text-center whitespace-nowrap">
        {label}
      </span>
    </button>
  );
};

export default QuickAction;
