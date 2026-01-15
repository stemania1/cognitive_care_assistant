-- Fix RLS for daily_checks table
-- This ensures RLS is disabled so the API can insert rows using service role key

-- First, drop any existing RLS policies
DROP POLICY IF EXISTS "Users can view their own daily checks" ON daily_checks;
DROP POLICY IF EXISTS "Users can insert their own daily checks" ON daily_checks;
DROP POLICY IF EXISTS "Users can update their own daily checks" ON daily_checks;
DROP POLICY IF EXISTS "Users can delete their own daily checks" ON daily_checks;

-- Disable RLS on daily_checks table
ALTER TABLE daily_checks DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'daily_checks'
  AND schemaname = 'public';

-- Expected result: rls_enabled should be false
