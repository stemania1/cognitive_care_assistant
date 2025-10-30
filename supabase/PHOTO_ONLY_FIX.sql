-- MINIMAL PHOTO-ONLY FIX
-- This ONLY sets up photo storage and nothing else
-- Run this in Supabase SQL Editor

-- Step 1: Add photo column
ALTER TABLE daily_checks ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Step 2: Create bucket (public, with file size limit)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'daily-check-photos', 
  'daily-check-photos', 
  true,
  5242880,
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']
)
ON CONFLICT (id) 
DO UPDATE SET 
  public = true,
  file_size_limit = 5242880;

-- Step 3: Drop only photo-related policies (ignore errors if they don't exist)
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own photos" ON storage.objects;

-- Step 4: Create fresh policies for photo storage only
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'daily-check-photos');

CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT  
TO authenticated
WITH CHECK (bucket_id = 'daily-check-photos');

CREATE POLICY "Users can update own photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'daily-check-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'daily-check-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Done! Photo upload should work now.

