-- Create thermal_sessions table to track thermal sensor recording sessions
CREATE TABLE IF NOT EXISTS thermal_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  subject_identifier TEXT NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ended_at TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_seconds INTEGER NOT NULL,
  average_surface_temp NUMERIC(5, 2),
  average_temperature_range NUMERIC(5, 2),
  thermal_event_count INTEGER NOT NULL DEFAULT 0,
  samples JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_thermal_sessions_user_id ON thermal_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_thermal_sessions_subject ON thermal_sessions(subject_identifier);
CREATE INDEX IF NOT EXISTS idx_thermal_sessions_started_at ON thermal_sessions(started_at DESC);

-- Enable Row Level Security
ALTER TABLE thermal_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for thermal_sessions
CREATE POLICY "Users can view their own thermal sessions" ON thermal_sessions
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own thermal sessions" ON thermal_sessions
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own thermal sessions" ON thermal_sessions
  FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own thermal sessions" ON thermal_sessions
  FOR DELETE USING (auth.uid()::text = user_id);

