#!/bin/bash

# ============================================================================
# MANAGER LOGIN FIX VERIFICATION SCRIPT
# ============================================================================
# This script helps verify that all fixes have been applied correctly
# ============================================================================

echo ""
echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║  🔍 Manager Login Fix Verification                              ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""

# Check if StaffLogin.jsx has the delay
echo "📋 Checking StaffLogin.jsx for 300ms delay..."
if grep -q "setTimeout(resolve, 300)" src/pages/auth/StaffLogin.jsx; then
    echo "✅ StaffLogin.jsx: Delay code found!"
else
    echo "❌ StaffLogin.jsx: Delay code NOT found!"
    echo "   Expected: await new Promise(resolve => setTimeout(resolve, 300));"
fi
echo ""

# Check if ProtectedRoute.jsx has the restaurantLoading check
echo "📋 Checking ProtectedRoute.jsx for loading check..."
if grep -q "if (restaurantLoading)" src/shared/guards/ProtectedRoute.jsx; then
    echo "✅ ProtectedRoute.jsx: Loading check found!"
else
    echo "❌ ProtectedRoute.jsx: Loading check NOT found!"
    echo "   Expected: if (restaurantLoading) { return; }"
fi
echo ""

# Check if dev server is running
echo "📋 Checking if dev server is running..."
if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "✅ Dev server is running on port 5173"
    PID=$(lsof -Pi :5173 -sTCP:LISTEN -t)
    echo "   PID: $PID"
    echo "   URL: http://localhost:5173"
else
    echo "⚠️  Dev server is NOT running!"
    echo "   Run: npm run dev"
fi
echo ""

# Check if node_modules exists
echo "📋 Checking dependencies..."
if [ -d "node_modules" ]; then
    echo "✅ node_modules exists"
else
    echo "⚠️  node_modules NOT found!"
    echo "   Run: npm install"
fi
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 NEXT STEPS:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. If code checks failed: Re-apply fixes"
echo "2. If dev server not running: npm run dev"
echo "3. Run SQL script: database/FIX_MANAGER_LOGIN_TIMING.sql"
echo "4. Test login at: http://localhost:5173/login"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
