-- Track time taken to answer each bank (set) of daily questions
CREATE TABLE IF NOT EXISTS daily_check_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  set_start_index INTEGER NOT NULL,
  duration_ms INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_daily_check_sessions_user_date ON daily_check_sessions(user_id, date);

ALTER TABLE daily_check_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own daily check sessions" ON daily_check_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own daily check sessions" ON daily_check_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily check sessions" ON daily_check_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own daily check sessions" ON daily_check_sessions
  FOR DELETE USING (auth.uid() = user_id);

