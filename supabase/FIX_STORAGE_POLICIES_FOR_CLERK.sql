-- Fix Storage Policies for Clerk Authentication
-- Since we can't disable RLS on storage.objects (requires owner permissions),
-- we'll create policies that work with the service role key approach

-- Step 1: Ensure the bucket exists
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

-- Step 2: Drop existing policies for this bucket (if they exist)
DROP POLICY IF EXISTS "Authenticated users can upload photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own photos" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own photos" ON storage.objects;

-- Step 3: Create new policies that allow service role operations
-- These policies are permissive enough to work with service role key

-- Allow anyone to view photos (public bucket)
CREATE POLICY "photo_select_public"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'daily-check-photos');

-- Allow service role and authenticated users to insert
-- Service role key will bypass this, but we include it for completeness
CREATE POLICY "photo_insert_allowed"
ON storage.objects
FOR INSERT
TO authenticated, service_role
WITH CHECK (bucket_id = 'daily-check-photos');

-- Allow service role and authenticated users to delete
CREATE POLICY "photo_delete_allowed"
ON storage.objects
FOR DELETE
TO authenticated, service_role
USING (bucket_id = 'daily-check-photos');

-- Note: The API route uses service role key which bypasses RLS,
-- but these policies provide fallback for direct client access if needed
