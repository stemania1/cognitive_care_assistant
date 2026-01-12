-- Create user_id_mappings table to map Clerk user IDs to old Supabase Auth UUIDs
-- This allows users to access their old data after migrating from Supabase Auth to Clerk

CREATE TABLE IF NOT EXISTS user_id_mappings (
  email TEXT PRIMARY KEY,
  supabase_uuid TEXT NOT NULL,
  clerk_user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_id_mappings_email ON user_id_mappings(email);
CREATE INDEX IF NOT EXISTS idx_user_id_mappings_clerk_user_id ON user_id_mappings(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_user_id_mappings_supabase_uuid ON user_id_mappings(supabase_uuid);

-- Example: Insert mapping for corbinaltaicraig@gmail.com
-- You need to:
-- 1. Find the old Supabase UUID (run query below)
-- 2. Get the Clerk user ID from Clerk dashboard
-- 3. Insert the mapping:
--
-- INSERT INTO user_id_mappings (email, supabase_uuid, clerk_user_id)
-- VALUES ('corbinaltaicraig@gmail.com', 'OLD_SUPABASE_UUID_HERE', 'CLERK_USER_ID_HERE')
-- ON CONFLICT (email) DO UPDATE 
-- SET supabase_uuid = EXCLUDED.supabase_uuid, 
--     clerk_user_id = EXCLUDED.clerk_user_id,
--     updated_at = NOW();

-- Query to find unique user_ids in existing sessions:
-- SELECT DISTINCT user_id FROM emg_sessions ORDER BY user_id;
-- SELECT DISTINCT user_id FROM thermal_sessions ORDER BY user_id;
--
-- Then check Supabase auth.users table (if accessible) to find which UUID belongs to which email:
-- SELECT id, email FROM auth.users WHERE email = 'corbinaltaicraig@gmail.com';
