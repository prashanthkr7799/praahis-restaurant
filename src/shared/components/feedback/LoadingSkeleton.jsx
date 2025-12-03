import React from 'react';

// Table skeleton loader
export const TableSkeleton = ({ rows = 5, columns = 6 }) => {
  return (
    <div className="animate-pulse">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {[...Array(columns)].map((_, i) => (
                <th key={i} className="px-4 py-3">
                  <div className="h-4 bg-gray-300 rounded w-24"></div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {[...Array(rows)].map((_, rowIndex) => (
              <tr key={rowIndex}>
                {[...Array(columns)].map((_, colIndex) => (
                  <td key={colIndex} className="px-4 py-4">
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Card skeleton loader
export const CardSkeleton = ({ count = 3 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gray-300 rounded-lg"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-300 rounded w-3/4"></div>
              <div className="h-6 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Form skeleton loader
export const FormSkeleton = () => {
  return (
    <div className="bg-white rounded-lg shadow p-6 animate-pulse space-y-6">
      <div>
        <div className="h-4 bg-gray-300 rounded w-24 mb-2"></div>
        <div className="h-10 bg-gray-200 rounded w-full"></div>
      </div>
      <div>
        <div className="h-4 bg-gray-300 rounded w-32 mb-2"></div>
        <div className="h-10 bg-gray-200 rounded w-full"></div>
      </div>
      <div>
        <div className="h-4 bg-gray-300 rounded w-28 mb-2"></div>
        <div className="h-24 bg-gray-200 rounded w-full"></div>
      </div>
      <div className="flex space-x-4">
        <div className="h-10 bg-gray-300 rounded w-32"></div>
        <div className="h-10 bg-gray-200 rounded w-32"></div>
      </div>
    </div>
  );
};

// Chart skeleton loader
export const ChartSkeleton = () => {
  return (
    <div className="bg-white rounded-lg shadow p-6 animate-pulse">
      <div className="h-6 bg-gray-300 rounded w-48 mb-6"></div>
      <div className="space-y-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-end space-x-2 h-32">
            {[...Array(7)].map((_, j) => (
              <div
                key={j}
                className="flex-1 bg-gray-200 rounded-t"
                style={{ height: `${Math.random() * 80 + 20}%` }}
              ></div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

// List skeleton loader
export const ListSkeleton = ({ items = 5 }) => {
  return (
    <div className="space-y-3 animate-pulse">
      {[...Array(items)].map((_, i) => (
        <div key={i} className="bg-white rounded-lg shadow p-4 flex items-center space-x-4">
          <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-300 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
          <div className="h-8 bg-gray-200 rounded w-20"></div>
        </div>
      ))}
    </div>
  );
};

// Detail page skeleton
export const DetailSkeleton = () => {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="h-8 bg-gray-300 rounded w-64 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-96"></div>
      </div>

      {/* Stats Cards */}
      <CardSkeleton count={4} />

      {/* Main Content */}
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i}>
            <div className="h-4 bg-gray-300 rounded w-32 mb-2"></div>
            <div className="h-6 bg-gray-200 rounded w-full"></div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Full page skeleton
export const PageSkeleton = () => {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <div className="h-8 bg-gray-300 rounded w-64"></div>
          <div className="h-4 bg-gray-200 rounded w-96"></div>
        </div>
        <div className="h-10 bg-gray-300 rounded w-32"></div>
      </div>

      {/* Content */}
      <CardSkeleton count={4} />
      <TableSkeleton rows={8} columns={6} />
    </div>
  );
};

export default {
  Table: TableSkeleton,
  Card: CardSkeleton,
  Form: FormSkeleton,
  Chart: ChartSkeleton,
  List: ListSkeleton,
  Detail: DetailSkeleton,
  Page: PageSkeleton,
};

// Dashboard skeleton for manager dashboard
export const DashboardSkeleton = () => {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-200 dark:bg-slate-700 rounded-lg"></div>
              <div className="flex-1">
                <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-16 mb-2"></div>
                <div className="h-6 bg-gray-300 dark:bg-slate-600 rounded w-20"></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Orders Section */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow">
        <div className="h-6 bg-gray-300 dark:bg-slate-600 rounded w-32 mb-4"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="border dark:border-slate-700 rounded-lg p-4">
              <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-24 mb-3"></div>
              {[...Array(3)].map((_, j) => (
                <div
                  key={j}
                  className="flex items-center gap-3 py-2 border-b dark:border-slate-700 last:border-0"
                >
                  <div className="w-8 h-8 bg-gray-200 dark:bg-slate-700 rounded"></div>
                  <div className="flex-1">
                    <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-full mb-1"></div>
                    <div className="h-2 bg-gray-100 dark:bg-slate-600 rounded w-3/4"></div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Menu skeleton for menu listing
export const MenuSkeleton = () => {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="h-10 bg-gray-200 dark:bg-slate-700 rounded-full px-6 min-w-[100px]"
          ></div>
        ))}
      </div>

      {/* Menu Items Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden shadow">
            <div className="h-40 bg-gray-200 dark:bg-slate-700"></div>
            <div className="p-4 space-y-3">
              <div className="h-5 bg-gray-300 dark:bg-slate-600 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-full"></div>
              <div className="flex justify-between items-center pt-2">
                <div className="h-6 bg-gray-300 dark:bg-slate-600 rounded w-16"></div>
                <div className="h-8 bg-gray-200 dark:bg-slate-700 rounded w-20"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Order card skeleton
export const OrderCardSkeleton = ({ count = 3 }) => {
  return (
    <div className="space-y-4 animate-pulse">
      {[...Array(count)].map((_, i) => (
        <div
          key={i}
          className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow border-l-4 border-gray-200 dark:border-slate-700"
        >
          <div className="flex justify-between items-start mb-3">
            <div>
              <div className="h-5 bg-gray-300 dark:bg-slate-600 rounded w-24 mb-2"></div>
              <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-32"></div>
            </div>
            <div className="h-6 bg-gray-200 dark:bg-slate-700 rounded-full w-20"></div>
          </div>
          <div className="space-y-2 mb-3">
            {[...Array(2)].map((_, j) => (
              <div key={j} className="flex justify-between">
                <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-32"></div>
                <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-16"></div>
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center pt-3 border-t dark:border-slate-700">
            <div className="h-5 bg-gray-300 dark:bg-slate-600 rounded w-20"></div>
            <div className="h-8 bg-gray-200 dark:bg-slate-700 rounded w-24"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Table grid skeleton for table management
export const TableGridSkeleton = ({ count = 12 }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 animate-pulse">
      {[...Array(count)].map((_, i) => (
        <div
          key={i}
          className="aspect-square bg-white dark:bg-slate-800 rounded-xl shadow flex flex-col items-center justify-center p-4"
        >
          <div className="w-12 h-12 bg-gray-200 dark:bg-slate-700 rounded-lg mb-3"></div>
          <div className="h-5 bg-gray-300 dark:bg-slate-600 rounded w-16 mb-2"></div>
          <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-12"></div>
        </div>
      ))}
    </div>
  );
};

// Profile/Settings skeleton
export const ProfileSkeleton = () => {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Profile Header */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow flex items-center gap-4">
        <div className="w-20 h-20 bg-gray-200 dark:bg-slate-700 rounded-full"></div>
        <div className="flex-1">
          <div className="h-6 bg-gray-300 dark:bg-slate-600 rounded w-48 mb-2"></div>
          <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-32"></div>
        </div>
        <div className="h-10 bg-gray-200 dark:bg-slate-700 rounded w-24"></div>
      </div>

      {/* Settings Sections */}
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow">
          <div className="h-5 bg-gray-300 dark:bg-slate-600 rounded w-32 mb-4"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, j) => (
              <div
                key={j}
                className="flex justify-between items-center py-2 border-b dark:border-slate-700 last:border-0"
              >
                <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-40"></div>
                <div className="h-8 bg-gray-200 dark:bg-slate-700 rounded w-20"></div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
