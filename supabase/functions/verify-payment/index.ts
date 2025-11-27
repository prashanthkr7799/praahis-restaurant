// @ts-nocheck
// Deno Edge Function - TypeScript checks disabled for Deno-specific imports
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { createHmac } from "https://deno.land/std@0.168.0/node/crypto.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Verify Razorpay payment signature
 * Called after successful payment to verify authenticity before updating order
 */
serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      order_id,
      restaurant_id
    } = await req.json()

    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing Razorpay payment details' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!order_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing order ID' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

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

    // Get restaurant-specific Razorpay secret if available, otherwise use default
    let keySecret = Deno.env.get('RAZORPAY_KEY_SECRET')
    
    if (restaurant_id) {
      const { data: credentials } = await supabaseClient
        .from('payment_credentials')
        .select('razorpay_key_secret')
        .eq('restaurant_id', restaurant_id)
        .eq('is_active', true)
        .single()
      
      if (credentials?.razorpay_key_secret) {
        keySecret = credentials.razorpay_key_secret
      }
    }

    if (!keySecret) {
      console.error('No Razorpay secret configured')
      return new Response(
        JSON.stringify({ success: false, error: 'Payment verification not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify Razorpay signature
    // Signature = HMAC-SHA256(razorpay_order_id + "|" + razorpay_payment_id, secret)
    const generatedSignature = createHmac('sha256', keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex')

    if (generatedSignature !== razorpay_signature) {
      console.error('Payment signature verification failed', {
        orderId: order_id,
        paymentId: razorpay_payment_id
      })

      // Log security event
      await supabaseClient.from('payment_credential_audit').insert({
        restaurant_id: restaurant_id || null,
        action: 'payment_verification_failed',
        notes: `Invalid signature for payment ${razorpay_payment_id}, order ${order_id}`,
        ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
        user_agent: req.headers.get('user-agent')
      }).catch(() => {}) // Don't fail if audit log fails

      return new Response(
        JSON.stringify({ success: false, error: 'Payment verification failed' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Signature verified! Update payment record
    const { error: updateError } = await supabaseClient
      .from('payments')
      .update({
        razorpay_payment_id: razorpay_payment_id,
        razorpay_order_id: razorpay_order_id,
        payment_verified: true,
        verified_at: new Date().toISOString()
      })
      .eq('order_id', order_id)

    if (updateError) {
      console.error('Error updating payment record:', updateError)
      // Don't fail the verification - payment was valid
    }

    // Log successful verification
    await supabaseClient.from('payment_credential_audit').insert({
      restaurant_id: restaurant_id || null,
      action: 'payment_verified',
      notes: `Payment ${razorpay_payment_id} verified for order ${order_id}`,
      ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
      user_agent: req.headers.get('user-agent')
    }).catch(() => {})

    return new Response(
      JSON.stringify({ 
        success: true, 
        verified: true,
        payment_id: razorpay_payment_id
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Payment verification error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
