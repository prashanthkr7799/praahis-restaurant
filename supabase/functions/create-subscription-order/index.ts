// @ts-nocheck
// Deno Edge Function - TypeScript checks disabled for Deno-specific imports
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { billingId, restaurantId } = await req.json()

    if (!billingId || !restaurantId) {
      throw new Error('billingId and restaurantId are required')
    }

    // Get billing details
    const { data: billing, error: billingError } = await supabaseClient
      .from('billing')
      .select('*, restaurants(name, slug)')
      .eq('id', billingId)
      .single()

    if (billingError) throw billingError
    if (!billing) throw new Error('Billing record not found')

    // Verify billing belongs to restaurant
    if (billing.restaurant_id !== restaurantId) {
      throw new Error('Unauthorized: Billing record does not belong to this restaurant')
    }

    // Check if already paid
    if (billing.status === 'paid') {
      throw new Error('This bill has already been paid')
    }

    // Initialize Razorpay (using platform's Razorpay account for subscriptions)
    const razorpayKeyId = Deno.env.get('RAZORPAY_KEY_ID')
    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET')

    if (!razorpayKeyId || !razorpayKeySecret) {
      throw new Error('Razorpay credentials not configured')
    }

    // Create Razorpay order
    const orderAmount = Math.round(billing.total_amount * 100) // Convert to paise
    const receiptId = `bill_${billing.invoice_number || billing.id}`

    const razorpayOrder = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + btoa(`${razorpayKeyId}:${razorpayKeySecret}`)
      },
      body: JSON.stringify({
        amount: orderAmount,
        currency: 'INR',
        receipt: receiptId,
        notes: {
          billing_id: billingId,
          restaurant_id: restaurantId,
          restaurant_name: billing.restaurants?.name || 'Unknown',
          billing_month: billing.billing_month,
          billing_year: billing.billing_year,
          payment_type: 'subscription'
        }
      })
    })

    if (!razorpayOrder.ok) {
      const errorData = await razorpayOrder.text()
      console.error('Razorpay API Error:', errorData)
      throw new Error('Failed to create Razorpay order')
    }

    const orderData = await razorpayOrder.json()

    // Return order details for frontend
    return new Response(
      JSON.stringify({
        success: true,
        order: {
          id: orderData.id,
          amount: orderData.amount,
          currency: orderData.currency,
          receipt: orderData.receipt
        },
        billing: {
          id: billing.id,
          invoice_number: billing.invoice_number,
          total_amount: billing.total_amount,
          due_date: billing.due_date,
          restaurant_name: billing.restaurants?.name
        },
        razorpayKey: razorpayKeyId // Send key for frontend checkout
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error: unknown) {
    console.error('Error in create-subscription-order:', error)
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
