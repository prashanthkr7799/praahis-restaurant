import React from 'react';
import { motion as Motion } from 'framer-motion';

const CategoryTabs = ({ categories, activeCategory, onCategoryChange }) => {
  return (
    <div
      className="sticky top-[140px] z-40 bg-slate-900/95 backdrop-blur-xl border-b border-white/5"
      role="tablist"
      aria-label="Menu categories"
    >
      <div className="max-w-7xl mx-auto overflow-x-auto scrollbar-hide">
        <div className="flex gap-2 p-4">
          {categories.map((category) => (
            <button
              key={category}
              data-testid="menu-category"
              role="tab"
              aria-selected={activeCategory === category}
              onClick={() => onCategoryChange(category)}
              className={`relative whitespace-nowrap rounded-full px-6 py-3 font-semibold transition-colors min-h-[44px] ${
                activeCategory === category
                  ? 'text-white'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {activeCategory === category && (
                <Motion.div
                  layoutId="activeCategory"
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-orange-500 to-amber-500"
                  transition={{ type: 'spring', duration: 0.5 }}
                />
              )}
              <span className="relative z-10">{category}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CategoryTabs;
