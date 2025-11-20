#!/bin/bash

# ============================================================================
# Supabase Migration Runner - Execute All 17 Canonical Migrations
# ============================================================================
# Project: Praahis Restaurant Management
# New Project ID: hpcwpkjbmcelptwwxicn
# Date: November 18, 2025
# ============================================================================

set -e  # Exit on any error

echo "🚀 Starting Supabase Migration Process (17 migrations)..."
echo "Project: hpcwpkjbmcelptwwxicn (Singapore)"
echo "============================================"
echo ""

# Check if DIRECT_URL is set
if [ -z "$DIRECT_URL" ]; then
    echo "⚠️  DIRECT_URL not found in environment"
    echo "Please set it manually:"
    echo ""
    echo "export DIRECT_URL='postgresql://postgres:UW0KIG7foUzDvTHY@db.hpcwpkjbmcelptwwxicn.supabase.co:5432/postgres'"
    echo ""
    echo "Or run migrations manually via Supabase Dashboard SQL Editor:"
    echo "https://supabase.com/dashboard/project/hpcwpkjbmcelptwwxicn/sql/new"
    echo ""
    exit 1
fi

# Migration files in order (canonical sequence)
MIGRATIONS=(
    "01_core_schema.sql"
    "02_billing_subscription_v80.sql"
    "03_billing_price_per_table_extension.sql"
    "04_billing_cron_jobs.sql"
    "05_platform_admin_and_roles.sql"
    "06_audit_logging_system.sql"
    "07_maintenance_and_backup_system.sql"
    "08_table_sessions_and_auth.sql"
    "09_notifications.sql"
    "10_ratings_and_views.sql"
    "11_rls_functions.sql"
    "12_rls_policies.sql"
    "13_indexes.sql"
    "14_seed_initial_data.sql"
    "15_compatibility_views.sql"
    "16_auto_enable_payments.sql"
    "17_feedbacks_add_restaurant_id.sql"
)

MIGRATION_DIR="phase3_migrations"

# Run each migration
TOTAL=${#MIGRATIONS[@]}
for i in "${!MIGRATIONS[@]}"; do
    FILE="${MIGRATIONS[$i]}"
    NUM=$((i + 1))
    
    echo "📄 [$NUM/$TOTAL] Running: $FILE"
    
    if [ ! -f "$MIGRATION_DIR/$FILE" ]; then
        echo "❌ ERROR: Migration file not found: $MIGRATION_DIR/$FILE"
        exit 1
    fi
    
    # Execute migration
    if psql "$DIRECT_URL" -f "$MIGRATION_DIR/$FILE" > /dev/null 2>&1; then
        echo "   ✅ Success"
    else
        echo "   ❌ FAILED!"
        echo ""
        echo "Migration failed at file: $FILE"
        echo "Please check the error above and fix before continuing."
        echo ""
        echo "To resume, run migrations manually starting from:"
        echo "https://supabase.com/dashboard/project/hpcwpkjbmcelptwwxicn/sql/new"
        exit 1
    fi
    
    echo ""
done

echo "============================================"
echo "✅ All $TOTAL migrations completed successfully!"
echo "============================================"
echo ""
echo "Next steps:"
echo "1. Create storage buckets (menu-images, restaurant-logos)"
echo "2. Set up storage policies"
echo "3. Verify all tables exist"
echo "4. Test frontend connection"
echo ""
echo "Dashboard: https://supabase.com/dashboard/project/hpcwpkjbmcelptwwxicn"
echo ""
