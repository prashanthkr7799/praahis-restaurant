#!/bin/bash

# ============================================================================
# Supabase Migration Runner - Execute All 19 Canonical Migrations
# ============================================================================
# Project: Praahis Restaurant Management
# New Project ID: hpcwpkjbmcelptwwxicn
# Date: November 22, 2025 (Updated)
# ============================================================================

set -e  # Exit on any error

echo "🚀 Starting Supabase Migration Process (19 migrations)..."
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
    "17_split_payment_support.sql"
    "18_cash_reconciliations.sql"
    "19_fix_complaints_issue_types.sql"
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
    
    # Execute migration and capture output
    OUTPUT=$(psql "$DIRECT_URL" -f "$MIGRATION_DIR/$FILE" 2>&1)
    EXIT_CODE=$?
    
    # Check exit code - 0 means success
    if [ $EXIT_CODE -eq 0 ]; then
        # Check if there were NOTICE messages
        if echo "$OUTPUT" | grep -q "NOTICE:"; then
            echo "   ✅ Success (objects already exist - idempotent)"
        else
            echo "   ✅ Success"
        fi
    else
        # Non-zero exit code means actual error
        echo "   ❌ FAILED!"
        echo ""
        echo "Error output:"
        echo "$OUTPUT"
        echo ""
        echo "Migration failed at file: $FILE"
        echo "Please check the error above and fix before continuing."
        exit 1
    fi
    
    echo ""
done

echo "============================================"
echo "✅ All $TOTAL migrations completed successfully!"
echo "============================================"
echo ""
echo "Migrations applied:"
echo "  01-16: Core schema and features"
echo "  17: Split payment support"
echo "  18: Cash reconciliations table"
echo "  19: Complaints issue_types array fix"
echo ""
echo "Next steps:"
echo "1. Create storage buckets (menu-images, restaurant-logos)"
echo "2. Set up storage policies"
echo "3. Verify all tables exist"
echo "4. Test frontend connection"
echo ""
echo "Dashboard: https://supabase.com/dashboard/project/hpcwpkjbmcelptwwxicn"
echo ""
