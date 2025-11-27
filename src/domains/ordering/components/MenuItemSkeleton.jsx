import React from 'react';

/**
 * Skeleton loader for MenuItem component
 * Matches the layout and spacing of the actual MenuItem
 */
const MenuItemSkeleton = () => {
  return (
    <div className="customer-card p-3 animate-pulse">
      {/* Image skeleton - 5:4 aspect ratio */}
      <div className="relative aspect-5-4 mb-3 rounded-lg overflow-hidden bg-gray-800">
        <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-800"></div>
      </div>

      {/* Tags skeleton */}
      <div className="flex gap-1.5 mb-2">
        <div className="h-6 w-16 bg-gray-800 rounded-full"></div>
        <div className="h-6 w-20 bg-gray-800 rounded-full"></div>
      </div>

      {/* Title & Price skeleton */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 mr-2">
          <div className="h-4 bg-gray-800 rounded w-3/4"></div>
        </div>
        <div className="h-4 w-16 bg-gray-800 rounded"></div>
      </div>

      {/* Description skeleton */}
      <div className="space-y-1.5 mb-2">
        <div className="h-3 bg-gray-800 rounded w-full"></div>
        <div className="h-3 bg-gray-800 rounded w-4/5"></div>
      </div>

      {/* Rating skeleton */}
      <div className="flex items-center gap-1 mb-3">
        <div className="flex gap-0.5">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-3 w-3 bg-gray-800 rounded"></div>
          ))}
        </div>
        <div className="h-3 w-8 bg-gray-800 rounded ml-1"></div>
      </div>

      {/* Button skeleton */}
      <div className="h-10 bg-gray-800 rounded-lg"></div>
    </div>
  );
};

export default MenuItemSkeleton;
