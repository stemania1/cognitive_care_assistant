-- Create daily_checks table to track user responses to daily questions
CREATE TABLE IF NOT EXISTS daily_checks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  question_id TEXT NOT NULL,
  question_text TEXT NOT NULL,
  answer TEXT NOT NULL,
  answer_type TEXT CHECK (answer_type IN ('text', 'choice')) DEFAULT 'text',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for efficient querying by user and date
CREATE INDEX IF NOT EXISTS idx_daily_checks_user_date ON daily_checks(user_id, date);
CREATE INDEX IF NOT EXISTS idx_daily_checks_user_question ON daily_checks(user_id, question_id);

-- Enable Row Level Security
ALTER TABLE daily_checks ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to only see their own daily checks
CREATE POLICY "Users can view their own daily checks" ON daily_checks
  FOR SELECT USING (auth.uid() = user_id);

-- Create policy to allow users to insert their own daily checks
CREATE POLICY "Users can insert their own daily checks" ON daily_checks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to update their own daily checks
CREATE POLICY "Users can update their own daily checks" ON daily_checks
  FOR UPDATE USING (auth.uid() = user_id);

-- Create policy to allow users to delete their own daily checks
CREATE POLICY "Users can delete their own daily checks" ON daily_checks
  FOR DELETE USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_daily_checks_updated_at
  BEFORE UPDATE ON daily_checks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
