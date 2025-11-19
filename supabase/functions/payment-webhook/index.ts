// ============================================================================
// PAYMENT WEBHOOK HANDLER - Supabase Edge Function
// ============================================================================
// Description: Handles payment gateway webhooks (Razorpay, Stripe, etc.)
//              Uses restaurant-specific webhook secrets for multi-tenant support
// Endpoint: POST /functions/v1/payment-webhook
// ============================================================================

// @ts-nocheck - Deno types are provided by Supabase runtime

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { createHmac } from 'https://deno.land/std@0.168.0/node/crypto.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-razorpay-signature',
}

/**
 * Fetch restaurant-specific webhook secret from payment_settings
 */
async function getRestaurantWebhookSecret(supabaseClient: any, restaurantId: string): Promise<string | null> {
  try {
    const { data, error } = await supabaseClient
      .from('restaurants')
      .select('payment_settings')
      .eq('id', restaurantId)
      .single()

    if (error || !data) {
      console.error('Failed to fetch restaurant webhook secret:', error)
      return null
    }

    const paymentSettings = data.payment_settings || {}
    return paymentSettings.razorpay_webhook_secret || null
  } catch (err) {
    console.error('Error getting webhook secret:', err)
    return null
  }
}

/**
 * Verify Razorpay webhook signature using restaurant-specific secret
 */
