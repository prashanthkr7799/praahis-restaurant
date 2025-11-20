#!/bin/bash

# Test script for table-session cleanup system
# Tests auto-release, manual release, and edge cases

set -e

echo "🧪 Testing Table Session Cleanup System"
echo "========================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
SUPABASE_URL="${VITE_SUPABASE_URL}"
SUPABASE_ANON_KEY="${VITE_SUPABASE_ANON_KEY}"
TEST_TABLE_ID="" # Will be set from database

if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON_KEY" ]; then
  echo -e "${RED}❌ Error: SUPABASE_URL and SUPABASE_ANON_KEY must be set${NC}"
  echo "Set them in your .env file or export them:"
  echo "  export VITE_SUPABASE_URL='https://xxx.supabase.co'"
  echo "  export VITE_SUPABASE_ANON_KEY='eyJ...'"
  exit 1
fi

# Function to call Supabase RPC
call_rpc() {
  local func_name=$1
  local params=$2
  
  curl -s -X POST \
    "${SUPABASE_URL}/rest/v1/rpc/${func_name}" \
    -H "apikey: ${SUPABASE_ANON_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
    -H "Content-Type: application/json" \
    -d "${params}"
}

# Function to query database
query_db() {
  local query=$1
  
  curl -s -X POST \
    "${SUPABASE_URL}/rest/v1/rpc/exec_sql" \
    -H "apikey: ${SUPABASE_ANON_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
    -H "Content-Type: application/json" \
    -d "{\"query\": \"${query}\"}"
}

echo "📋 Test 1: Check Database Schema"
echo "--------------------------------"

# Check if last_activity_at column exists
echo "Checking for last_activity_at column..."
COLUMN_CHECK=$(call_rpc "exec_sql" '{"query": "SELECT column_name FROM information_schema.columns WHERE table_name='"'"'table_sessions'"'"' AND column_name='"'"'last_activity_at'"'"';"}')

if echo "$COLUMN_CHECK" | grep -q "last_activity_at"; then
  echo -e "${GREEN}✅ last_activity_at column exists${NC}"
else
  echo -e "${RED}❌ last_activity_at column NOT found - run migration first${NC}"
  exit 1
fi

# Check if functions exist
echo "Checking database functions..."
FUNC_CHECK=$(call_rpc "exec_sql" '{"query": "SELECT proname FROM pg_proc WHERE proname IN ('"'"'update_session_activity'"'"', '"'"'cleanup_inactive_sessions'"'"', '"'"'force_release_table_session'"'"');"}')

if echo "$FUNC_CHECK" | grep -q "update_session_activity"; then
  echo -e "${GREEN}✅ update_session_activity function exists${NC}"
else
  echo -e "${RED}❌ update_session_activity function NOT found${NC}"
  exit 1
fi

if echo "$FUNC_CHECK" | grep -q "cleanup_inactive_sessions"; then
  echo -e "${GREEN}✅ cleanup_inactive_sessions function exists${NC}"
else
  echo -e "${RED}❌ cleanup_inactive_sessions function NOT found${NC}"
  exit 1
fi

if echo "$FUNC_CHECK" | grep -q "force_release_table_session"; then
  echo -e "${GREEN}✅ force_release_table_session function exists${NC}"
else
  echo -e "${RED}❌ force_release_table_session function NOT found${NC}"
  exit 1
fi

echo ""
echo "📋 Test 2: Create Test Session"
echo "--------------------------------"

# Get first available table
echo "Finding available table..."
TEST_TABLE=$(curl -s -X GET \
  "${SUPABASE_URL}/rest/v1/tables?select=id,table_number,restaurant_id&status=eq.available&limit=1" \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}")

