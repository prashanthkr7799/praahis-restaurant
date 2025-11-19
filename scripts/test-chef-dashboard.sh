#!/bin/bash

# ═══════════════════════════════════════════════════════════════════
# Task 12: Chef Dashboard Testing - Automated Verification
# ═══════════════════════════════════════════════════════════════════

echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║   TASK 12: CHEF DASHBOARD - AUTOMATED CHECKER            ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
total_checks=0
passed_checks=0
failed_checks=0

# Function to check if file exists
check_file() {
    total_checks=$((total_checks + 1))
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} Found: $1"
        passed_checks=$((passed_checks + 1))
        return 0
    else
        echo -e "${RED}✗${NC} Missing: $1"
        failed_checks=$((failed_checks + 1))
        return 1
    fi
}

# Function to check for pattern in file
check_pattern() {
    local file=$1
    local pattern=$2
    local description=$3
    
    total_checks=$((total_checks + 1))
    
    if [ ! -f "$file" ]; then
        echo -e "${RED}✗${NC} File not found: $file"
        failed_checks=$((failed_checks + 1))
        return 1
    fi
    
    if grep -q "$pattern" "$file"; then
        echo -e "${GREEN}✓${NC} $description"
        passed_checks=$((passed_checks + 1))
        return 0
    else
        echo -e "${RED}✗${NC} Missing: $description"
        failed_checks=$((failed_checks + 1))
        return 1
    fi
}

echo "════════════════════════════════════════════════════════════"
echo "1. Checking Chef Dashboard Files"
echo "════════════════════════════════════════════════════════════"
echo ""

# Check key files
check_file "src/pages/chef/ChefDashboard.jsx"
check_file "src/pages/chef/ChefLogin.jsx"
check_file "src/domains/ordering/components/OrderCard.jsx"
check_file "src/shared/utils/api/supabaseClient.js"

echo ""
echo "════════════════════════════════════════════════════════════"
echo "2. Verifying Core Functionality"
echo "════════════════════════════════════════════════════════════"
echo ""

# Check for key features
check_pattern "src/pages/chef/ChefDashboard.jsx" "updateOrderItemStatus" \
    "ChefDashboard uses updateOrderItemStatus()"

check_pattern "src/pages/chef/ChefDashboard.jsx" "subscribeToOrders" \
    "ChefDashboard subscribes to real-time orders"

check_pattern "src/pages/chef/ChefDashboard.jsx" "setActiveFilter" \
    "ChefDashboard has filtering functionality"

check_pattern "src/pages/chef/ChefDashboard.jsx" "searchText" \
    "ChefDashboard has search functionality"

echo ""
echo "════════════════════════════════════════════════════════════"
echo "3. Checking Item-Level Status Updates"
echo "════════════════════════════════════════════════════════════"
echo ""

# Check OrderCard component
check_pattern "src/domains/ordering/components/OrderCard.jsx" "onUpdateItemStatus" \
    "OrderCard supports item status updates"

check_pattern "src/domains/ordering/components/OrderCard.jsx" "getNextItemStatus" \
    "OrderCard has status progression logic"

check_pattern "src/domains/ordering/components/OrderCard.jsx" "itemStatusBadge" \
    "OrderCard displays item status badges"

echo ""
echo "════════════════════════════════════════════════════════════"
echo "4. Checking Stats and Filtering"
echo "════════════════════════════════════════════════════════════"
echo ""

# Check for stats cards
check_pattern "src/pages/chef/ChefDashboard.jsx" "filter.*received" \
    "Dashboard has 'Received' stat card"

check_pattern "src/pages/chef/ChefDashboard.jsx" "filter.*preparing" \
    "Dashboard has 'Preparing' stat card"

check_pattern "src/pages/chef/ChefDashboard.jsx" "filter.*ready" \
    "Dashboard has 'Ready' stat card"

# Check for payment filter
check_pattern "src/pages/chef/ChefDashboard.jsx" "paymentFilter" \
    "Dashboard has payment status filter"

echo ""
echo "════════════════════════════════════════════════════════════"
echo "5. Checking Authentication"
echo "════════════════════════════════════════════════════════════"
echo ""

check_pattern "src/pages/chef/ChefDashboard.jsx" "isChefAuthenticated" \
    "Dashboard checks chef authentication"

check_pattern "src/pages/chef/ChefDashboard.jsx" "clearChefAuth" \
    "Dashboard has logout functionality"

check_pattern "src/pages/chef/ChefDashboard.jsx" "navigate.*chef/login" \
    "Dashboard redirects to login if not authenticated"

echo ""
echo "════════════════════════════════════════════════════════════"
echo "6. Checking Notification System"
echo "════════════════════════════════════════════════════════════"
echo ""

check_pattern "src/pages/chef/ChefDashboard.jsx" "notificationService" \
    "Dashboard uses notification service"

check_pattern "src/pages/chef/ChefDashboard.jsx" "notifyNewOrder" \
    "Dashboard notifies on new orders"

check_pattern "src/pages/chef/ChefDashboard.jsx" "toast" \
    "Dashboard shows toast notifications"

echo ""
echo "════════════════════════════════════════════════════════════"
echo "7. Checking Restaurant Isolation"
echo "════════════════════════════════════════════════════════════"
echo ""

check_pattern "src/pages/chef/ChefDashboard.jsx" "restaurant.id" \
    "Dashboard filters by restaurant ID"

