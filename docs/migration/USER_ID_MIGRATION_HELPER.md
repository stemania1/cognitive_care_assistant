# User ID Migration Helper

## Goal
Allow `corbinaltaicraig@gmail.com` (Clerk user) to access EMG and thermal sessions stored with old Supabase Auth UUID.

## Approach

### Option 1: Direct Database Query (Simplest)
Query the database directly to find what `user_id` values exist in the sessions tables, then we can:
1. Get the Clerk user ID for the email
2. Query with both IDs (OR query) OR create a mapping

### Option 2: User ID Mapping Table
Create a `user_id_mappings` table:
```sql
CREATE TABLE user_id_mappings (
  email TEXT PRIMARY KEY,
  supabase_uuid TEXT,
  clerk_user_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

Then update API routes to:
1. Get Clerk user ID
2. Look up mapped Supabase UUID
3. Query with both IDs

### Option 3: Email-Based Lookup (If possible)
If we can query Supabase auth.users table, find the UUID for the email, then query sessions with that UUID.

## Recommended: Option 1 with API Enhancement

Since we can't easily map emails to old Supabase UUIDs, and we want to preserve existing data:

1. **Update history pages to use Clerk** ✅
2. **Enhance API routes** to:
   - Accept Clerk user ID (from auth)
   - Also accept a `legacyUserId` parameter (for old Supabase UUIDs)
   - Query with OR condition: `WHERE user_id = clerk_id OR user_id = legacy_uuid`
   - OR: Create a helper that allows querying by email → finds old UUID → queries with both

But wait - we need to know what the old UUID is. Let me create a SQL query to find unique user_ids in the sessions tables.
