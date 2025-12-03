/**
 * Payment Mutations - React Query
 * Service layer for payment-related operations
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@config/supabase';
import toast from 'react-hot-toast';

/**
 * Process payment for an order
 */
export const useProcessPayment = (options = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, paymentData }) => {
      const { data, error } = await supabase
        .from('payments')
        .insert([
          {
            order_id: orderId,
            amount: paymentData.amount,
            method: paymentData.method,
            status: 'completed',
            reference_number: paymentData.referenceNumber || null,
            processed_by: paymentData.processedBy || null,
            notes: paymentData.notes || null,
            created_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) throw error;

      // Update order payment status
      await supabase
        .from('orders')
        .update({
          payment_status: 'paid',
          paid_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      toast.success('Payment processed successfully');
      options.onSuccess?.(data);
    },
    onError: (error) => {
      toast.error(error.message || 'Payment failed');
      options.onError?.(error);
    },
  });
};

/**
 * Process split payment
 */
export const useSplitPayment = (options = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, payments }) => {
      const paymentRecords = payments.map((payment) => ({
        order_id: orderId,
        amount: payment.amount,
        method: payment.method,
        status: 'completed',
        reference_number: payment.referenceNumber || null,
        processed_by: payment.processedBy || null,
        notes: `Split payment ${payment.index + 1}/${payments.length}`,
        created_at: new Date().toISOString(),
      }));

      const { data, error } = await supabase.from('payments').insert(paymentRecords).select();

      if (error) throw error;

      // Update order payment status
      await supabase
        .from('orders')
        .update({
          payment_status: 'paid',
          paid_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success(`Split payment (${data.length} parts) processed`);
      options.onSuccess?.(data);
    },
    onError: (error) => {
      toast.error(error.message || 'Split payment failed');
      options.onError?.(error);
    },
  });
};

/**
 * Process refund
 */
export const useProcessRefund = (options = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ paymentId, refundData }) => {
      // Get original payment
      const { data: originalPayment, error: fetchError } = await supabase
        .from('payments')
        .select('*')
        .eq('id', paymentId)
        .single();

      if (fetchError) throw fetchError;

      // Create refund record
      const { data, error } = await supabase
        .from('payments')
        .insert([
          {
            order_id: originalPayment.order_id,
            amount: -refundData.amount,
            method: originalPayment.method,
            status: 'refunded',
            reference_number: `REFUND-${paymentId}`,
            processed_by: refundData.processedBy || null,
            notes: refundData.reason || 'Customer refund',
            original_payment_id: paymentId,
            created_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) throw error;

      // Update original payment status
      await supabase.from('payments').update({ status: 'refunded' }).eq('id', paymentId);

      // Update order if fully refunded
      if (refundData.amount >= originalPayment.amount) {
        await supabase
          .from('orders')
          .update({ payment_status: 'refunded' })
          .eq('id', originalPayment.order_id);
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Refund processed successfully');
      options.onSuccess?.(data);
    },
    onError: (error) => {
      toast.error(error.message || 'Refund failed');
      options.onError?.(error);
    },
  });
};

/**
 * Mark payment as pending (for cash payments)
 */
export const useMarkPaymentPending = (options = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, amount }) => {
      const { data, error } = await supabase
        .from('payments')
        .insert([
          {
            order_id: orderId,
            amount,
            method: 'cash',
            status: 'pending',
            notes: 'Awaiting cash payment',
            created_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) throw error;

      // Update order payment status
      await supabase.from('orders').update({ payment_status: 'pending' }).eq('id', orderId);

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.info('Payment marked as pending');
      options.onSuccess?.(data);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to mark payment');
      options.onError?.(error);
    },
  });
};

/**
 * Confirm cash payment received
 */
export const useConfirmCashPayment = (options = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ paymentId, receivedAmount, processedBy }) => {
      const { data, error } = await supabase
        .from('payments')
        .update({
          status: 'completed',
          received_amount: receivedAmount,
          processed_by: processedBy,
          completed_at: new Date().toISOString(),
        })
        .eq('id', paymentId)
        .select()
        .single();

      if (error) throw error;

      // Update order payment status
      await supabase
        .from('orders')
        .update({
          payment_status: 'paid',
          paid_at: new Date().toISOString(),
        })
        .eq('id', data.order_id);

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Cash payment confirmed');
      options.onSuccess?.(data);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to confirm payment');
      options.onError?.(error);
    },
  });
};

export default {
  useProcessPayment,
  useSplitPayment,
  useProcessRefund,
  useMarkPaymentPending,
  useConfirmCashPayment,
};
