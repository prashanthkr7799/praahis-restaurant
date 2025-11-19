#!/bin/bash
# Deploy Razorpay Edge Function to Supabase
# This script helps deploy the create-razorpay-order Edge Function

echo "🚀 Deploying Razorpay Edge Function to Supabase"
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

echo "📦 Deploying create-razorpay-order function..."
echo ""

# Deploy the function
if supabase functions deploy create-razorpay-order --project-ref $PROJECT_REF; then
    echo ""
    echo "✅ Edge Function deployed successfully!"
    echo ""
    echo "⚙️  IMPORTANT: Set environment variables in Supabase Dashboard:"
    echo "   https://supabase.com/dashboard/project/$PROJECT_REF/settings/functions"
    echo ""
    echo "   Required variables:"
    echo "   - RAZORPAY_KEY_ID=rzp_test_RQzRCNUa5BpCt6"
    echo "   - RAZORPAY_KEY_SECRET=OnuEiPkNtBgRqfF5E5qBSsaC"
    echo ""
    echo "   (These are your test keys - already in .env.local)"
    echo ""
else
    echo ""
    echo "❌ Deployment failed!"
    echo ""
    echo "Try these steps:"
    echo "1. Login: supabase login"
    echo "2. Link project: supabase link --project-ref $PROJECT_REF"
    echo "3. Deploy: supabase functions deploy create-razorpay-order"
    exit 1
fi
