#!/bin/bash

# ============================================================================
# UNIFIED LOGIN SYSTEM - VALIDATION SCRIPT
# ============================================================================
# This script validates the unified login system implementation
# Run this after deploying the database migrations
# ============================================================================

set -e  # Exit on error

echo "🔐 Praahis Unified Login System - Validation Script"
echo "=================================================="
echo ""

# Check if we're in the correct directory
if [ ! -f "database/70_unified_login_rls.sql" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Database connection details (modify as needed)
DB_NAME="${DB_NAME:-praahis}"
DB_USER="${DB_USER:-postgres}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"

echo "📊 Database: $DB_NAME"
echo "👤 User: $DB_USER"
echo "🌐 Host: $DB_HOST:$DB_PORT"
echo ""

# Function to run SQL query
run_query() {
    local query="$1"
    local description="$2"
    
    echo "⏳ $description..."
    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -A -c "$query" 2>&1
    
    if [ $? -eq 0 ]; then
        echo "✅ $description - PASSED"
    else
        echo "❌ $description - FAILED"
        return 1
    fi
    echo ""
}

# ============================================================================
# TEST 1: Check if helper functions exist
# ============================================================================
echo "🧪 TEST 1: Validating Helper Functions"
echo "--------------------------------------"

run_query "
SELECT COUNT(*) 
FROM pg_proc 
WHERE proname IN (
    'get_user_restaurant_id',
    'is_superadmin',
    'get_user_role',
    'validate_restaurant_access'
) AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'auth');
" "Checking if 4 helper functions exist"

# ============================================================================
# TEST 2: Check if RLS is enabled on critical tables
# ============================================================================
echo "🧪 TEST 2: Validating Row Level Security"
echo "--------------------------------------"

run_query "
SELECT 
    COUNT(*) as rls_enabled_count
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('orders', 'tables', 'menu_items', 'users', 'payments', 'feedbacks')
AND rowsecurity = true;
" "Checking RLS enabled on critical tables"

# ============================================================================
# TEST 3: Check if policies are created
# ============================================================================
echo "🧪 TEST 3: Validating RLS Policies"
echo "--------------------------------------"

run_query "
SELECT COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('orders', 'tables', 'menu_items', 'users', 'payments', 'feedbacks');
" "Checking if RLS policies exist"

# ============================================================================
# TEST 4: Check if audit log tables exist
# ============================================================================
echo "🧪 TEST 4: Validating Audit Log Tables"
echo "--------------------------------------"

run_query "
SELECT COUNT(*) 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('auth_activity_logs', 'system_logs');
" "Checking if audit log tables exist"

# ============================================================================
# TEST 5: Check if monitoring views exist
# ============================================================================
echo "🧪 TEST 5: Validating Monitoring Views"
echo "--------------------------------------"

run_query "
SELECT COUNT(*) 
FROM information_schema.views 
WHERE table_schema = 'public' 
AND table_name IN ('recent_failed_logins', 'cross_restaurant_violations', 'auth_activity_summary');
" "Checking if monitoring views exist"

# ============================================================================
# TEST 6: Check if indexes are created
# ============================================================================
echo "🧪 TEST 6: Validating Performance Indexes"
echo "--------------------------------------"

run_query "
SELECT COUNT(*) 
FROM pg_indexes 
WHERE schemaname = 'public' 
AND indexname IN (
    'idx_users_restaurant_id',
    'idx_users_role',
    'idx_auth_logs_user_id',
    'idx_auth_logs_action',
    'idx_system_logs_level'
);
" "Checking if performance indexes exist"

# ============================================================================
# TEST 7: Run built-in validation function
# ============================================================================
echo "🧪 TEST 7: Running Built-in Validation"
echo "--------------------------------------"

run_query "SELECT * FROM test_rls_isolation();" "Running test_rls_isolation() function"

# ============================================================================
# SUMMARY
# ============================================================================
echo ""
echo "=================================================="
echo "✅ All validation tests completed!"
echo "=================================================="
echo ""
echo "📝 Next Steps:"
echo "1. Review any failed tests above"
echo "2. Test login flows manually:"
echo "   - /login (staff portal)"
echo "   - /superadmin/login (admin portal)"
echo "3. Monitor auth_activity_logs for login events"
echo "4. Check cross_restaurant_violations for security issues"
echo ""
echo "📚 Documentation: docs/UNIFIED_LOGIN_GUIDE.md"
echo ""
