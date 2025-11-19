#!/bin/bash

# 🎯 Task 9: Customer Journey - Quick Verification Script
# This script checks that all necessary files exist and have no errors

echo "🔍 Task 9: Customer Journey Testing - File Verification"
echo "========================================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check counter
PASS=0
FAIL=0

echo "📋 Checking Customer Flow Files..."
echo ""

# Array of files to check
declare -a FILES=(
  "src/pages/customer/TablePage.jsx"
  "src/pages/customer/PaymentPage.jsx"
  "src/pages/customer/OrderStatusPage.jsx"
  "src/pages/customer/PostMealOptions.jsx"
  "src/pages/customer/FeedbackPage.jsx"
  "src/pages/customer/ThankYouPage.jsx"
  "src/domains/ordering/components/MenuItem.jsx"
  "src/domains/ordering/components/CartSummary.jsx"
  "src/domains/ordering/components/CategoryTabs.jsx"
  "src/shared/utils/api/supabaseClient.js"
)

# Check each file exists
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
echo "📋 Checking App.jsx Routes..."
echo ""

# Check critical routes in App.jsx
declare -a ROUTES=(
  "/table/:id"
  "/payment/:orderId"
  "/order-status/:orderId"
  "/post-meal/:sessionId/:tableNumber"
  "/feedback/:sessionId"
  "/thank-you"
)

for route in "${ROUTES[@]}"; do
  if grep -q "$route" src/App.jsx; then
    echo -e "${GREEN}✅${NC} Route: $route"
    ((PASS++))
  else
    echo -e "${RED}❌${NC} Route: $route - NOT FOUND"
    ((FAIL++))
  fi
done

echo ""
echo "📋 Checking Environment Variables..."
echo ""

# Check .env file
if [ -f ".env" ]; then
  echo -e "${GREEN}✅${NC} .env file exists"
  ((PASS++))
  
  # Check for required variables
  if grep -q "VITE_SUPABASE_URL" .env; then
    echo -e "${GREEN}✅${NC} VITE_SUPABASE_URL configured"
    ((PASS++))
  else
    echo -e "${RED}❌${NC} VITE_SUPABASE_URL not found in .env"
    ((FAIL++))
  fi
  
  if grep -q "VITE_SUPABASE_ANON_KEY" .env; then
    echo -e "${GREEN}✅${NC} VITE_SUPABASE_ANON_KEY configured"
    ((PASS++))
  else
    echo -e "${RED}❌${NC} VITE_SUPABASE_ANON_KEY not found in .env"
    ((FAIL++))
  fi
  
  if grep -q "VITE_RAZORPAY_KEY_ID" .env; then
    echo -e "${YELLOW}⚠️${NC}  VITE_RAZORPAY_KEY_ID configured (optional)"
  else
    echo -e "${YELLOW}⚠️${NC}  VITE_RAZORPAY_KEY_ID not found (will use restaurant keys)"
  fi
else
  echo -e "${RED}❌${NC} .env file not found"
  ((FAIL++))
fi

echo ""
echo "📋 Checking Dev Server..."
echo ""

# Check if dev server is running
if lsof -ti:5173 > /dev/null 2>&1; then
  echo -e "${GREEN}✅${NC} Dev server is running on port 5173"
  ((PASS++))
else
  echo -e "${RED}❌${NC} Dev server is NOT running"
  echo -e "   ${YELLOW}Run:${NC} npm run dev"
  ((FAIL++))
fi

echo ""
echo "========================================================"
echo -e "Results: ${GREEN}${PASS} Passed${NC} | ${RED}${FAIL} Failed${NC}"
echo ""

if [ $FAIL -eq 0 ]; then
  echo -e "${GREEN}🎉 All checks passed! Ready to test customer journey.${NC}"
  echo ""
  echo "📖 Next steps:"
  echo "   1. Read TASK_9_CUSTOMER_JOURNEY_TEST.md"
  echo "   2. Run SQL queries in TASK_9_SQL_VERIFICATION.md"
  echo "   3. Open http://localhost:5173/table/1?restaurant=YOUR-SLUG"
  echo "   4. Follow the test procedure"
  echo ""
  exit 0
else
  echo -e "${RED}⚠️  Some checks failed. Please fix the issues above.${NC}"
  echo ""
  exit 1
fi
