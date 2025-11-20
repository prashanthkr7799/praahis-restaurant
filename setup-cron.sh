#!/bin/bash
# Setup script for table session cleanup cron job

set -e

echo "🔧 Table Session Cleanup - Cron Setup"
echo "======================================"
echo ""

# Get project info from .env
if [ -f .env ]; then
  export $(cat .env | grep VITE_SUPABASE_URL | xargs)
  export $(cat .env | grep VITE_SUPABASE_ANON_KEY | xargs)
fi

# Extract project ref from URL
PROJECT_REF=$(echo $VITE_SUPABASE_URL | sed 's/https:\/\///' | sed 's/.supabase.co//')

echo "📋 Your Configuration:"
echo "  Project Ref: $PROJECT_REF"
echo "  Supabase URL: $VITE_SUPABASE_URL"
echo ""

echo "🎯 Option 1: Supabase pg_cron (Recommended)"
echo "============================================"
echo "Run this in Supabase SQL Editor:"
echo ""
cat << 'EOF'
CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
  'cleanup-inactive-sessions',
  '*/2 * * * *',
  $$SELECT net.http_post(
    url := 'https://PROJECT_REF.supabase.co/functions/v1/cleanup-inactive-sessions',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
      'Content-Type', 'application/json'
    )
  );$$
);
EOF

echo ""
echo "Replace PROJECT_REF with: $PROJECT_REF"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "🌐 Option 2: External Cron (cron-job.org)"
echo "=========================================="
echo "1. Sign up at: https://cron-job.org"
echo "2. Create new cron job with:"
echo "   URL: https://${PROJECT_REF}.supabase.co/functions/v1/cleanup-inactive-sessions"
echo "   Method: POST"
echo "   Schedule: */2 * * * * (every 2 minutes)"
echo "   Header: Authorization: Bearer $VITE_SUPABASE_ANON_KEY"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "🧪 Test the function:"
echo "===================="
echo "curl -X POST \\"
echo "  -H 'Authorization: Bearer $VITE_SUPABASE_ANON_KEY' \\"
echo "  'https://${PROJECT_REF}.supabase.co/functions/v1/cleanup-inactive-sessions'"
echo ""

echo "✅ Done! Choose one option above and set it up."