check_pattern "src/pages/chef/ChefDashboard.jsx" "getRestaurant" \
    "Dashboard fetches restaurant data"

echo ""
echo "════════════════════════════════════════════════════════════"
echo "8. Checking UI Features"
echo "════════════════════════════════════════════════════════════"
echo ""

check_pattern "src/pages/chef/ChefDashboard.jsx" "compact" \
    "Dashboard has compact mode"

check_pattern "src/pages/chef/ChefDashboard.jsx" "RefreshCw" \
    "Dashboard has manual refresh button"

check_pattern "src/pages/chef/ChefDashboard.jsx" "LoadingSpinner" \
    "Dashboard shows loading state"

check_pattern "src/pages/chef/ChefDashboard.jsx" "ErrorMessage" \
    "Dashboard handles error states"

echo ""
echo "════════════════════════════════════════════════════════════"
echo "9. Checking Subscription Cleanup"
echo "════════════════════════════════════════════════════════════"
echo ""

# Check for proper cleanup
if grep -A 10 "useEffect" "src/pages/chef/ChefDashboard.jsx" | grep -q "return () =>"; then
    echo -e "${GREEN}✓${NC} ChefDashboard has cleanup in useEffect"
    passed_checks=$((passed_checks + 1))
    total_checks=$((total_checks + 1))
else
    echo -e "${YELLOW}⚠${NC} ChefDashboard cleanup not found"
    total_checks=$((total_checks + 1))
fi

if grep -A 5 "return () =>" "src/pages/chef/ChefDashboard.jsx" | grep -q "clearInterval"; then
    echo -e "${GREEN}✓${NC} Polling interval cleared in cleanup"
    passed_checks=$((passed_checks + 1))
    total_checks=$((total_checks + 1))
else
    echo -e "${YELLOW}⚠${NC} Polling interval cleanup not found"
    total_checks=$((total_checks + 1))
fi

echo ""
echo "════════════════════════════════════════════════════════════"
echo "10. Checking Order Cancellation"
echo "════════════════════════════════════════════════════════════"
echo ""

check_pattern "src/pages/chef/ChefDashboard.jsx" "handleCancelOrder" \
    "Dashboard has order cancellation function"

check_pattern "src/pages/chef/ChefDashboard.jsx" "payment_status.*paid" \
    "Dashboard checks payment status before cancel"

echo ""
echo "════════════════════════════════════════════════════════════"
echo "SUMMARY"
echo "════════════════════════════════════════════════════════════"
echo ""

percentage=$(( passed_checks * 100 / total_checks ))

echo -e "Total Checks:  ${BLUE}$total_checks${NC}"
echo -e "Passed:        ${GREEN}$passed_checks${NC}"
echo -e "Failed:        ${RED}$failed_checks${NC}"
echo -e "Pass Rate:     ${BLUE}${percentage}%${NC}"
echo ""

if [ $failed_checks -eq 0 ]; then
    echo -e "${GREEN}╔═══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║  ✅ ALL AUTOMATED CHECKS PASSED!                         ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${BLUE}ℹ${NC} Implementation looks good! Now proceed with manual testing:"
    echo ""
    echo "   1. Login as chef (chef@test.com)"
    echo "   2. Verify dashboard loads with orders"
    echo "   3. Test item-level status updates (Received → Preparing → Ready)"
    echo "   4. Test filtering (Active, All, Ready)"
    echo "   5. Test search by order/table number"
    echo "   6. Verify real-time updates (use 2 windows)"
    echo "   7. Test restaurant isolation (chef sees only their orders)"
    echo ""
    echo "   📖 Full guide: TASK_12_CHEF_DASHBOARD_TESTING.md"
elif [ $percentage -ge 80 ]; then
    echo -e "${YELLOW}╔═══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${YELLOW}║  ⚠️  MOSTLY PASSING - REVIEW WARNINGS                    ║${NC}"
    echo -e "${YELLOW}╚═══════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "Review the warnings above before proceeding with manual tests."
else
    echo -e "${RED}╔═══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║  ❌ IMPLEMENTATION ISSUES DETECTED                       ║${NC}"
    echo -e "${RED}╚═══════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "Fix the failed checks above before proceeding."
    exit 1
fi

echo ""
echo "════════════════════════════════════════════════════════════"
echo "NEXT: Manual Testing Required"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "Automated checks verify code structure only."
echo "You MUST test chef dashboard functionality manually:"
echo ""
echo "  ⭐ Quick Test (10 minutes):"
echo "     1. Login as chef"
echo "     2. Find order with 'Received' items"
echo "     3. Click 'Start' → Verify 'Preparing'"
echo "     4. Click 'Mark Ready' → Verify 'Ready'"
echo "     5. Check stats cards update"
echo "     6. Test one filter (e.g., 'Ready for Service')"
echo ""
echo "  🎯 Critical Tests:"
echo "     - Item-level status updates (MOST IMPORTANT)"
echo "     - Real-time synchronization (2 windows)"
echo "     - Restaurant isolation (security)"
echo ""
echo "  📊 SQL to check chef's restaurant:"
echo "     SELECT email, role, restaurant_id, r.name"
echo "     FROM users u"
echo "     JOIN restaurants r ON u.restaurant_id = r.id"
echo "     WHERE u.email = 'chef@test.com';"
echo ""
echo "  📖 Full testing guide: TASK_12_CHEF_DASHBOARD_TESTING.md"
echo ""
