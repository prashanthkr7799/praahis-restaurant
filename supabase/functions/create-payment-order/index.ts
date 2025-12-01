// Unified Payment Order Creation Edge Function
// Supports: Razorpay, PhonePe, Paytm
// Deploy: supabase functions deploy create-payment-order

// @ts-nocheck
// deno-lint-ignore-file
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { createHash } from 'https://deno.land/std@0.168.0/node/crypto.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Initialize Supabase client
const getSupabase = () => createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

// ============================================================================
// RAZORPAY
// ============================================================================
async function createRazorpayOrder(restaurant: any, orderData: any) {
  const settings = restaurant.payment_settings || {};
  const keyId = settings.razorpay_key_id || restaurant.razorpay_key_id || Deno.env.get('RAZORPAY_KEY_ID');
  const keySecret = settings.razorpay_key_secret || restaurant.razorpay_key_secret || Deno.env.get('RAZORPAY_KEY_SECRET');

  if (!keyId || !keySecret) {
    throw new Error('Razorpay credentials not configured');
  }

  const auth = btoa(`${keyId}:${keySecret}`);
  
  const response = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: Math.round(orderData.amount * 100), // paise
      currency: orderData.currency || 'INR',
      receipt: `order_${orderData.orderId}`,
      notes: {
        order_id: orderData.orderId,
        order_number: orderData.orderNumber,
        restaurant_id: orderData.restaurantId,
      },
    }),
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error?.description || 'Razorpay order creation failed');
  }

  return {
    gateway_order_id: data.id,
    key_id: keyId,
    amount: data.amount,
    currency: data.currency,
  };
}

// ============================================================================
// PHONEPE
// ============================================================================
async function createPhonePeOrder(restaurant: any, orderData: any) {
  const merchantId = restaurant.phonepe_merchant_id || Deno.env.get('PHONEPE_MERCHANT_ID');
  const saltKey = restaurant.phonepe_salt_key || Deno.env.get('PHONEPE_SALT_KEY');
  const saltIndex = restaurant.phonepe_salt_index || Deno.env.get('PHONEPE_SALT_INDEX') || '1';

  if (!merchantId || !saltKey) {
    throw new Error('PhonePe credentials not configured');
  }

  // PhonePe API endpoint (use UAT for testing, PROD for live)
  const isProduction = Deno.env.get('PHONEPE_ENVIRONMENT') === 'PRODUCTION';
  const baseUrl = isProduction 
    ? 'https://api.phonepe.com/apis/hermes' 
    : 'https://api-preprod.phonepe.com/apis/pg-sandbox';

  const payload = {
    merchantId,
    merchantTransactionId: orderData.orderId.slice(0, 35), // Max 35 chars
    merchantUserId: `MUID_${orderData.orderId.slice(0, 30)}`,
    amount: Math.round(orderData.amount * 100), // paise
    redirectUrl: orderData.callbackUrl,
    redirectMode: 'POST',
    callbackUrl: `${Deno.env.get('SUPABASE_URL')}/functions/v1/payment-webhook`,
    mobileNumber: orderData.customerPhone?.replace(/\D/g, '').slice(-10) || '',
    paymentInstrument: {
      type: 'PAY_PAGE',
    },
  };

  const base64Payload = btoa(JSON.stringify(payload));
  const stringToHash = base64Payload + '/pg/v1/pay' + saltKey;
  const sha256Hash = createHash('sha256').update(stringToHash).digest('hex');
  const checksum = sha256Hash + '###' + saltIndex;

  const response = await fetch(`${baseUrl}/pg/v1/pay`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-VERIFY': checksum,
    },
    body: JSON.stringify({ request: base64Payload }),
  });

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.message || 'PhonePe order creation failed');
  }

  return {
    gateway_order_id: payload.merchantTransactionId,
    redirect_url: data.data?.instrumentResponse?.redirectInfo?.url,
    merchant_id: merchantId,
  };
}

