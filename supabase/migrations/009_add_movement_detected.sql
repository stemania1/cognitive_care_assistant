-- Add movement_detected column to thermal_sessions table
-- Movement detected events are stored as JSONB array of { timestamp, secondsFromStart }
-- These are automatically detected movement events (when variance/range exceeds thresholds)
ALTER TABLE thermal_sessions ADD COLUMN IF NOT EXISTS movement_detected JSONB;