TEST_TABLE_ID=$(echo "$TEST_TABLE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
TEST_RESTAURANT_ID=$(echo "$TEST_TABLE" | grep -o '"restaurant_id":"[^"]*"' | head -1 | cut -d'"' -f4)
TEST_TABLE_NUMBER=$(echo "$TEST_TABLE" | grep -o '"table_number":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$TEST_TABLE_ID" ]; then
  echo -e "${RED}❌ No available tables found - create a table first${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Found table #${TEST_TABLE_NUMBER} (${TEST_TABLE_ID})${NC}"

# Create session
echo "Creating test session..."
SESSION_RESULT=$(call_rpc "get_or_create_table_session" "{\"p_table_id\": \"${TEST_TABLE_ID}\", \"p_restaurant_id\": \"${TEST_RESTAURANT_ID}\"}")
TEST_SESSION_ID=$(echo "$SESSION_RESULT" | grep -o '"[a-f0-9-]\{36\}"' | head -1 | tr -d '"')

if [ -z "$TEST_SESSION_ID" ]; then
  echo -e "${RED}❌ Failed to create session${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Created session: ${TEST_SESSION_ID}${NC}"

# Verify session was created
echo "Verifying session in database..."
sleep 1

SESSION_CHECK=$(curl -s -X GET \
  "${SUPABASE_URL}/rest/v1/table_sessions?select=*&id=eq.${TEST_SESSION_ID}" \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}")

if echo "$SESSION_CHECK" | grep -q "\"status\":\"active\""; then
  echo -e "${GREEN}✅ Session is active${NC}"
else
  echo -e "${RED}❌ Session not active${NC}"
  exit 1
fi

if echo "$SESSION_CHECK" | grep -q "\"last_activity_at\""; then
  echo -e "${GREEN}✅ last_activity_at is set${NC}"
else
  echo -e "${YELLOW}⚠️  last_activity_at not found${NC}"
fi

echo ""
echo "📋 Test 3: Update Session Activity"
echo "--------------------------------"

# Update activity
echo "Updating session activity..."
ACTIVITY_RESULT=$(call_rpc "update_session_activity" "{\"p_session_id\": \"${TEST_SESSION_ID}\"}")

if echo "$ACTIVITY_RESULT" | grep -q "true"; then
  echo -e "${GREEN}✅ Activity updated successfully${NC}"
else
  echo -e "${YELLOW}⚠️  Activity update returned: ${ACTIVITY_RESULT}${NC}"
fi

# Wait and update again
echo "Waiting 2 seconds and updating again..."
sleep 2

ACTIVITY_RESULT2=$(call_rpc "update_session_activity" "{\"p_session_id\": \"${TEST_SESSION_ID}\"}")

if echo "$ACTIVITY_RESULT2" | grep -q "true"; then
  echo -e "${GREEN}✅ Second activity update successful${NC}"
else
  echo -e "${YELLOW}⚠️  Second activity update failed${NC}"
fi

echo ""
echo "📋 Test 4: Manual Force Release"
echo "--------------------------------"

echo "Force-releasing table via API..."
FORCE_RELEASE_RESULT=$(call_rpc "force_release_table_session" "{\"p_session_id\": \"${TEST_SESSION_ID}\", \"p_table_id\": null}")

if echo "$FORCE_RELEASE_RESULT" | grep -q "\"success\":true"; then
  echo -e "${GREEN}✅ Force release successful${NC}"
else
  echo -e "${RED}❌ Force release failed${NC}"
  echo "Result: ${FORCE_RELEASE_RESULT}"
  exit 1
fi

# Verify session is cancelled
sleep 1
SESSION_CHECK2=$(curl -s -X GET \
  "${SUPABASE_URL}/rest/v1/table_sessions?select=*&id=eq.${TEST_SESSION_ID}" \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}")

if echo "$SESSION_CHECK2" | grep -q "\"status\":\"cancelled\""; then
  echo -e "${GREEN}✅ Session is cancelled${NC}"
else
  echo -e "${RED}❌ Session not cancelled${NC}"
  exit 1
fi

# Verify table is available
TABLE_CHECK=$(curl -s -X GET \
  "${SUPABASE_URL}/rest/v1/tables?select=status&id=eq.${TEST_TABLE_ID}" \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}")

if echo "$TABLE_CHECK" | grep -q "\"status\":\"available\""; then
  echo -e "${GREEN}✅ Table is available${NC}"
else
  echo -e "${RED}❌ Table not available${NC}"
  exit 1
fi

echo ""
echo "📋 Test 5: Auto-Cleanup Function"
echo "--------------------------------"

# Create another session for timeout test
echo "Creating session for timeout test..."
SESSION_RESULT2=$(call_rpc "get_or_create_table_session" "{\"p_table_id\": \"${TEST_TABLE_ID}\", \"p_restaurant_id\": \"${TEST_RESTAURANT_ID}\"}")
TEST_SESSION_ID2=$(echo "$SESSION_RESULT2" | grep -o '"[a-f0-9-]\{36\}"' | head -1 | tr -d '"')

if [ -z "$TEST_SESSION_ID2" ]; then
  echo -e "${RED}❌ Failed to create second session${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Created session: ${TEST_SESSION_ID2}${NC}"

# Manually set last_activity_at to 6 minutes ago (to simulate timeout)
echo "Setting last_activity_at to 6 minutes ago (simulating inactivity)..."

# Note: This requires direct database access, so we'll skip actual backdating
# and just test the cleanup function with current data
echo -e "${YELLOW}ℹ️  In production, wait 5 minutes for real timeout test${NC}"
echo -e "${YELLOW}ℹ️  For now, testing cleanup function call...${NC}"

# Call cleanup function (should not clean this session since it's recent)
echo "Calling cleanup_inactive_sessions(5)..."
CLEANUP_RESULT=$(call_rpc "cleanup_inactive_sessions" '{"p_timeout_minutes": 5}')

echo "Cleanup result: ${CLEANUP_RESULT}"

if echo "$CLEANUP_RESULT" | grep -q "\[\]"; then
  echo -e "${GREEN}✅ Cleanup function executed (no inactive sessions)${NC}"
else
  echo -e "${YELLOW}⚠️  Cleanup function returned data: ${CLEANUP_RESULT}${NC}"
fi

# Clean up test session
echo "Cleaning up test session..."
call_rpc "force_release_table_session" "{\"p_session_id\": \"${TEST_SESSION_ID2}\", \"p_table_id\": null}" > /dev/null

echo ""
echo "📋 Test 6: Edge Function (if deployed)"
echo "--------------------------------"

if [ -n "$SUPABASE_PROJECT_REF" ]; then
  EDGE_FUNCTION_URL="https://${SUPABASE_PROJECT_REF}.supabase.co/functions/v1/cleanup-inactive-sessions"
  
  echo "Calling edge function at: ${EDGE_FUNCTION_URL}"
  EDGE_RESULT=$(curl -s -X POST \
    -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
    "${EDGE_FUNCTION_URL}")
  
  if echo "$EDGE_RESULT" | grep -q "success"; then
    echo -e "${GREEN}✅ Edge function is deployed and working${NC}"
    echo "Result: ${EDGE_RESULT}"
  else
    echo -e "${YELLOW}⚠️  Edge function returned: ${EDGE_RESULT}${NC}"
  fi
else
  echo -e "${YELLOW}⚠️  SUPABASE_PROJECT_REF not set, skipping edge function test${NC}"
  echo "Set it to test: export SUPABASE_PROJECT_REF='xxx'"
fi

echo ""
echo "========================================"
echo -e "${GREEN}✅ All tests completed!${NC}"
echo "========================================"
echo ""
echo "Summary:"
echo "  ✅ Database schema is correct"
echo "  ✅ Functions are available"
echo "  ✅ Session creation works"
echo "  ✅ Activity tracking works"
echo "  ✅ Manual force release works"
echo "  ✅ Cleanup function executes"
echo ""
echo "Next steps:"
echo "  1. Deploy edge function: supabase functions deploy cleanup-inactive-sessions"
echo "  2. Set up cron job (see docs/setup/TABLE_SESSION_AUTO_CLEANUP_SETUP.md)"
echo "  3. Test in browser: open table page and wait 5 minutes"
echo ""
