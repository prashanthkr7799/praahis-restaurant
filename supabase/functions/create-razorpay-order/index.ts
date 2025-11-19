// Supabase Edge Function to create Razorpay orders
// Deploy this to Supabase: supabase functions deploy create-razorpay-order

/// <reference types="https://deno.land/x/types/index.d.ts" />

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get request body
    const { restaurantId, amount, orderId, orderNumber, currency = 'INR' } = await req.json()

    // Validate inputs
    if (!restaurantId || !amount || !orderId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: restaurantId, amount, orderId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Fetch restaurant payment settings
    const { data: restaurant, error: dbError } = await supabase
      .from('restaurants')
      .select('payment_settings, razorpay_key_id, razorpay_key_secret, name')
      .eq('id', restaurantId)
      .single()

    if (dbError || !restaurant) {
      return new Response(
        JSON.stringify({ error: 'Restaurant not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const paymentSettings = restaurant.payment_settings || {}
    
    // Try to get keys: JSONB first, then columns, then fallback env
    let razorpayKeyId = paymentSettings.razorpay_key_id || restaurant.razorpay_key_id
    let razorpayKeySecret = paymentSettings.razorpay_key_secret || restaurant.razorpay_key_secret

    // Fallback to platform keys if restaurant doesn't have own keys
    if (!razorpayKeyId || !razorpayKeySecret) {
      razorpayKeyId = Deno.env.get('RAZORPAY_KEY_ID')
      razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET')
      
      if (!razorpayKeyId || !razorpayKeySecret) {
        return new Response(
          JSON.stringify({ error: 'Razorpay not configured for this restaurant or platform' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      console.log('Using fallback platform Razorpay keys for restaurant:', restaurantId)
    }

    // Create Razorpay order
    const razorpayAuth = btoa(`${razorpayKeyId}:${razorpayKeySecret}`)
    
    const razorpayResponse = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${razorpayAuth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: Math.round(amount * 100), // Convert to paise
        currency: currency,
        receipt: `order_${orderId}`,
        notes: {
          order_id: orderId,
          order_number: orderNumber,
          restaurant_id: restaurantId,
          restaurant_name: restaurant.name,
        },
      }),
    })

    const razorpayOrder = await razorpayResponse.json()

    if (!razorpayResponse.ok) {
      console.error('Razorpay error:', razorpayOrder)
      return new Response(
        JSON.stringify({ error: razorpayOrder.error?.description || 'Failed to create Razorpay order' }),
        { status: razorpayResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Return the Razorpay order ID
    return new Response(
      JSON.stringify({
        razorpay_order_id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        key_id: razorpayKeyId,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: unknown) {
    console.error('Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
