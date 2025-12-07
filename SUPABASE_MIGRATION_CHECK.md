# Supabase Migration Verification Guide

## Issue: EMG Sessions Not Saving

### Step 1: Verify Migration Has Been Run

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Run this query to check if the table exists:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'emg_sessions';
```

**Expected Result:** Should return `emg_sessions`

### Step 2: Check Table Structure

Run this query to verify the table columns:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'emg_sessions'
ORDER BY ordinal_position;
```

**Expected Columns:**
- `id` (uuid)
- `user_id` (text)
- `session_name` (text)
- `started_at` (timestamptz)
- `ended_at` (timestamptz)
- `duration_seconds` (integer)
- `readings` (jsonb)
- `average_voltage` (float)
- `max_voltage` (float)
- `created_at` (timestamptz)

### Step 3: Check RLS Policies

Run this query to see RLS policies:

```sql
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'emg_sessions';
```

**Expected:** Should see 4 policies (SELECT, INSERT, UPDATE, DELETE)

### Step 4: Test Manual Insert

Try inserting a test record directly:

```sql
INSERT INTO emg_sessions (
  user_id,
  session_name,
  started_at,
  ended_at,
  duration_seconds,
  readings,
  average_voltage,
  max_voltage
) VALUES (
  'test-user',
  'Test Session',
  NOW(),
  NOW(),
  60,
  '[]'::jsonb,
  1.5,
  2.0
) RETURNING *;
```

**If this fails:** The table structure or RLS policies may be incorrect.

### Step 5: Verify Service Role Key

Check your `.env.local` file:

```bash
SUPABASE_SERVICE_ROLE_KEY=your-actual-service-role-key-here
```

**Important:** 
- Must NOT be `<your-service-role-key>`
- Must be the actual service role key from Supabase Dashboard → Settings → API

### Step 6: Check Browser Console

When you try to save a recording, check the browser console (F12) for:
- Any error messages
- The API response
- Network tab → Check the `/api/emg-sessions` request

### Step 7: Check Server Logs

Check your Next.js server console for:
- `📝 Inserting EMG session:` log
- `❌ Error inserting EMG session:` log (if error)
- `✅ EMG session inserted successfully:` log (if success)

### Common Issues

#### Issue 1: Migration Not Run
**Solution:** Run the migration in Supabase Dashboard → SQL Editor

#### Issue 2: Service Role Key Not Set
**Solution:** Add `SUPABASE_SERVICE_ROLE_KEY` to `.env.local` and restart the dev server

#### Issue 3: RLS Blocking Inserts
**Solution:** Since we use service role key, RLS should be bypassed. If not, check that the key is correct.

#### Issue 4: Table Doesn't Exist
**Solution:** Run the migration file manually in Supabase SQL Editor

### Quick Fix: Re-run Migration

If the table doesn't exist or has issues, copy the entire migration file content and run it in Supabase SQL Editor:

```sql
-- Create emg_sessions table
CREATE TABLE IF NOT EXISTS emg_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  session_name TEXT NOT NULL DEFAULT 'Untitled Session',
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  readings JSONB,
  average_voltage FLOAT,
  max_voltage FLOAT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE emg_sessions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own EMG sessions" ON emg_sessions;
DROP POLICY IF EXISTS "Users can insert their own EMG sessions" ON emg_sessions;
DROP POLICY IF EXISTS "Users can update their own EMG sessions" ON emg_sessions;
DROP POLICY IF EXISTS "Users can delete their own EMG sessions" ON emg_sessions;

-- Create policies
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
```



