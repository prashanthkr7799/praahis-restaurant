/**
 * SearchBar Component
 * Reusable search input with icon
 */

import React from 'react';
import { Search, X } from 'lucide-react';

const SearchBar = ({ 
  value, 
  onChange, 
  placeholder = 'Search...', 
  onClear,
  className = '',
  id = 'search-input',
  name,
  label,
  ariaLabel
}) => {
  const handleClear = () => {
    onChange({ target: { value: '' } });
    if (onClear) onClear();
  };

  const inputName = name || id || 'search';

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label htmlFor={id} className="mb-1 block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        id={id}
        name={inputName}
        aria-label={ariaLabel || label || placeholder}
        autoComplete="off"
        className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      {value && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      )}
    </div>
  );
};

export default SearchBar;
