-- Add move_events column to thermal_sessions table
-- Move events are stored as JSONB array of { timestamp, secondsFromStart }
ALTER TABLE thermal_sessions ADD COLUMN IF NOT EXISTS move_events JSONB;


