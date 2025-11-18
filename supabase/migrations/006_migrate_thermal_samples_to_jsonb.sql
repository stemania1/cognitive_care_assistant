-- Safe migration: Migrate thermal sessions to use JSONB samples column
-- This handles both fresh installs and existing tables

-- Step 1: Add samples JSONB column if it doesn't exist
ALTER TABLE thermal_sessions ADD COLUMN IF NOT EXISTS samples JSONB;

-- Step 2: Add session_number column (unique per user)
ALTER TABLE thermal_sessions ADD COLUMN IF NOT EXISTS session_number INTEGER;

-- Step 3: Update existing sessions to have session numbers based on created_at
-- Assign sequential numbers per user based on creation order
UPDATE thermal_sessions ts1
SET session_number = (
  SELECT COUNT(*) + 1
  FROM thermal_sessions ts2
  WHERE ts2.user_id = ts1.user_id
  AND ts2.created_at < ts1.created_at
)
WHERE session_number IS NULL;

-- Step 4: Drop the old thermal_session_samples table if it exists
-- First, drop any policies on the old table
DROP POLICY IF EXISTS "Users can view samples for their sessions" ON thermal_session_samples;
DROP POLICY IF EXISTS "Users can insert samples for their sessions" ON thermal_session_samples;
DROP POLICY IF EXISTS "Users can delete samples for their sessions" ON thermal_session_samples;

-- Drop any indexes on the old table
DROP INDEX IF EXISTS idx_thermal_session_samples_session;
DROP INDEX IF EXISTS idx_thermal_session_samples_sample_index;

-- Drop the old table
DROP TABLE IF EXISTS thermal_session_samples;

