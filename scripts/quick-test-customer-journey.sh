#!/bin/bash

# 🎯 Quick Customer Journey Test - Interactive Guide
# This script will guide you through testing the customer journey

echo ""
echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║                                                                  ║"
echo "║          🧪 CUSTOMER JOURNEY - INTERACTIVE TEST GUIDE           ║"
echo "║                                                                  ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check dev server is running
echo -e "${BLUE}[Step 1]${NC} Checking dev server..."
if lsof -ti:5173 > /dev/null 2>&1; then
  echo -e "${GREEN}✅ Dev server is running on http://localhost:5173${NC}"
else
  echo -e "${RED}❌ Dev server is NOT running${NC}"
  echo -e "${YELLOW}Please run: npm run dev${NC}"
  exit 1
fi
echo ""

# Check .env file
echo -e "${BLUE}[Step 2]${NC} Checking environment configuration..."
if [ -f ".env" ] || [ -f ".env.local" ]; then
  echo -e "${GREEN}✅ Environment file found${NC}"
else
  echo -e "${RED}❌ No .env file found${NC}"
  echo -e "${YELLOW}Create .env file with your Supabase credentials:${NC}"
  echo "   VITE_SUPABASE_URL=https://your-project.supabase.co"
  echo "   VITE_SUPABASE_ANON_KEY=your-anon-key"
  exit 1
fi
echo ""

# Instructions for database check
echo -e "${BLUE}[Step 3]${NC} Database Test Data Check..."
echo -e "${YELLOW}⚠️  You need to verify test data exists in Supabase${NC}"
echo ""
echo "Open Supabase SQL Editor and run:"
echo ""
echo -e "${GREEN}-- Check restaurants${NC}"
echo "SELECT id, name, slug FROM restaurants WHERE is_active = true LIMIT 5;"
echo ""
echo -e "${GREEN}-- Check tables${NC}"
echo "SELECT id, table_number, restaurant_id FROM tables LIMIT 10;"
echo ""
echo -e "${GREEN}-- Check menu items${NC}"
echo "SELECT id, name, category, price FROM menu_items WHERE is_available = true LIMIT 10;"
echo ""
read -p "Press Enter after verifying you have test data in database..."
echo ""

# Get test URL from user
echo -e "${BLUE}[Step 4]${NC} Build your test URL..."
echo ""
echo -e "Based on your database query results:"
read -p "Enter restaurant slug (e.g., test-restaurant): " SLUG
read -p "Enter table ID (e.g., 1): " TABLE_ID
echo ""

TEST_URL="http://localhost:5173/table/${TABLE_ID}?restaurant=${SLUG}"
echo -e "${GREEN}✅ Your test URL:${NC}"
echo -e "${BLUE}${TEST_URL}${NC}"
echo ""

# Open browser
echo -e "${BLUE}[Step 5]${NC} Opening test URL in browser..."
echo ""
read -p "Press Enter to open browser, or Ctrl+C to cancel..."

# Try to open in default browser (macOS)
if command -v open > /dev/null; then
  open "$TEST_URL"
  echo -e "${GREEN}✅ Browser opened${NC}"
elif command -v xdg-open > /dev/null; then
  xdg-open "$TEST_URL"
  echo -e "${GREEN}✅ Browser opened${NC}"
else
  echo -e "${YELLOW}⚠️  Could not auto-open browser${NC}"
  echo -e "Please manually open: ${BLUE}${TEST_URL}${NC}"
fi
echo ""

# Testing checklist
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}📋 TESTING CHECKLIST${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Follow these steps in your browser:"
echo ""
echo "1️⃣  TABLE PAGE"
echo "   □ Page loads without errors"
echo "   □ Menu items display"
echo "   □ Open DevTools (F12) → Check console for errors"
echo ""
echo "2️⃣  BROWSE MENU"
echo "   □ Click category tabs"
echo "   □ Items filter correctly"
echo "   □ Search for a dish"
echo ""
echo "3️⃣  ADD TO CART"
echo "   □ Click '+ Add' on 2-3 items"
echo "   □ Cart count updates"
echo "   □ Cart panel opens (mobile) or shows on right (desktop)"
echo ""
echo "4️⃣  PLACE ORDER"
echo "   □ Click 'Pay Now' button"
echo "   □ Redirects to payment page"
echo "   □ Order summary displays correctly"
echo ""
echo "5️⃣  VERIFY DATABASE"
echo "   Run in Supabase SQL Editor:"
echo "   ${GREEN}SELECT * FROM orders ORDER BY created_at DESC LIMIT 1;${NC}"
echo "   □ Order created with correct items and total"
echo ""
echo "6️⃣  REAL-TIME TEST (CRITICAL!)"
echo "   □ Open order status page"
echo "   □ Login as chef in another tab"
echo "   □ Change order status in chef dashboard"
echo "   □ Customer view updates automatically (within 2-3 seconds)"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${BLUE}📚 Full test guide:${NC} TASK_9_CUSTOMER_JOURNEY_TEST.md"
echo -e "${BLUE}📝 Checklist:${NC} TASK_9_CHECKLIST.md"
echo ""
echo -e "${GREEN}Good luck! Test thoroughly - this is your revenue flow! 🚀${NC}"
echo ""
