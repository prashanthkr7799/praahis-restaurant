/**
 * Payment Management Functions
 * Handle payments, refunds, and split payments
 */

import { supabase } from './client';
import { resolveRestaurantId } from './restaurant';

/**
 * Update payment status for an order
 */
export const updatePaymentStatus = async (orderId, paymentStatus) => {
  const updateData = {
    payment_status: paymentStatus,
    updated_at: new Date().toISOString(),
  };

  // If payment is successful, change order status from 'pending_payment' to 'received'
  if (paymentStatus === 'paid') {
    updateData.order_status = 'received';
  }

  const { data, error } = await supabase
    .from('orders')
    .update(updateData)
    .eq('id', orderId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Create payment record
 */
export const createPayment = async (paymentData) => {
  const rid = resolveRestaurantId(paymentData?.restaurant_id);
  const { data, error } = await supabase
    .from('order_payments')
    .insert([{ ...paymentData, restaurant_id: rid }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Update payment record
 */
export const updatePayment = async (paymentId, paymentData) => {
  const { data, error } = await supabase
    .from('payments')
    .update(paymentData)
    .eq('id', paymentId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Process refund for a paid order
 */
export const processRefund = async (orderId, refundData) => {
  try {
    const {
      refundAmount,
      reason,
      refundMethod = 'original_method',
      alreadyRefunded = 0,
    } = refundData;

    if (!orderId) throw new Error('Order ID is required');
    if (!refundAmount || refundAmount <= 0) {
      throw new Error('Valid refund amount is required');
    }
    if (!reason || reason.trim().length === 0) {
      throw new Error('Refund reason is required');
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, order_payments(*)')
      .eq('id', orderId)
      .single();

    if (orderError) throw orderError;
    if (!order) throw new Error('Order not found');

    if (order.payment_status !== 'paid' && order.payment_status !== 'partially_refunded') {
      throw new Error(
        `Cannot process refund. Order payment status is "${order.payment_status}". Only paid orders can be refunded.`
      );
    }

    const totalRefunded = alreadyRefunded + refundAmount;
    const orderTotal = parseFloat(order.total || 0);

    let actualPaidAmount = orderTotal;
    if (order.order_payments && order.order_payments.length > 0) {
      actualPaidAmount = order.order_payments.reduce(
        (sum, p) => sum + parseFloat(p.amount || 0),
        0
      );
    }

    if (totalRefunded > actualPaidAmount) {
      throw new Error(
        `Refund amount (₹${totalRefunded}) cannot exceed paid amount (₹${actualPaidAmount})`
      );
    }

    if (totalRefunded > orderTotal) {
      throw new Error(
        `Total refund (₹${totalRefunded}) cannot exceed order total (₹${orderTotal})`
      );
    }

    const newPaymentStatus = totalRefunded >= orderTotal ? 'refunded' : 'partially_refunded';

    const { data: updatedOrder, error: orderUpdateError } = await supabase
      .from('orders')
      .update({
        payment_status: newPaymentStatus,
        refund_amount: totalRefunded,
        refund_reason: reason,
        refunded_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)
      .select()
      .single();

    if (orderUpdateError) throw orderUpdateError;

    if (order.order_payments && order.order_payments.length > 0) {
      const payment = order.order_payments[0];
      const newRefundAmount = parseFloat(payment.refund_amount || 0) + refundAmount;

      const { error: paymentUpdateError } = await supabase
        .from('order_payments')
        .update({
          refund_amount: newRefundAmount,
          refund_reason: reason,
          refund_method: refundMethod,
          refunded_at: new Date().toISOString(),
          status: newPaymentStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', payment.id);

      if (paymentUpdateError) {
        console.error('Failed to update payment record:', paymentUpdateError);
      }
    }

    return {
      success: true,
      order: updatedOrder,
      totalRefunded,
      status: newPaymentStatus,
    };
  } catch (error) {
    console.error('Error processing refund:', error);
    throw new Error(`Failed to process refund: ${error.message}`);
  }
};

/**
 * Process split payment (cash + online)
 */
export const processSplitPayment = async (
  orderId,
  cashAmount,
  onlineAmount,
  razorpayPaymentId = null
) => {
  try {
    if (!orderId) throw new Error('Order ID is required');
    if (!cashAmount || cashAmount <= 0) {
      throw new Error('Cash amount must be greater than 0');
    }
    if (!onlineAmount || onlineAmount <= 0) {
      throw new Error('Online amount must be greater than 0');
    }

    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('total, restaurant_id')
      .eq('id', orderId)
      .single();

    if (fetchError) throw fetchError;
    if (!order) throw new Error('Order not found');

    const totalPayment = cashAmount + onlineAmount;
    const orderTotal = parseFloat(order.total || 0);

    if (Math.abs(totalPayment - orderTotal) > 0.01) {
      throw new Error(
        `Split payment total (₹${totalPayment}) does not match order total (₹${orderTotal})`
      );
    }

    const splitDetails = {
      cash_amount: cashAmount,
      online_amount: onlineAmount,
      split_timestamp: new Date().toISOString(),
    };

    if (razorpayPaymentId) {
      splitDetails.razorpay_payment_id = razorpayPaymentId;
    }

    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update({
        payment_method: 'split',
        payment_split_details: splitDetails,
        payment_status: 'paid',
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)
      .select()
      .single();

    if (updateError) throw updateError;

    if (razorpayPaymentId) {
      await createPayment({
        order_id: orderId,
        restaurant_id: order.restaurant_id,
        razorpay_payment_id: razorpayPaymentId,
        amount: onlineAmount,
        currency: 'INR',
        status: 'captured',
        payment_method: 'razorpay',
        payment_details: { split_payment: true, cash_amount: cashAmount },
      });
    }

    return {
      success: true,
      order: updatedOrder,
      splitDetails,
    };
  } catch (error) {
    console.error('Error processing split payment:', error);
    throw new Error(`Failed to process split payment: ${error.message}`);
  }
};

/**
 * Handle full split payment workflow including Razorpay processing
 */
export const handleSplitPayment = async (orderId, payments) => {
  try {
    const { cash, online, razorpayDetails } = payments;

    if (!cash || cash <= 0) {
      throw new Error('Cash amount must be greater than 0');
    }
    if (!online || online <= 0) {
      throw new Error('Online amount must be greater than 0');
    }

    let razorpayPaymentId = null;

    if (razorpayDetails) {
      const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = razorpayDetails;

      if (!razorpay_payment_id) {
        throw new Error('Razorpay payment ID is required for online portion');
      }

      razorpayPaymentId = razorpay_payment_id;

      if (razorpay_order_id && razorpay_signature) {
        const { data: verifyResult, error: verifyError } = await supabase.functions.invoke(
          'verify-payment',
          {
            body: {
              razorpay_order_id,
              razorpay_payment_id,
              razorpay_signature,
              order_id: orderId,
              restaurant_id: resolveRestaurantId(),
            },
          }
        );

        if (verifyError || !verifyResult?.success) {
          throw new Error(verifyResult?.error || 'Payment verification failed');
        }
      }
    }

    const result = await processSplitPayment(orderId, cash, online, razorpayPaymentId);

    return result;
  } catch (error) {
    console.error('Error handling split payment:', error);
    throw new Error(`Failed to handle split payment: ${error.message}`);
  }
};
