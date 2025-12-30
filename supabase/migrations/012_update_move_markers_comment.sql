-- Update move_markers column comment to include 'end' type
COMMENT ON COLUMN emg_sessions.move_markers IS 'Array of move markers: [{timestamp: number, type: "request" | "sensed" | "end"}]';







