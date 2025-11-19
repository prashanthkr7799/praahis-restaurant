import React from 'react';
import { motion as Motion } from 'framer-motion';

const CategoryTabs = ({ categories, activeCategory, onCategoryChange }) => {
  return (
    <div className="sticky top-20 z-40 bg-white shadow-md">
      <div className="container mx-auto overflow-x-auto">
        <div className="flex gap-2 p-4">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => onCategoryChange(category)}
              className={`relative whitespace-nowrap rounded-full px-6 py-2 font-semibold transition-colors ${
                activeCategory === category
                  ? 'text-white'
                  : 'text-neutral-700 hover:bg-neutral-100'
              }`}
            >
              {activeCategory === category && (
                <Motion.div
                  layoutId="activeCategory"
                  className="absolute inset-0 rounded-full bg-orange-500"
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
