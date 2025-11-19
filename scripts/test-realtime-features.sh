#!/bin/bash

# ═══════════════════════════════════════════════════════════════════
# Task 11: Real-Time Features Testing - Automated Verification
# ═══════════════════════════════════════════════════════════════════

echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║   TASK 11: REAL-TIME FEATURES - AUTOMATED CHECKER        ║"
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
echo "1. Checking Real-Time Implementation Files"
echo "════════════════════════════════════════════════════════════"
echo ""

# Check key files
check_file "src/pages/customer/OrderStatusPage.jsx"
check_file "src/pages/chef/ChefDashboard.jsx"
check_file "src/pages/waiter/WaiterDashboard.jsx"
check_file "src/shared/utils/api/supabaseClient.js"
check_file "database/03_enable_realtime.sql"

echo ""
echo "════════════════════════════════════════════════════════════"
echo "2. Verifying Subscription Implementation"
echo "════════════════════════════════════════════════════════════"
echo ""

# Check for subscribeToOrder in OrderStatusPage
check_pattern "src/pages/customer/OrderStatusPage.jsx" "subscribeToOrder" \
    "OrderStatusPage uses subscribeToOrder()"

# Check for subscribeToOrders in ChefDashboard
check_pattern "src/pages/chef/ChefDashboard.jsx" "subscribeToOrders" \
    "ChefDashboard uses subscribeToOrders()"

# Check for subscription cleanup
check_pattern "src/pages/customer/OrderStatusPage.jsx" "unsubscribe" \
    "OrderStatusPage has cleanup (unsubscribe)"

echo ""
echo "════════════════════════════════════════════════════════════"
echo "3. Checking Fallback Polling"
echo "════════════════════════════════════════════════════════════"
echo ""

# Check for polling intervals
check_pattern "src/pages/customer/OrderStatusPage.jsx" "setInterval" \
    "OrderStatusPage has polling fallback (setInterval)"

check_pattern "src/pages/customer/OrderStatusPage.jsx" "clearInterval" \
    "OrderStatusPage clears polling (clearInterval)"

echo ""
echo "════════════════════════════════════════════════════════════"
echo "4. Checking Notification System"
echo "════════════════════════════════════════════════════════════"
echo ""

# Check for toast notifications
check_pattern "src/pages/customer/OrderStatusPage.jsx" "toast" \
    "OrderStatusPage shows toast notifications"

# Check for notification service
if [ -f "src/shared/utils/notificationService.js" ]; then
    echo -e "${GREEN}✓${NC} Notification service exists"
    passed_checks=$((passed_checks + 1))
    total_checks=$((total_checks + 1))
    
    check_pattern "src/shared/utils/notificationService.js" "playSound" \
        "Notification service has sound support"
else
    echo -e "${YELLOW}⚠${NC} Notification service not found (optional)"
fi

echo ""
echo "════════════════════════════════════════════════════════════"
echo "5. Analyzing Subscription Pattern"
echo "════════════════════════════════════════════════════════════"
echo ""

if [ -f "src/pages/customer/OrderStatusPage.jsx" ]; then
    # Count useEffect hooks (should have cleanup)
    useeffect_count=$(grep -c "useEffect" "src/pages/customer/OrderStatusPage.jsx" || echo "0")
    echo -e "${BLUE}ℹ${NC} Found $useeffect_count useEffect hooks in OrderStatusPage"
    
    # Check for proper cleanup pattern
    if grep -q "return () => {" "src/pages/customer/OrderStatusPage.jsx"; then
        echo -e "${GREEN}✓${NC} Cleanup function pattern found"
        passed_checks=$((passed_checks + 1))
        total_checks=$((total_checks + 1))
    else
        echo -e "${RED}✗${NC} No cleanup function found"
        failed_checks=$((failed_checks + 1))
        total_checks=$((total_checks + 1))
    fi
fi

echo ""
echo "════════════════════════════════════════════════════════════"
echo "6. Database Realtime Configuration"
echo "════════════════════════════════════════════════════════════"
echo ""

