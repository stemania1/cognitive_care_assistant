
-- Create emg_sessions table
CREATE TABLE IF NOT EXISTS emg_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL, -- Flexible ID to support both auth users and guests
  session_name TEXT NOT NULL DEFAULT 'Untitled Session',
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  readings JSONB, -- Stores array of {timestamp, voltage, muscleActivity}
  average_voltage FLOAT,
  max_voltage FLOAT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE emg_sessions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own EMG sessions"
  ON emg_sessions FOR SELECT
  USING (user_id = auth.uid()::text OR user_id = 'guest');

CREATE POLICY "Users can insert their own EMG sessions"
  ON emg_sessions FOR INSERT
  WITH CHECK (user_id = auth.uid()::text OR user_id = 'guest');

CREATE POLICY "Users can update their own EMG sessions"
  ON emg_sessions FOR UPDATE
  USING (user_id = auth.uid()::text OR user_id = 'guest');

CREATE POLICY "Users can delete their own EMG sessions"
  ON emg_sessions FOR DELETE
  USING (user_id = auth.uid()::text OR user_id = 'guest');

