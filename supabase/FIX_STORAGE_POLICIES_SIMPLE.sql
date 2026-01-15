-- Fix Storage Policies for Clerk Authentication
-- This version safely handles existing policies

-- Step 1: Ensure the bucket exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'daily-check-photos',
  'daily-check-photos',
  true,
  5242880,
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];

-- Step 2: Drop ALL existing policies for this bucket (safe - won't error if they don't exist)
DROP POLICY IF EXISTS "photo_select_public" ON storage.objects;
DROP POLICY IF EXISTS "photo_insert_allowed" ON storage.objects;
DROP POLICY IF EXISTS "photo_delete_allowed" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own photos" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own photos" ON storage.objects;

-- Step 3: Create new policies
-- Allow public viewing
CREATE POLICY "photo_select_public"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'daily-check-photos');

-- Allow authenticated users to insert (service role bypasses this anyway)
CREATE POLICY "photo_insert_allowed"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'daily-check-photos');

-- Allow authenticated users to delete
CREATE POLICY "photo_delete_allowed"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'daily-check-photos');

-- Done! The service role key in your API route will bypass these policies anyway.
