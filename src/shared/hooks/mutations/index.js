/**
 * React Query Mutations - Central Export
 * All mutation hooks for the application
 */

// Order Mutations
export {
  useCreateOrder,
  useUpdateOrderStatus,
  useAddOrderItems,
  useUpdateOrderItemStatus,
  useCancelOrder,
  useDeleteOrder,
} from './useOrderMutations';

// Payment Mutations
export {
  useProcessPayment,
  useSplitPayment,
  useProcessRefund,
  useMarkPaymentPending,
  useConfirmCashPayment,
} from './usePaymentMutations';

// Menu Mutations
export {
  useCreateMenuItem,
  useUpdateMenuItem,
  useToggleMenuItemAvailability,
  useDeleteMenuItem,
  useCreateMenuCategory,
  useUpdateMenuCategory,
  useDeleteMenuCategory,
  useBulkUpdatePrices,
} from './useMenuMutations';

// Table Mutations
export {
  useCreateTable,
  useUpdateTable,
  useUpdateTableStatus,
  useOccupyTable,
  useFreeTable,
  useMarkTableClean,
  useDeleteTable,
  useTransferTable,
} from './useTableMutations';
