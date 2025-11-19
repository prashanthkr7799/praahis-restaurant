/**
 * useSearch Hook
 * Debounced search functionality with multi-entity support
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@shared/utils/api/supabaseClient';
import { getActiveRestaurantId } from '@/lib/restaurantContextStore';

/**
 * Hook for searching across multiple entities
 * @param {string} initialQuery - Initial search query
 * @param {object} options - Configuration options
 * @returns {object} { results, loading, error, search, clearResults }
 */
const useSearch = (initialQuery = '', options = {}) => {
  const {
    entities = ['menu_items', 'orders', 'users'],
    debounceMs = 500,
    minQueryLength = 2,
    limit = 10,
  } = options;

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Search function
  const performSearch = useCallback(async (searchQuery) => {
    if (!searchQuery || searchQuery.length < minQueryLength) {
      setResults({});
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const searchResults = {};

      // Search each entity
      const rid = getActiveRestaurantId();
      for (const entity of entities) {
        try {
          let data = [];

          if (entity === 'menu_items') {
            let query = supabase
              .from('menu_items')
              .select('*')
              .or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
            if (rid) query = query.eq('restaurant_id', rid);
            const { data: items, error: itemsError } = await query.limit(limit);

            if (!itemsError) data = items;
          } else if (entity === 'orders') {
            // Search by order ID or table number
            let query = supabase
              .from('orders')
              .select('*')
              .or(`id.ilike.%${searchQuery}%`);
            if (rid) query = query.eq('restaurant_id', rid);
            const { data: orders, error: ordersError } = await query.limit(limit);

            if (!ordersError) data = orders;
          } else if (entity === 'users') {
            let query = supabase
              .from('users')
              .select('*')
              .or(`full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
            if (rid) query = query.eq('restaurant_id', rid);
            const { data: users, error: usersError } = await query.limit(limit);

            if (!usersError) data = users;
          } else if (entity === 'tables') {
            let query = supabase
              .from('tables')
              .select('*')
              .eq('table_number', parseInt(searchQuery) || 0);
            if (rid) query = query.eq('restaurant_id', rid);
            const { data: tables, error: tablesError } = await query.limit(limit);

            if (!tablesError) data = tables;
          }

          searchResults[entity] = data || [];
        } catch (entityError) {
          console.error(`Error searching ${entity}:`, entityError);
          searchResults[entity] = [];
        }
      }

      setResults(searchResults);
    } catch (err) {
      console.error('Search error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [entities, limit, minQueryLength]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, debounceMs, performSearch]);

  // Public search function
  const search = (newQuery) => {
    setQuery(newQuery);
  };

  // Clear results
  const clearResults = () => {
    setQuery('');
    setResults({});
    setError(null);
  };

  // Get total results count
  const totalResults = Object.values(results).reduce(
    (sum, entityResults) => sum + (entityResults?.length || 0),
    0
  );

  return {
    query,
    results,
    loading,
    error,
    search,
    clearResults,
    totalResults,
  };
};

export default useSearch;
