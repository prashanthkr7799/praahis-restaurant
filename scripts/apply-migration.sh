#!/bin/bash

# Migration Script: Fix Order Items and Complaints
# Executes SQL migration directly via psql

set -e  # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo "  MIGRATION: Fix Order Items & Complaints"
echo "═══════════════════════════════════════════════════════════════════"
echo ""

# Load environment variables
if [ -f .env.local ]; then
  export $(cat .env.local | grep -v '^#' | grep -v '^$' | xargs)
  echo -e "${GREEN}✅ Loaded .env.local${NC}"
else
  echo -e "${RED}❌ .env.local not found${NC}"
  exit 1
fi

# Check if migration file exists
if [ ! -f migrations/fix-order-items-and-complaints.sql ]; then
  echo -e "${RED}❌ Migration file not found: migrations/fix-order-items-and-complaints.sql${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Migration file found${NC}"
echo ""

# Check if psql is available
if ! command -v psql &> /dev/null; then
  echo -e "${YELLOW}⚠️  psql not found. Using alternative method...${NC}"
  echo ""
  echo -e "${CYAN}Please run the migration manually:${NC}"
  echo ""
  echo "1. Go to: https://supabase.com/dashboard/project/hpcwpkjbmcelptwwxicn/sql"
  echo "2. Open: migrations/fix-order-items-and-complaints.sql"
  echo "3. Copy and paste the SQL into the editor"
  echo "4. Click 'Run'"
  echo ""
  exit 0
fi

# Ask for confirmation
echo -e "${YELLOW}⚠️  This will modify your database schema:${NC}"
echo "   - Create order_items table with RLS policies"
echo "   - Add issue_type and related columns to complaints table"
echo "   - Create indexes for performance"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo -e "${YELLOW}Migration cancelled${NC}"
  exit 0
fi

echo ""
echo -e "${CYAN}▶ Executing migration...${NC}"
echo ""

# Execute the migration
PGPASSWORD="$SUPABASE_DB_PASSWORD" psql \
  -h "db.hpcwpkjbmcelptwwxicn.supabase.co" \
  -p 5432 \
  -U postgres \
  -d postgres \
  -f migrations/fix-order-items-and-complaints.sql

if [ $? -eq 0 ]; then
  echo ""
  echo "═══════════════════════════════════════════════════════════════════"
  echo -e "${GREEN}✅ Migration completed successfully!${NC}"
  echo "═══════════════════════════════════════════════════════════════════"
  echo ""
  echo -e "${CYAN}Run verification test:${NC}"
  echo "  npm run test:schema"
  echo ""
else
  echo ""
  echo "═══════════════════════════════════════════════════════════════════"
  echo -e "${RED}❌ Migration failed${NC}"
  echo "═══════════════════════════════════════════════════════════════════"
  echo ""
  exit 1
fi
