-- Migration to update RLS policies for Clerk authentication
-- Since Clerk doesn't integrate with Supabase Auth, we disable RLS
-- and handle security in the API layer (which uses service role key)

-- ============================================
-- daily_checks table
-- ============================================

-- Drop existing RLS policies
DROP POLICY IF EXISTS "Users can view their own daily checks" ON daily_checks;
DROP POLICY IF EXISTS "Users can insert their own daily checks" ON daily_checks;
DROP POLICY IF EXISTS "Users can update their own daily checks" ON daily_checks;
DROP POLICY IF EXISTS "Users can delete their own daily checks" ON daily_checks;

-- Disable RLS (security handled in API layer with Clerk authentication)
ALTER TABLE daily_checks DISABLE ROW LEVEL SECURITY;

-- ============================================
-- daily_check_sessions table
-- ============================================

-- Drop existing RLS policies
DROP POLICY IF EXISTS "Users can view their own daily check sessions" ON daily_check_sessions;
DROP POLICY IF EXISTS "Users can insert their own daily check sessions" ON daily_check_sessions;
DROP POLICY IF EXISTS "Users can update their own daily check sessions" ON daily_check_sessions;
DROP POLICY IF EXISTS "Users can delete their own daily check sessions" ON daily_check_sessions;

-- Disable RLS (security handled in API layer with Clerk authentication)
ALTER TABLE daily_check_sessions DISABLE ROW LEVEL SECURITY;

-- ============================================
-- thermal_sessions table
-- ============================================

-- Drop existing RLS policies
DROP POLICY IF EXISTS "Users can view their own thermal sessions" ON thermal_sessions;
DROP POLICY IF EXISTS "Users can insert their own thermal sessions" ON thermal_sessions;
DROP POLICY IF EXISTS "Users can update their own thermal sessions" ON thermal_sessions;
DROP POLICY IF EXISTS "Users can delete their own thermal sessions" ON thermal_sessions;

-- Disable RLS (security handled in API layer with Clerk authentication)
ALTER TABLE thermal_sessions DISABLE ROW LEVEL SECURITY;

-- ============================================
-- emg_sessions table
-- ============================================

-- Drop existing RLS policies
DROP POLICY IF EXISTS "Users can view their own EMG sessions" ON emg_sessions;
DROP POLICY IF EXISTS "Users can insert their own EMG sessions" ON emg_sessions;
DROP POLICY IF EXISTS "Users can update their own EMG sessions" ON emg_sessions;
DROP POLICY IF EXISTS "Users can delete their own EMG sessions" ON emg_sessions;

-- Disable RLS (security handled in API layer with Clerk authentication)
ALTER TABLE emg_sessions DISABLE ROW LEVEL SECURITY;

-- ============================================
-- Verification
-- ============================================

-- Verify RLS is disabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename IN ('daily_checks', 'daily_check_sessions', 'thermal_sessions', 'emg_sessions')
  AND schemaname = 'public'
ORDER BY tablename;

-- Note: Security is now handled in the API layer using:
-- 1. Clerk authentication to verify user identity
-- 2. Service role key for database access (bypasses RLS)
-- 3. API routes validate user_id matches authenticated Clerk user