function verifyRazorpaySignature(body: string, signature: string, secret: string): boolean {
  try {
    const expectedSignature = createHmac('sha256', secret)
      .update(body)
      .digest('hex')
    return expectedSignature === signature
  } catch (err) {
    console.error('Signature verification error:', err)
    return false
  }
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const bodyText = await req.text()
    const body = JSON.parse(bodyText)
    
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Extract event and payload
    const event = body.event
    const payload = body.payload?.payment?.entity || body.data?.object

    if (!payload) {
      throw new Error('Invalid webhook payload')
    }

    // Extract restaurant ID from payment notes/metadata
    const restaurantId = payload.notes?.restaurant_id || payload.metadata?.restaurant_id
    
    // Get webhook signature header
    const signature = req.headers.get('x-razorpay-signature')
    
    // Verify signature using restaurant-specific secret
    if (signature) {
      let webhookSecret = null
      
      // Try to get restaurant-specific secret
      if (restaurantId) {
        webhookSecret = await getRestaurantWebhookSecret(supabaseClient, restaurantId)
        console.log(`Using restaurant-specific webhook secret for restaurant: ${restaurantId}`)
      }
      
      // Fallback to platform secret if restaurant secret not found
      if (!webhookSecret) {
        webhookSecret = Deno.env.get('RAZORPAY_WEBHOOK_SECRET') ?? ''
        console.log('Using platform fallback webhook secret')
      }

      if (webhookSecret) {
        const isValid = verifyRazorpaySignature(bodyText, signature, webhookSecret)
        if (!isValid) {
          console.error('❌ Invalid webhook signature')
          return new Response(
            JSON.stringify({ error: 'Invalid signature' }),
            { headers: corsHeaders, status: 401 }
          )
        }
        console.log('✅ Webhook signature verified')
      } else {
        console.warn('⚠️ No webhook secret found, skipping verification')
      }
    }

    console.log('✅ Processing webhook event:', event)

    switch (event) {
      case 'payment.captured':
      case 'payment_intent.succeeded':
      case 'charge.succeeded': {
        console.log('💰 Payment successful:', payload.id)

        // Check if this is for order payment or billing
        const orderId = payload.notes?.order_id || payload.metadata?.order_id
        const billingId = payload.notes?.billing_id || payload.metadata?.billing_id

        // Handle customer order payment
        if (orderId) {
          console.log('Processing order payment:', orderId)
          
          // Update order_payments table
          const { error: paymentError } = await supabaseClient
            .from('order_payments')
            .update({
              status: 'captured',
              payment_details: {
                ...payload,
                captured_at: new Date().toISOString()
              }
            })
            .eq('razorpay_payment_id', payload.id)

          if (paymentError) {
            console.error('Error updating order payment:', paymentError)
          } else {
            console.log('✅ Order payment updated')
          }

          // Update order status to paid
          const { error: orderError } = await supabaseClient
            .from('orders')
            .update({
              payment_status: 'paid',
              order_status: 'received'
            })
            .eq('id', orderId)

          if (orderError) {
            console.error('Error updating order status:', orderError)
          } else {
            console.log('✅ Order status updated to paid')
          }

          // Log to audit trail
          await supabaseClient.from('audit_trail').insert({
            restaurant_id: restaurantId,
            action: 'order_payment_received',
            entity_type: 'order_payment',
            entity_id: orderId,
            description: `Order payment received: ₹${payload.amount / 100}`,
            severity: 'info',
            metadata: {
              order_id: orderId,
              payment_id: payload.id,
              amount: payload.amount / 100,
              method: payload.method,
              gateway: 'razorpay',
              webhook_event: event
            }
          })
        }
        
        // Handle platform billing payment
        else if (billingId) {
          console.log('Processing billing payment:', billingId)

          // Mark bill as paid
          const { data, error } = await supabaseClient.rpc('mark_bill_as_paid', {
            p_billing_id: billingId,
            p_payment_method: payload.method || 'razorpay',
            p_transaction_id: payload.id,
            p_verified_by: null // Auto-verified by webhook
          })

          if (error) {
            console.error('❌ Error marking bill as paid:', error)
            throw error
          }

          console.log('✅ Bill marked as paid:', data)

          // Log to audit trail
          await supabaseClient.from('audit_trail').insert({
            restaurant_id: restaurantId,
            action: 'payment_made',
            entity_type: 'payment',
            entity_id: data.payment_id,
            description: `Billing payment received: ₹${payload.amount / 100}`,
            severity: 'info',
            metadata: {
              billing_id: billingId,
              payment_id: data.payment_id,
              amount: payload.amount / 100,
              method: payload.method,
              transaction_id: payload.id,
              gateway: 'razorpay',
              webhook_event: event
            }
          })
        } else {
          console.warn('⚠️ Payment webhook received but no order_id or billing_id found in notes')
        }

        break
      }

      case 'payment.failed':
      case 'payment_intent.payment_failed':
      case 'charge.failed': {
        console.log('❌ Payment failed:', payload.id)

        const orderId = payload.notes?.order_id || payload.metadata?.order_id

        // Update order payment status if it's an order payment
        if (orderId) {
          await supabaseClient
            .from('order_payments')
            .update({
              status: 'failed',
              payment_details: {
                ...payload,
                failed_at: new Date().toISOString(),
                error_description: payload.error_description
              }
            })
            .eq('razorpay_payment_id', payload.id)
        }

        // Log failed payment
        await supabaseClient.from('audit_trail').insert({
          restaurant_id: restaurantId || null,
          action: 'payment_failed',
          entity_type: 'payment',
          description: `Payment failed: ${payload.error_description || 'Unknown error'}`,
          severity: 'error',
          metadata: {
            order_id: orderId,
            transaction_id: payload.id,
            amount: payload.amount / 100,
            error: payload.error_description,
            webhook_event: event
          }
        })

        break
      }

      default:
        console.log('ℹ️ Unhandled webhook event:', event)
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Webhook processed successfully',
        event: event,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('❌ Webhook error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: (error as Error).message,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})

/* ============================================================================
 * DEPLOYMENT INSTRUCTIONS - Multi-Tenant Payment Webhook
 * ============================================================================
 * 
 * This webhook now supports restaurant-specific payment verification.
 * Each restaurant can have their own Razorpay webhook secret stored in
 * payment_settings JSONB column.
 * 
 * ============================================================================
 * STEP 1: Deploy the Edge Function
 * ============================================================================
 * 
 *    supabase functions deploy payment-webhook
 * 
 * ============================================================================
 * STEP 2: Set Platform Fallback Secret (Optional but Recommended)
 * ============================================================================
 * 
 *    supabase secrets set RAZORPAY_WEBHOOK_SECRET=your_platform_webhook_secret
 * 
 *    This will be used if a restaurant hasn't configured their own secret.
 * 
 * ============================================================================
 * STEP 3: Configure Razorpay Webhook
 * ============================================================================
 * 
 *    For each restaurant's Razorpay account:
 * 
 *    1. Go to Razorpay Dashboard → Settings → Webhooks
 *    2. Add webhook URL: 
 *       https://YOUR_PROJECT_REF.supabase.co/functions/v1/payment-webhook
 *    3. Select events:
 *       - payment.captured
 *       - payment.failed
 *    4. Copy the webhook secret
 *    5. Manager adds it in: Manager Portal → Settings → Payment Gateway
 *    6. Secret is stored in restaurants.payment_settings->>'razorpay_webhook_secret'
 * 
 * ============================================================================
 * STEP 4: Test the Webhook
 * ============================================================================
 * 
 *    Test order payment webhook:
 * 
 *    curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/payment-webhook \
 *      -H "Content-Type: application/json" \
 *      -d '{
 *        "event": "payment.captured",
 *        "payload": {
 *          "payment": {
 *            "entity": {
 *              "id": "pay_test123",
 *              "amount": 50000,
 *              "method": "upi",
 *              "notes": {
 *                "order_id": "your-order-uuid",
 *                "restaurant_id": "your-restaurant-uuid"
 *              }
 *            }
 *          }
 *        }
 *      }'
 * 
 *    Test billing payment webhook:
 * 
 *    curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/payment-webhook \
 *      -H "Content-Type: application/json" \
 *      -d '{
 *        "event": "payment.captured",
 *        "payload": {
 *          "payment": {
 *            "entity": {
 *              "id": "pay_billing123",
 *              "amount": 3500000,
 *              "method": "card",
 *              "notes": {
 *                "billing_id": "your-billing-uuid",
 *                "restaurant_id": "your-restaurant-uuid"
 *              }
 *            }
 *          }
 *        }
 *      }'
 * 
 * ============================================================================
 * VERIFICATION
 * ============================================================================
 * 
 *    Check Supabase function logs:
 *    - Should see "Using restaurant-specific webhook secret"
 *    - Should see "✅ Webhook signature verified"
 *    - Should see "✅ Order payment updated" or "✅ Bill marked as paid"
 * 
 *    Check database:
 *    - order_payments table: status should be 'captured'
 *    - orders table: payment_status should be 'paid'
 *    - audit_trail table: should have payment event logged
 * 
 * ============================================================================
 * WEBHOOK PAYLOAD STRUCTURE
 * ============================================================================
 * 
 *    For Order Payments:
 *    - Must include: notes.order_id
 *    - Must include: notes.restaurant_id
 *    - Updates: order_payments and orders tables
 * 
 *    For Billing Payments:
 *    - Must include: notes.billing_id
 *    - Must include: notes.restaurant_id (optional, for secret lookup)
 *    - Updates: billing and payments tables via RPC
 * 
 * ============================================================================
 */
