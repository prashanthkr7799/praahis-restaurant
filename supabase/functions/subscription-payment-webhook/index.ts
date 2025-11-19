import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { createHmac } from "https://deno.land/std@0.168.0/node/crypto.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-razorpay-signature',
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get webhook signature
    const webhookSignature = req.headers.get('x-razorpay-signature')
    if (!webhookSignature) {
      throw new Error('Missing webhook signature')
    }

    // Get request body
    const body = await req.text()
    const payload = JSON.parse(body)

    // Verify webhook signature
    const webhookSecret = Deno.env.get('RAZORPAY_WEBHOOK_SECRET')
    if (!webhookSecret) {
      throw new Error('Webhook secret not configured')
    }

    const expectedSignature = createHmac('sha256', webhookSecret)
      .update(body)
      .digest('hex')

    if (expectedSignature !== webhookSignature) {
      console.error('Webhook signature verification failed')
      throw new Error('Invalid webhook signature')
    }

    console.log('Webhook signature verified:', payload.event)

    // Process webhook based on event type
    const event = payload.event
    const paymentEntity = payload.payload?.payment?.entity

    switch (event) {
      case 'payment.authorized':
      case 'payment.captured':
        // Payment successful
        console.log('Payment successful:', paymentEntity?.id)
        
        if (paymentEntity && paymentEntity.notes) {
          const billingId = paymentEntity.notes.billing_id
          const restaurantId = paymentEntity.notes.restaurant_id
          const amount = paymentEntity.amount / 100 // Convert from paise to rupees

          if (billingId && restaurantId) {
            // Process the payment
            const { data: result, error } = await supabaseClient
              .rpc('process_subscription_payment', {
                p_billing_id: billingId,
                p_amount: amount,
                p_payment_method: 'razorpay',
                p_transaction_id: paymentEntity.id,
                p_payment_gateway_order_id: paymentEntity.order_id,
                p_receipt_url: null
              })

            if (error) {
              console.error('Error processing payment from webhook:', error)
            } else {
              console.log('Payment processed successfully from webhook:', result)
            }
          }
        }
        break

      case 'payment.failed':
        // Payment failed
        console.log('Payment failed:', paymentEntity?.id)
        console.log('Failure reason:', paymentEntity?.error_description)
        
        // Log failed payment attempt
        if (paymentEntity && paymentEntity.notes) {
          await supabaseClient.from('payment_credential_audit').insert({
            restaurant_id: paymentEntity.notes.restaurant_id,
            action: 'payment_failed',
            notes: `Payment ${paymentEntity.id} failed: ${paymentEntity.error_description}`,
            metadata: paymentEntity
          })
        }
        break

      case 'order.paid':
        // Order paid confirmation
        console.log('Order paid:', payload.payload?.order?.entity?.id)
        break

      default:
        console.log('Unhandled webhook event:', event)
    }

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        event: event,
        message: 'Webhook processed successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error: unknown) {
    console.error('Error in subscription-payment-webhook:', error)
    const errorMessage = error instanceof Error ? error.message : 'Webhook processing failed'
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
