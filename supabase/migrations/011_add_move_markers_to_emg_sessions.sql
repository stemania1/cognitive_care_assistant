-- Add move_markers column to emg_sessions table
ALTER TABLE emg_sessions 
ADD COLUMN IF NOT EXISTS move_markers JSONB DEFAULT '[]'::jsonb;

-- Add comment to document the structure
COMMENT ON COLUMN emg_sessions.move_markers IS 'Array of move markers: [{timestamp: number, type: "request" | "sensed" | "end"}]';