if [ -f "database/03_enable_realtime.sql" ]; then
    echo -e "${BLUE}ℹ${NC} Checking Realtime enable script..."
    
    check_pattern "database/03_enable_realtime.sql" "ALTER PUBLICATION supabase_realtime" \
        "Script enables Realtime publication"
    
    check_pattern "database/03_enable_realtime.sql" "ADD TABLE orders" \
        "Orders table added to Realtime"
    
    check_pattern "database/03_enable_realtime.sql" "ADD TABLE tables" \
        "Tables table added to Realtime"
else
    echo -e "${RED}✗${NC} Realtime enable script not found"
fi

echo ""
echo "════════════════════════════════════════════════════════════"
echo "7. Memory Leak Prevention Checks"
echo "════════════════════════════════════════════════════════════"
echo ""

# Check for proper cleanup patterns
if [ -f "src/pages/customer/OrderStatusPage.jsx" ]; then
    # Check subscription cleanup
    if grep -A 5 "return () => {" "src/pages/customer/OrderStatusPage.jsx" | grep -q "unsubscribe"; then
        echo -e "${GREEN}✓${NC} Subscription unsubscribe in cleanup"
        passed_checks=$((passed_checks + 1))
        total_checks=$((total_checks + 1))
    else
        echo -e "${YELLOW}⚠${NC} Subscription unsubscribe not found in cleanup"
        total_checks=$((total_checks + 1))
    fi
    
    # Check interval cleanup
    if grep -A 5 "return () => {" "src/pages/customer/OrderStatusPage.jsx" | grep -q "clearInterval"; then
        echo -e "${GREEN}✓${NC} Polling interval cleared in cleanup"
        passed_checks=$((passed_checks + 1))
        total_checks=$((total_checks + 1))
    else
        echo -e "${YELLOW}⚠${NC} Polling interval not cleared in cleanup"
        total_checks=$((total_checks + 1))
    fi
fi

echo ""
echo "════════════════════════════════════════════════════════════"
echo "8. Realtime Helper Functions"
echo "════════════════════════════════════════════════════════════"
echo ""

if [ -f "src/shared/utils/api/supabaseClient.js" ]; then
    echo -e "${BLUE}ℹ${NC} Checking supabaseClient helper functions..."
    
    check_pattern "src/shared/utils/api/supabaseClient.js" "subscribeToOrder" \
        "subscribeToOrder() function exists"
    
    check_pattern "src/shared/utils/api/supabaseClient.js" "subscribeToOrders" \
        "subscribeToOrders() function exists"
    
    # Check for proper cleanup in helpers
    if grep -A 10 "subscribeToOrder" "src/shared/utils/api/supabaseClient.js" | grep -q "removeChannel"; then
        echo -e "${GREEN}✓${NC} Helper functions return cleanup function"
        passed_checks=$((passed_checks + 1))
        total_checks=$((total_checks + 1))
    fi
fi

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
    echo "   1. Verify Realtime is enabled in Supabase (see SQL in guide)"
    echo "   2. Run Scenario 1: Basic Real-Time Update (2-window test)"
    echo "   3. Check update speed (should be < 3 seconds)"
    echo "   4. Test subscription cleanup (no memory leaks)"
    echo "   5. Test fallback polling"
    echo ""
    echo "   📖 Full guide: TASK_11_REALTIME_TESTING.md"
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
echo "You MUST test real-time behavior manually:"
echo ""
echo "  ⭐ Run the Quick Test (10 minutes):"
echo "     1. Open 2 browser windows"
echo "     2. Window 1: Place order → order status page"
echo "     3. Window 2: Login as chef → dashboard"
echo "     4. Chef changes order status"
echo "     5. Verify customer sees update < 3 seconds"
echo ""
echo "  📊 SQL to verify Realtime enabled:"
echo "     SELECT * FROM pg_publication_tables"
echo "     WHERE pubname = 'supabase_realtime'"
echo "     AND tablename = 'orders';"
echo ""
echo "  📖 Full testing guide: TASK_11_REALTIME_TESTING.md"
echo ""
