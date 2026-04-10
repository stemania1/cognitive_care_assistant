# Clerk + Supabase Database Migration Guide

## Overview

After migrating from Supabase Auth to Clerk authentication, you need to update your Supabase database RLS (Row Level Security) policies because Clerk doesn't integrate with Supabase Auth.

## The Problem

Your database tables have RLS policies that reference `auth.uid()` (Supabase Auth), but Clerk authentication doesn't use Supabase Auth. This means:

- RLS policies won't work with Clerk user IDs
- Database queries may fail or return no results
- Security needs to be handled differently

## Solution

We've disabled RLS on the affected tables and moved security to the API layer. This is a common pattern when using external authentication providers.

### Migration File

Run the migration: `supabase/migrations/013_update_rls_for_clerk.sql`

This migration:
1. Drops all RLS policies that reference `auth.uid()`
2. Disables RLS on affected tables:
   - `daily_checks`
   - `daily_check_sessions`
   - `thermal_sessions`
   - `emg_sessions`

### Security Model

Security is now handled in three layers:

1. **Clerk Authentication** - Verifies user identity
2. **API Route Validation** - Checks that `user_id` matches authenticated Clerk user
3. **Service Role Key** - Used for database access (bypasses RLS)

### How to Apply the Migration

#### Option 1: Using Supabase CLI

```bash
supabase db push
```

#### Option 2: Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `supabase/migrations/013_update_rls_for_clerk.sql`
4. Paste and run the SQL

#### Option 3: Direct SQL Execution

1. Connect to your Supabase database
2. Run the migration SQL file

### Verification

After running the migration, verify RLS is disabled:

```sql
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename IN ('daily_checks', 'daily_check_sessions', 'thermal_sessions', 'emg_sessions')
  AND schemaname = 'public';
```

All tables should show `rowsecurity = false`.

### Important Notes

1. **API Routes Must Validate User IDs**
   - All API routes should verify that the `user_id` in requests matches the authenticated Clerk user
   - Example: `if (userId !== clerkUserId) return unauthorized`

2. **Service Role Key Security**
   - The service role key bypasses RLS
   - Keep it secret and never expose it in client-side code
   - Only use it in server-side API routes

3. **Existing Data**
   - Existing data with Supabase Auth UUIDs will still work
   - New Clerk users will have string IDs like `user_2abc123def456`
   - Both formats are supported since `user_id` columns are TEXT

4. **No User Migration Needed**
   - You don't need to migrate existing user data
   - Old Supabase Auth UUIDs will remain in the database
   - New Clerk users will have Clerk IDs
   - The API layer handles both formats

### Testing

After migration, test:

1. ✅ Sign in with Clerk
2. ✅ Create new daily check (should save with Clerk user ID)
3. ✅ View your own data (API should filter by Clerk user ID)
4. ✅ Cannot access other users' data (API validation)
5. ✅ Existing data still accessible (if you have Supabase Auth UUIDs)

### Rollback

If you need to rollback:

```sql
-- Re-enable RLS
ALTER TABLE daily_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_check_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE thermal_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE emg_sessions ENABLE ROW LEVEL SECURITY;

-- Recreate policies (you'll need to restore from backup or recreate manually)
-- See original migration files for policy definitions
```

## Related Files

- Migration: `supabase/migrations/013_update_rls_for_clerk.sql`
- Clerk Auth Utils: `src/lib/clerk-auth.ts`
- API Routes: All routes in `src/app/api/` that use `user_id`

## Questions?

- See `CLERK_MIGRATION.md` for general Clerk migration info
- See `REQUIRED_API_KEYS.md` for environment variable setup
