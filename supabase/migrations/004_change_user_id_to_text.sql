-- Migration to change user_id columns from UUID to TEXT to support guest users
-- This allows both UUID (for regular users) and TEXT (for guest users) in the same column

-- Step 1: Drop RLS policies on daily_checks table
DROP POLICY IF EXISTS "Users can view their own daily checks" ON daily_checks;
DROP POLICY IF EXISTS "Users can insert their own daily checks" ON daily_checks;
DROP POLICY IF EXISTS "Users can update their own daily checks" ON daily_checks;
DROP POLICY IF EXISTS "Users can delete their own daily checks" ON daily_checks;

-- Step 2: Drop foreign key constraint on daily_checks table
ALTER TABLE daily_checks DROP CONSTRAINT IF EXISTS daily_checks_user_id_fkey;

-- Step 3: Change user_id column type from UUID to TEXT
ALTER TABLE daily_checks ALTER COLUMN user_id TYPE TEXT;

-- Step 4: Recreate RLS policies with TEXT comparison
CREATE POLICY "Users can view their own daily checks" ON daily_checks
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own daily checks" ON daily_checks
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own daily checks" ON daily_checks
  FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own daily checks" ON daily_checks
  FOR DELETE USING (auth.uid()::text = user_id);

-- Step 5: Drop RLS policies on daily_check_sessions table
DROP POLICY IF EXISTS "Users can view their own daily check sessions" ON daily_check_sessions;
DROP POLICY IF EXISTS "Users can insert their own daily check sessions" ON daily_check_sessions;
DROP POLICY IF EXISTS "Users can update their own daily check sessions" ON daily_check_sessions;
DROP POLICY IF EXISTS "Users can delete their own daily check sessions" ON daily_check_sessions;

-- Step 6: Drop foreign key constraint on daily_check_sessions table
ALTER TABLE daily_check_sessions DROP CONSTRAINT IF EXISTS daily_check_sessions_user_id_fkey;

-- Step 7: Change user_id column type from UUID to TEXT
ALTER TABLE daily_check_sessions ALTER COLUMN user_id TYPE TEXT;

-- Step 8: Recreate RLS policies with TEXT comparison
CREATE POLICY "Users can view their own daily check sessions" ON daily_check_sessions
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own daily check sessions" ON daily_check_sessions
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own daily check sessions" ON daily_check_sessions
  FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own daily check sessions" ON daily_check_sessions
  FOR DELETE USING (auth.uid()::text = user_id);

-- Step 9: Verify the changes
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'daily_checks' 
AND column_name = 'user_id';

SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'daily_check_sessions' 
AND column_name = 'user_id';

-- Step 10: Show that policies are recreated
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename IN ('daily_checks', 'daily_check_sessions')
ORDER BY tablename, policyname;