// ============================================================================
// PAYTM
// ============================================================================
async function createPaytmOrder(restaurant: any, orderData: any) {
  const merchantId = restaurant.paytm_merchant_id || Deno.env.get('PAYTM_MERCHANT_ID');
  const merchantKey = restaurant.paytm_merchant_key || Deno.env.get('PAYTM_MERCHANT_KEY');

  if (!merchantId || !merchantKey) {
    throw new Error('Paytm credentials not configured');
  }

  // Paytm API endpoint
  const isProduction = Deno.env.get('PAYTM_ENVIRONMENT') === 'PRODUCTION';
  const baseUrl = isProduction 
    ? 'https://securegw.paytm.in' 
    : 'https://securegw-stage.paytm.in';

  const orderId = `PRAAHIS_${orderData.orderId.slice(0, 30)}`;
  
  // Create transaction token request body
  const txnBody = {
    body: {
      requestType: 'Payment',
      mid: merchantId,
      websiteName: isProduction ? 'DEFAULT' : 'WEBSTAGING',
      orderId: orderId,
      callbackUrl: orderData.callbackUrl,
      txnAmount: {
        value: orderData.amount.toFixed(2),
        currency: 'INR',
      },
      userInfo: {
        custId: `CUST_${orderData.orderId.slice(0, 30)}`,
        mobile: orderData.customerPhone?.replace(/\D/g, '').slice(-10) || '',
        email: orderData.customerEmail || '',
        firstName: orderData.customerName?.split(' ')[0] || '',
      },
    },
  };

  // Generate checksum (simplified - in production use Paytm's checksum library)
  const stringToHash = JSON.stringify(txnBody.body) + merchantKey;
  const checksum = createHash('sha256').update(stringToHash).digest('hex');

  const response = await fetch(
    `${baseUrl}/theia/api/v1/initiateTransaction?mid=${merchantId}&orderId=${orderId}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...txnBody,
        head: {
          signature: checksum,
        },
      }),
    }
  );

  const data = await response.json();

  if (data.body?.resultInfo?.resultStatus !== 'S') {
    throw new Error(data.body?.resultInfo?.resultMsg || 'Paytm order creation failed');
  }

  // Construct redirect URL
  const redirectUrl = `${baseUrl}/theia/api/v1/showPaymentPage?mid=${merchantId}&orderId=${orderId}&txnToken=${data.body.txnToken}`;

  return {
    gateway_order_id: orderId,
    txn_token: data.body.txnToken,
    redirect_url: redirectUrl,
    merchant_id: merchantId,
  };
}

// ============================================================================
// MAIN HANDLER
// ============================================================================
serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const {
      provider,
      restaurantId,
      orderId,
      orderNumber,
      amount,
      currency = 'INR',
      customerName,
      customerEmail,
      customerPhone,
      callbackUrl,
    } = await req.json();

    // Validate required fields
    if (!restaurantId || !orderId || !amount) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: restaurantId, orderId, amount' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = getSupabase();

    // Fetch restaurant payment configuration
    const { data: restaurant, error: dbError } = await supabase
      .from('restaurants')
      .select(`
        id, name, is_active, payment_gateway_enabled, payment_provider,
        payment_settings, razorpay_key_id, razorpay_key_secret,
        phonepe_merchant_id, phonepe_salt_key, phonepe_salt_index,
        paytm_merchant_id, paytm_merchant_key
      `)
      .eq('id', restaurantId)
      .single();

    if (dbError || !restaurant) {
      return new Response(
        JSON.stringify({ error: 'Restaurant not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!restaurant.is_active) {
      return new Response(
        JSON.stringify({ error: 'Restaurant is inactive' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Determine which provider to use
    const activeProvider = provider || restaurant.payment_provider || 'razorpay';
    
    const orderData = {
      restaurantId,
      orderId,
      orderNumber,
      amount,
      currency,
      customerName,
      customerEmail,
      customerPhone,
      callbackUrl,
    };

    let result;
    
    switch (activeProvider) {
      case 'razorpay':
        result = await createRazorpayOrder(restaurant, orderData);
        break;
      case 'phonepe':
        result = await createPhonePeOrder(restaurant, orderData);
        break;
      case 'paytm':
        result = await createPaytmOrder(restaurant, orderData);
        break;
      default:
        return new Response(
          JSON.stringify({ error: `Unknown payment provider: ${activeProvider}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    // Log the payment order creation
    await supabase.from('order_payments').insert({
      order_id: orderId,
      restaurant_id: restaurantId,
      gateway_provider: activeProvider,
      gateway_order_id: result.gateway_order_id,
      amount: amount,
      currency: currency,
      status: 'created',
    });

    return new Response(
      JSON.stringify({
        success: true,
        provider: activeProvider,
        ...result,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Payment order creation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
