-- Migration 18: Cash Reconciliations Table
-- Created: 2025-11-22
-- Purpose: Track daily cash reconciliation with denomination breakdown

-- Create cash_reconciliations table
CREATE TABLE IF NOT EXISTS cash_reconciliations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  reconciliation_date DATE NOT NULL,
  
  -- Cash amounts breakdown
  expected_cash NUMERIC(10,2) NOT NULL CHECK (expected_cash >= 0),
  actual_cash NUMERIC(10,2) NOT NULL CHECK (actual_cash >= 0),
  difference NUMERIC(10,2) NOT NULL,
  
  -- Order type breakdown
  dinein_cash NUMERIC(10,2) DEFAULT 0 CHECK (dinein_cash >= 0),
  dinein_count INT DEFAULT 0 CHECK (dinein_count >= 0),
  takeaway_cash NUMERIC(10,2) DEFAULT 0 CHECK (takeaway_cash >= 0),
  takeaway_count INT DEFAULT 0 CHECK (takeaway_count >= 0),
  split_cash NUMERIC(10,2) DEFAULT 0 CHECK (split_cash >= 0),
  split_count INT DEFAULT 0 CHECK (split_count >= 0),
  
  -- Denomination details stored as JSONB
  -- Format: { "2000": 5, "500": 10, "200": 15, ... }
  denominations JSONB,
  
  -- Audit trail
  reason_for_difference TEXT,
  submitted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one reconciliation per restaurant per day
  UNIQUE(restaurant_id, reconciliation_date)
);

-- Create index for efficient date-based queries
CREATE INDEX idx_cash_recon_restaurant_date 
ON cash_reconciliations(restaurant_id, reconciliation_date DESC);

-- Create index for filtering by submission date
CREATE INDEX idx_cash_recon_submitted_at 
ON cash_reconciliations(submitted_at DESC);

-- Add comment to table
COMMENT ON TABLE cash_reconciliations IS 'Daily cash reconciliation records with denomination breakdown';

-- Add comments to important columns
COMMENT ON COLUMN cash_reconciliations.expected_cash IS 'Expected cash from system records (cash orders + split cash portion)';
COMMENT ON COLUMN cash_reconciliations.actual_cash IS 'Actual cash counted physically';
COMMENT ON COLUMN cash_reconciliations.difference IS 'Difference between actual and expected (actual - expected)';
COMMENT ON COLUMN cash_reconciliations.denominations IS 'JSONB object storing count of each denomination: {"2000": 5, "500": 10, ...}';
