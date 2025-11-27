-- Migration 19: Fix Complaints Issue Types (Single to Array)
-- Created: 2025-11-22
-- Purpose: Allow multiple issue types per complaint

-- Step 1: Drop existing constraint on issue_type
ALTER TABLE complaints DROP CONSTRAINT IF EXISTS complaints_issue_type_check;

-- Step 2: Rename column from issue_type to issue_types
ALTER TABLE complaints RENAME COLUMN issue_type TO issue_types;

-- Step 3: Create a temporary column to store the converted data
ALTER TABLE complaints ADD COLUMN issue_types_temp TEXT[];

-- Step 4: Convert existing single values to arrays
UPDATE complaints SET issue_types_temp = ARRAY[issue_types::TEXT];

-- Step 5: Drop the old column and rename temp column
ALTER TABLE complaints DROP COLUMN issue_types;
ALTER TABLE complaints RENAME COLUMN issue_types_temp TO issue_types;

-- Step 6: Add NOT NULL constraint
ALTER TABLE complaints ALTER COLUMN issue_types SET NOT NULL;

-- Step 7: Add check constraint to ensure valid issue types
ALTER TABLE complaints ADD CONSTRAINT complaints_issue_types_check 
CHECK (
  issue_types <@ ARRAY['food_quality', 'wrong_item', 'wait_time', 'service', 'cleanliness', 'billing', 'other']::TEXT[]
  AND array_length(issue_types, 1) > 0
);

-- Step 8: Create GIN index for efficient array queries
CREATE INDEX idx_complaints_issue_types_gin ON complaints USING GIN (issue_types);

-- Add comment
COMMENT ON COLUMN complaints.issue_types IS 'Array of issue types allowing multiple issues per complaint';
