#!/bin/bash

# 🎯 Task 10: Payment Integration - Quick Test Script

echo ""
echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║                                                                  ║"
echo "║       💳 TASK 10: PAYMENT INTEGRATION TESTING                   ║"
echo "║                                                                  ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}[Step 1]${NC} Checking Payment Implementation Mode..."
echo ""

# Check which payment mode is active
if grep -q "FOR DEMO/TESTING: Simulate payment" src/pages/customer/PaymentPage.jsx; then
  echo -e "${YELLOW}⚠️  TEST MODE ACTIVE${NC}"
  echo "   - Simulated payment (no real Razorpay)"
  echo "   - 2-second delay"
  echo "   - Good for basic flow testing"
  echo ""
  
  if grep -q "UNCOMMENT THIS FOR REAL RAZORPAY" src/pages/customer/PaymentPage.jsx; then
    echo -e "${GREEN}✅ Production code available (currently commented)${NC}"
  fi
else
  echo -e "${GREEN}✅ PRODUCTION MODE ACTIVE${NC}"
  echo "   - Real Razorpay integration"
  echo "   - Uses restaurant-specific keys"
fi
echo ""

echo -e "${BLUE}[Step 2]${NC} Checking Required Files..."
echo ""

declare -a FILES=(
  "src/pages/customer/PaymentPage.jsx"
  "src/domains/billing/utils/razorpayHelper.js"
  "src/pages/manager/PaymentSettingsPage.jsx"
  "database/52_add_order_payments_table.sql"
  "database/50_razorpay_per_restaurant.sql"
)

PASS=0
FAIL=0

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo -e "${GREEN}✅${NC} $file"
    ((PASS++))
  else
    echo -e "${RED}❌${NC} $file - NOT FOUND"
    ((FAIL++))
  fi
done
echo ""

echo -e "${BLUE}[Step 3]${NC} Checking Environment..."
echo ""

if [ -f ".env" ] || [ -f ".env.local" ]; then
  echo -e "${GREEN}✅ Environment file found${NC}"
  
  if grep -q "VITE_RAZORPAY_KEY_ID" .env 2>/dev/null || grep -q "VITE_RAZORPAY_KEY_ID" .env.local 2>/dev/null; then
    echo -e "${GREEN}✅ Platform fallback key configured${NC}"
  else
    echo -e "${YELLOW}⚠️  No VITE_RAZORPAY_KEY_ID found (optional)${NC}"
    echo "   Will use restaurant-specific keys only"
  fi
else
  echo -e "${RED}❌ No .env file${NC}"
fi
echo ""

echo -e "${BLUE}[Step 4]${NC} Database Checks..."
echo ""
echo -e "${YELLOW}Run these SQL queries in Supabase:${NC}"
echo ""
echo -e "${GREEN}-- Check order_payments table exists${NC}"
echo "SELECT count(*) FROM order_payments;"
echo ""
echo -e "${GREEN}-- Check restaurant payment config${NC}"
echo "SELECT id, name, payment_gateway_enabled, razorpay_key_id"
echo "FROM restaurants LIMIT 3;"
echo ""
echo -e "${GREEN}-- Check recent payments${NC}"
echo "SELECT * FROM order_payments ORDER BY created_at DESC LIMIT 5;"
echo ""

read -p "Press Enter after checking database..."
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}📋 TESTING CHECKLIST${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🎯 ${YELLOW}SCENARIO 1: Test Mode Payment${NC}"
echo "   1. Complete order flow from Task 9"
echo "   2. On payment page, click 'Pay Now'"
echo "   3. Wait 2 seconds (simulated payment)"
echo "   4. Verify redirect to order status"
echo "   5. Check database for payment record"
echo ""
echo "🎯 ${YELLOW}SCENARIO 2: Payment Page Display${NC}"
echo "   1. Verify order summary shows correct items"
echo "   2. Check subtotal, tax, total calculations"
echo "   3. Verify restaurant name displays"
echo "   4. Verify table number shows"
echo ""
echo "🎯 ${YELLOW}SCENARIO 3: Database Records${NC}"
echo "   Run SQL: SELECT * FROM order_payments ORDER BY created_at DESC LIMIT 1;"
echo "   □ Payment record created"
echo "   □ Amount matches order total"
echo "   □ Status is 'captured'"
echo "   □ restaurant_id is NOT NULL"
echo ""
echo "🎯 ${YELLOW}SCENARIO 4: Order Status Update${NC}"
echo "   Run SQL: SELECT payment_status, order_status FROM orders"
echo "            WHERE id = 'your-order-id';"
echo "   □ payment_status = 'paid'"
echo "   □ order_status = 'received'"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${BLUE}📚 Full Guide:${NC} TASK_10_PAYMENT_TESTING.md"
echo ""
echo -e "${GREEN}Quick tip: Start with Scenario 1 (Test Mode) to verify basic flow!${NC}"
echo ""

if [ $FAIL -eq 0 ]; then
  echo -e "${GREEN}🎉 All files present! Ready to test payments!${NC}"
  exit 0
else
  echo -e "${RED}⚠️  Some files missing. Check above.${NC}"
  exit 1
fi
