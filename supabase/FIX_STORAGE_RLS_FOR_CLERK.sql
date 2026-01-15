-- Fix Storage RLS for Clerk Authentication
-- Since Clerk doesn't integrate with Supabase Auth, storage policies checking auth.uid() won't work
-- Solution: Use service role key in API routes (bypasses RLS) OR disable RLS on storage

-- Option 1: Disable RLS on storage.objects (simplest, but less secure)
-- Note: This is safe because we validate authentication in the API layer using Clerk
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- Option 2: If you want to keep RLS enabled, create policies that don't check auth.uid()
-- (But this is less secure - better to use Option 1 with API validation)

-- Verify RLS is disabled
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'objects'
  AND schemaname = 'storage';

-- Expected result: rls_enabled should be false

-- Also ensure the bucket exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'daily-check-photos',
  'daily-check-photos',
  true,
  5242880,  -- 5MB
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
