#!/bin/bash
# Deploy Payment Edge Functions to Supabase
# This script helps deploy the create-payment-order Edge Function (supports Razorpay, PhonePe, Paytm)

echo "🚀 Deploying Payment Edge Functions to Supabase"
echo "================================================"
echo ""

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found!"
    echo "Install it with: brew install supabase/tap/supabase"
    exit 1
fi

echo "✅ Supabase CLI found"
echo ""

# Check if logged in
echo "🔐 Checking Supabase authentication..."
if ! supabase projects list &> /dev/null; then
    echo "❌ Not logged in to Supabase"
    echo ""
    echo "Please login first with:"
    echo "  supabase login"
    echo ""
    exit 1
fi

echo "✅ Authenticated"
echo ""

# Set project reference
PROJECT_REF="hpcwpkjbmcelptwwxicn"

echo "📦 Deploying create-payment-order function (unified multi-gateway)..."
echo ""

# Deploy the function
if supabase functions deploy create-payment-order --project-ref $PROJECT_REF --no-verify-jwt; then
    echo ""
    echo "✅ Edge Function deployed successfully!"
    echo ""
    echo "⚙️  IMPORTANT: Set environment variables in Supabase Dashboard:"
    echo "   https://supabase.com/dashboard/project/$PROJECT_REF/settings/functions"
    echo ""
    echo "   Required variables for each gateway:"
    echo ""
    echo "   RAZORPAY:"
    echo "   - RAZORPAY_KEY_ID"
    echo "   - RAZORPAY_KEY_SECRET"
    echo ""
    echo "   PHONEPE (optional):"
    echo "   - PHONEPE_MERCHANT_ID"
    echo "   - PHONEPE_SALT_KEY"
    echo "   - PHONEPE_SALT_INDEX"
    echo "   - PHONEPE_ENVIRONMENT (sandbox/production)"
    echo ""
    echo "   PAYTM (optional):"
    echo "   - PAYTM_MERCHANT_ID"
    echo "   - PAYTM_MERCHANT_KEY"
    echo "   - PAYTM_ENVIRONMENT (staging/production)"
    echo ""
else
    echo ""
    echo "❌ Deployment failed!"
    echo ""
    echo "Try these steps:"
    echo "1. Login: supabase login"
    echo "2. Link project: supabase link --project-ref $PROJECT_REF"
    echo "3. Deploy: supabase functions deploy create-payment-order --no-verify-jwt"
    exit 1
fi
