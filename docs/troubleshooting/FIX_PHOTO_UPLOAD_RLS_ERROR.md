# Fix Photo Upload RLS Error

## Problem
When uploading a photo in the daily questions, you get the error:
```
new row violates row-level security policy
```

## Solution

### Step 1: Run SQL to Disable RLS
Go to your Supabase dashboard → SQL Editor and run:

```sql
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
```

The `rls_enabled` column should show `false`.

### Step 2: Verify API Route
The API route (`src/app/api/daily-checks/route.ts`) has been updated to:
1. ✅ Validate Clerk authentication
2. ✅ Use service role key (bypasses RLS)
3. ✅ Verify user ID matches authenticated user

### Step 3: Check Storage Policies
If the error persists, it might be a storage bucket issue. Check that the storage bucket policies allow uploads:

```sql
-- Check storage policies
SELECT * FROM storage.policies WHERE bucket_id = 'daily-check-photos';
```

If needed, update storage policies:
```sql
-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload photos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'daily-check-photos');
```

## Why This Happens
After migrating to Clerk, RLS policies that check `auth.uid()` no longer work because Clerk doesn't integrate with Supabase Auth. The solution is to:
1. Disable RLS on tables
2. Handle security in the API layer using Clerk authentication
3. Use service role key for database operations
