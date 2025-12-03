/**
 * Table Mutations - React Query
 * Service layer for table-related operations
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@config/supabase';
import toast from 'react-hot-toast';

/**
 * Create a new table
 */
export const useCreateTable = (options = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tableData) => {
      const { data, error } = await supabase
        .from('tables')
        .insert([
          {
            ...tableData,
            status: 'available',
            created_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      toast.success(`Table ${data.table_number} created`);
      options.onSuccess?.(data);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create table');
      options.onError?.(error);
    },
  });
};

/**
 * Update table information
 */
export const useUpdateTable = (options = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tableId, updates }) => {
      const { data, error } = await supabase
        .from('tables')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', tableId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      queryClient.invalidateQueries({ queryKey: ['table', data.id] });
      toast.success(`Table ${data.table_number} updated`);
      options.onSuccess?.(data);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update table');
      options.onError?.(error);
    },
  });
};

/**
 * Update table status
 */
export const useUpdateTableStatus = (options = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tableId, status }) => {
      const { data, error } = await supabase
        .from('tables')
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', tableId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });

      const statusMessages = {
        available: 'Table is now available',
        occupied: 'Table marked as occupied',
        reserved: 'Table reserved',
        cleaning: 'Table marked for cleaning',
      };

      toast.success(statusMessages[data.status] || 'Table status updated');
      options.onSuccess?.(data);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update table status');
      options.onError?.(error);
    },
  });
};

/**
 * Assign session to table (occupy table)
 */
export const useOccupyTable = (options = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tableId, sessionId, guestCount }) => {
      const { data, error } = await supabase
        .from('tables')
        .update({
          status: 'occupied',
          current_session_id: sessionId,
          guest_count: guestCount,
          occupied_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', tableId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      toast.success(`Table ${data.table_number} is now occupied`);
      options.onSuccess?.(data);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to occupy table');
      options.onError?.(error);
    },
  });
};

/**
 * Free up a table (end session)
 */
export const useFreeTable = (options = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tableId) => {
      const { data, error } = await supabase
        .from('tables')
        .update({
          status: 'cleaning',
          current_session_id: null,
          guest_count: null,
          occupied_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', tableId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      toast.success(`Table ${data.table_number} cleared for cleaning`);
      options.onSuccess?.(data);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to free table');
      options.onError?.(error);
    },
  });
};

/**
 * Mark table as cleaned (available)
 */
export const useMarkTableClean = (options = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tableId) => {
      const { data, error } = await supabase
        .from('tables')
        .update({
          status: 'available',
          updated_at: new Date().toISOString(),
        })
        .eq('id', tableId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      toast.success(`Table ${data.table_number} is now available`);
      options.onSuccess?.(data);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to mark table clean');
      options.onError?.(error);
    },
  });
};

/**
 * Delete a table
 */
export const useDeleteTable = (options = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tableId) => {
      // Check if table has active sessions
      const { data: table } = await supabase
        .from('tables')
        .select('status, current_session_id')
        .eq('id', tableId)
        .single();

      if (table?.status === 'occupied' || table?.current_session_id) {
        throw new Error('Cannot delete an occupied table');
      }

      const { error } = await supabase.from('tables').delete().eq('id', tableId);

      if (error) throw error;
      return tableId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      toast.success('Table deleted');
      options.onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete table');
      options.onError?.(error);
    },
  });
};

/**
 * Transfer session between tables
 */
export const useTransferTable = (options = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ fromTableId, toTableId }) => {
      // Get source table data
      const { data: fromTable, error: fromError } = await supabase
        .from('tables')
        .select('*')
        .eq('id', fromTableId)
        .single();

      if (fromError) throw fromError;

      // Check destination table is available
      const { data: toTable, error: toError } = await supabase
        .from('tables')
        .select('status')
        .eq('id', toTableId)
        .single();

      if (toError) throw toError;
      if (toTable.status !== 'available') {
        throw new Error('Destination table is not available');
      }

      // Transfer session to new table
      await supabase
        .from('tables')
        .update({
          status: 'occupied',
          current_session_id: fromTable.current_session_id,
          guest_count: fromTable.guest_count,
          occupied_at: fromTable.occupied_at,
          updated_at: new Date().toISOString(),
        })
        .eq('id', toTableId);

      // Clear original table
      await supabase
        .from('tables')
        .update({
          status: 'cleaning',
          current_session_id: null,
          guest_count: null,
          occupied_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', fromTableId);

      // Update session with new table
      if (fromTable.current_session_id) {
        await supabase
          .from('sessions')
          .update({ table_id: toTableId })
          .eq('id', fromTable.current_session_id);
      }

      return { fromTableId, toTableId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      toast.success('Table transfer completed');
      options.onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to transfer table');
      options.onError?.(error);
    },
  });
};

export default {
  useCreateTable,
  useUpdateTable,
  useUpdateTableStatus,
  useOccupyTable,
  useFreeTable,
  useMarkTableClean,
  useDeleteTable,
  useTransferTable,
};
