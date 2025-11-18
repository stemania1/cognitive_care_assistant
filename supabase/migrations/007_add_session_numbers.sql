-- Add session_number column to thermal_sessions table
-- Each user gets sequential session numbers (1, 2, 3, ...)

-- Step 1: Add session_number column if it doesn't exist
ALTER TABLE thermal_sessions ADD COLUMN IF NOT EXISTS session_number INTEGER;

-- Step 2: Update existing sessions to have session numbers based on created_at
-- Assign sequential numbers per user based on creation order
UPDATE thermal_sessions ts1
SET session_number = (
  SELECT COUNT(*) + 1
  FROM thermal_sessions ts2
  WHERE ts2.user_id = ts1.user_id
  AND ts2.created_at < ts1.created_at
)
WHERE session_number IS NULL;

