/**
 * DataTable Component
 * Reusable table with sorting, pagination, and search
 */

import React, { useState } from 'react';
import { ChevronUp, ChevronDown, Search } from 'lucide-react';

const DataTable = ({
  data = [],
  columns = [],
  searchable = true,
  searchPlaceholder = 'Search...',
  onRowClick = null,
  emptyMessage = 'No data available',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });

  // Filter data based on search
  const filteredData = searchable
    ? data.filter((row) =>
        columns.some((col) => {
          const value = col.accessor ? col.accessor(row) : row[col.field];
          return value?.toString().toLowerCase().includes(searchTerm.toLowerCase());
        })
      )
    : data;

  // Sort data
  const sortedData = React.useMemo(() => {
    if (!sortConfig.key) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = sortConfig.accessor
        ? sortConfig.accessor(a)
        : a[sortConfig.key];
      const bValue = sortConfig.accessor
        ? sortConfig.accessor(b)
        : b[sortConfig.key];

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [filteredData, sortConfig]);

  // Handle sort
  const handleSort = (column) => {
    if (!column.sortable) return;

    let direction = 'asc';
    if (sortConfig.key === column.field && sortConfig.direction === 'asc') {
      direction = 'desc';
    }

    setSortConfig({
      key: column.field,
      direction,
      accessor: column.accessor,
    });
  };

  return (
    <div className="w-full">
      {/* Search Bar */}
      {searchable && (
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto border border-gray-700 rounded-lg">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-gray-800">
            <tr>
              {columns.map((column, index) => (
                <th
                  key={index}
                  onClick={() => handleSort(column)}
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-200 uppercase tracking-wider ${
                    column.sortable ? 'cursor-pointer hover:bg-gray-700' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span>{column.header}</span>
                    {column.sortable && (
                      <div className="flex flex-col">
                        <ChevronUp
                          className={`h-3 w-3 ${
                            sortConfig.key === column.field &&
                            sortConfig.direction === 'asc'
                              ? 'text-orange-400'
                              : 'text-gray-500'
                          }`}
                        />
                        <ChevronDown
                          className={`h-3 w-3 -mt-1 ${
                            sortConfig.key === column.field &&
                            sortConfig.direction === 'desc'
                              ? 'text-orange-400'
                              : 'text-gray-500'
                          }`}
                        />
                      </div>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-gray-900 divide-y divide-gray-700">
            {sortedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-8 text-center text-gray-400"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              sortedData.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={`${
                    onRowClick ? 'cursor-pointer hover:bg-gray-800' : ''
                  } transition-colors`}
                >
                  {columns.map((column, colIndex) => (
                    <td key={colIndex} className="px-6 py-4 whitespace-nowrap">
                      {column.render
                        ? column.render(row)
                        : column.accessor
                        ? column.accessor(row)
                        : row[column.field]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Results Count */}
      {searchable && (
        <div className="mt-4 text-sm text-gray-600">
          Showing {sortedData.length} of {data.length} results
        </div>
      )}
    </div>
  );
};

export default DataTable;
