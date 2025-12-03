/**
 * React Query Hooks Index
 * Central export for all query hooks
 */

// Order queries
export {
  useOrders,
  useOrder,
  useCreateOrder,
  useUpdateOrder,
  useUpdateOrderStatus,
  useCancelOrder,
  useApplyDiscount,
} from './useOrderQueries';

// Table queries
export { useTables, useTable, useMarkTableOccupied } from './useTableQueries';

// Menu queries
export { useMenuItems, useMenuItemsByCategory } from './useMenuQueries';
