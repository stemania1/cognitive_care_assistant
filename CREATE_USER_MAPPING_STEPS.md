# Steps to Create User Mapping for corbinaltaicraig@gmail.com

## Step 1: Find the Old Supabase UUID (Where the data is stored)

Run these queries in Supabase SQL Editor to see what user_ids exist in your sessions:

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

**Look for the UUID that has the most sessions** - that's likely the one for corbinaltaicraig@gmail.com.

The UUID will look like: `550e8400-e29b-41d4-a716-446655440000`

## Step 2: Get the Clerk User ID

1. Go to https://dashboard.clerk.com
2. Click on **Users** in the sidebar
3. Search for `corbinaltaicraig@gmail.com`
4. Click on the user
5. Copy the **User ID** (looks like `user_2abc123def456`)

## Step 3: Create the Mapping

Once you have both IDs, run this SQL in Supabase (replace the placeholders with actual values):

```sql
INSERT INTO user_id_mappings (email, supabase_uuid, clerk_user_id)
VALUES (
  'corbinaltaicraig@gmail.com', 
  'PASTE_OLD_SUPABASE_UUID_HERE',  -- From Step 1
  'PASTE_CLERK_USER_ID_HERE'       -- From Step 2
)
ON CONFLICT (email) DO UPDATE 
SET supabase_uuid = EXCLUDED.supabase_uuid, 
    clerk_user_id = EXCLUDED.clerk_user_id,
    updated_at = NOW();
```

## Step 4: Verify the Mapping

Check that the mapping was created:

```sql
SELECT * FROM user_id_mappings WHERE email = 'corbinaltaicraig@gmail.com';
```

You should see one row with both IDs.

## What Happens Next

After you create the mapping, I'll update the API routes to:
1. Get the Clerk user ID from authentication
2. Look up the mapped Supabase UUID
3. Query sessions with BOTH IDs (so old and new data is accessible)
