# Quick Fix Instructions for Accessing Old Data

## Summary

I've updated both history pages to use Clerk, but they still need to be able to query old data stored with Supabase UUIDs.

## What's Done ✅

1. ✅ Updated EMG history page to use Clerk's `useUser()` hook
2. ✅ Updated Thermal history page to use Clerk's `useUser()` hook
3. ✅ Created user_id_mappings table migration
4. ✅ Created helper functions for user ID mapping

## What You Need to Do

### Step 1: Run the Mapping Table Migration

Run this SQL in Supabase SQL Editor:

```sql
-- File: supabase/migrations/014_create_user_id_mappings.sql
CREATE TABLE IF NOT EXISTS user_id_mappings (
  email TEXT PRIMARY KEY,
  supabase_uuid TEXT NOT NULL,
  clerk_user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_id_mappings_email ON user_id_mappings(email);
CREATE INDEX IF NOT EXISTS idx_user_id_mappings_clerk_user_id ON user_id_mappings(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_user_id_mappings_supabase_uuid ON user_id_mappings(supabase_uuid);
```

### Step 2: Find the Old Supabase UUID

Run these queries to find what user_ids exist in your sessions:

```sql
-- Find unique user_ids in EMG sessions
SELECT DISTINCT user_id, COUNT(*) as session_count 
FROM emg_sessions 
GROUP BY user_id 
ORDER BY session_count DESC;

-- Find unique user_ids in thermal sessions
SELECT DISTINCT user_id, COUNT(*) as session_count 
FROM thermal_sessions 
GROUP BY user_id 
ORDER BY session_count DESC;
```

If you can access `auth.users`:

```sql
SELECT id, email 
FROM auth.users 
WHERE email = 'corbinaltaicraig@gmail.com';
```

### Step 3: Get Clerk User ID

1. Go to Clerk Dashboard
2. Find user `corbinaltaicraig@gmail.com`
3. Copy their User ID (format: `user_2abc123def456`)

### Step 4: Create the Mapping

Insert the mapping (replace UUIDs with actual values):

```sql
INSERT INTO user_id_mappings (email, supabase_uuid, clerk_user_id)
VALUES ('corbinaltaicraig@gmail.com', 'OLD_SUPABASE_UUID', 'CLERK_USER_ID')
ON CONFLICT (email) DO UPDATE 
SET supabase_uuid = EXCLUDED.supabase_uuid, 
    clerk_user_id = EXCLUDED.clerk_user_id,
    updated_at = NOW();
```

### Step 5: Update API Routes (I'll do this next)

The API routes need to be updated to:
1. Get Clerk user ID from auth (validate request)
2. Look up mapped Supabase UUID
3. Query with both IDs using `.in('user_id', [clerkId, mappedUuid])`

## Current Status

- Pages updated ✅
- Mapping table ready ✅
- API routes need updating ⏳
