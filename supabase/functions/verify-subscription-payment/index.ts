// @ts-nocheck
// Deno Edge Function - TypeScript checks disabled for Deno-specific imports
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { createHmac } from "https://deno.land/std@0.168.0/node/crypto.ts"

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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', // Use service role for backend operations
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      billingId,
      restaurantId,
      amount
    } = await req.json()

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      throw new Error('Missing Razorpay payment details')
    }

    if (!billingId || !restaurantId) {
      throw new Error('Missing billing or restaurant ID')
    }

    // Verify Razorpay signature
    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET')
    if (!razorpayKeySecret) {
      throw new Error('Razorpay secret not configured')
    }

    const generatedSignature = createHmac('sha256', razorpayKeySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex')

    if (generatedSignature !== razorpay_signature) {
      console.error('Signature verification failed:', {
        expected: generatedSignature,
        received: razorpay_signature
      })
      
      // Log security event
      await supabaseClient.from('payment_credential_audit').insert({
        restaurant_id: restaurantId,
        action: 'payment_verification_failed',
        notes: `Invalid signature for payment ${razorpay_payment_id}`,
        ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
        user_agent: req.headers.get('user-agent')
      })
      
      throw new Error('Invalid payment signature')
    }

    // Signature is valid - process payment
    console.log('Payment signature verified successfully')

    // Call the database function to process payment
    const { data: result, error: processError } = await supabaseClient
      .rpc('process_subscription_payment', {
        p_billing_id: billingId,
        p_amount: amount,
        p_payment_method: 'razorpay',
        p_transaction_id: razorpay_payment_id,
        p_payment_gateway_order_id: razorpay_order_id,
        p_receipt_url: null // Will be generated later
      })

    if (processError) {
      console.error('Error processing payment:', processError)
      throw processError
    }

    if (!result || !result.success) {
      throw new Error(result?.error || 'Failed to process payment')
    }

    // Fetch Razorpay payment details for receipt
    const razorpayKeyId = Deno.env.get('RAZORPAY_KEY_ID')
    const paymentDetailsResponse = await fetch(
      `https://api.razorpay.com/v1/payments/${razorpay_payment_id}`,
      {
        headers: {
          'Authorization': 'Basic ' + btoa(`${razorpayKeyId}:${razorpayKeySecret}`)
        }
      }
    )

    let paymentDetails = null
    if (paymentDetailsResponse.ok) {
      paymentDetails = await paymentDetailsResponse.json()
    }

    // Generate receipt URL (stored in Supabase Storage)
    let receiptUrl: string | null = null
    try {
      // Create receipt data for storage
      const receiptData = {
        payment_id: razorpay_payment_id,
        order_id: razorpay_order_id,
        amount: amount,
        restaurant_id: restaurantId,
        billing_id: billingId,
        payment_method: paymentDetails?.method || 'razorpay',
        card_last4: paymentDetails?.card?.last4 || null,
        paid_at: new Date().toISOString(),
        subscription_extended_to: result.subscription_extended_to
      }

      // Store receipt metadata in database (actual PDF generation would be in a separate service)
      // The receipt can be viewed/downloaded via the billing management page
      const { error: receiptError } = await supabaseClient
        .from('billing')
        .update({ 
          receipt_url: `receipt://${razorpay_payment_id}`, // Placeholder URL, real PDF would need a PDF service
          payment_details: receiptData,
          updated_at: new Date().toISOString()
        })
        .eq('id', billingId)

      if (!receiptError) {
        receiptUrl = `receipt://${razorpay_payment_id}`
      }

      console.log('Receipt data stored for payment:', razorpay_payment_id)
    } catch (receiptErr) {
      // Non-critical - don't fail the payment if receipt storage fails
      console.warn('Could not store receipt data:', receiptErr)
    }

    console.log('Payment processed successfully:', result)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Payment verified and processed successfully',
        payment_id: result.payment_id,
        restaurant_id: result.restaurant_id,
        subscription_extended_to: result.subscription_extended_to,
        restaurant_reactivated: result.restaurant_reactivated,
        receipt_url: receiptUrl,
        razorpay_payment_details: paymentDetails
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error: unknown) {
    console.error('Error in verify-subscription-payment:', error)
    const errorMessage = error instanceof Error ? error.message : 'Payment verification failed'
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
