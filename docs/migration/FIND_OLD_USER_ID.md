# Finding Old User ID for Data Access

## Goal
Find the old Supabase Auth UUID for `corbinaltaicraig@gmail.com` so they can access their existing EMG and thermal sessions.

## Step 1: Find Unique User IDs in Sessions Tables

Run these queries in Supabase SQL Editor to see what user_ids exist:

```sql
-- Find all unique user_ids in EMG sessions
SELECT DISTINCT user_id, COUNT(*) as session_count 
FROM emg_sessions 
GROUP BY user_id 
ORDER BY session_count DESC;

-- Find all unique user_ids in thermal sessions
SELECT DISTINCT user_id, COUNT(*) as session_count 
FROM thermal_sessions 
GROUP BY user_id 
ORDER BY session_count DESC;
```

This will show you what UUIDs are stored in the database.

## Step 2: Find Which UUID Belongs to corbinaltaicraig@gmail.com

If you still have access to Supabase auth.users table, run:

```sql
SELECT id, email 
FROM auth.users 
WHERE email = 'corbinaltaicraig@gmail.com';
```

This will show the UUID that was used for this email.

## Step 3: Get Clerk User ID

1. Go to Clerk Dashboard: https://dashboard.clerk.com
2. Find the user `corbinaltaicraig@gmail.com`
3. Copy their User ID (looks like `user_2abc123def456`)

## Step 4: Create the Mapping

Run this SQL in Supabase (replace the UUIDs with actual values):

```sql
INSERT INTO user_id_mappings (email, supabase_uuid, clerk_user_id)
VALUES ('corbinaltaicraig@gmail.com', 'OLD_SUPABASE_UUID_HERE', 'CLERK_USER_ID_HERE')
ON CONFLICT (email) DO UPDATE 
SET supabase_uuid = EXCLUDED.supabase_uuid, 
    clerk_user_id = EXCLUDED.clerk_user_id,
    updated_at = NOW();
```

## Alternative: Manual Query Approach

If you can't access auth.users, you can:
1. Look at the UUIDs from Step 1
2. Check the most common UUID (likely the user's data)
3. Temporarily query with that UUID directly

## Next Steps

After creating the mapping, the API routes will be updated to:
1. Get Clerk user ID from auth
2. Look up mapped Supabase UUID
3. Query sessions with both IDs (OR query)
