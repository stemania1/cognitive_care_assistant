-- COMPLETE FIX FOR PHOTO UPLOAD
-- Run this in Supabase SQL Editor to fix the "row-level security policy" error

-- Step 1: Add photo column (if not exists)
ALTER TABLE daily_checks ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Step 2: Ensure storage bucket exists and is PUBLIC
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'daily-check-photos', 
  'daily-check-photos', 
  true,  -- MUST be public
  5242880,  -- 5MB limit
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']
)
ON CONFLICT (id) 
DO UPDATE SET 
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];

-- Step 3: Remove ALL old storage policies for this bucket
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage'
        AND policyname LIKE '%photo%'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
    END LOOP;
END $$;

-- Step 4: Create fresh policies with correct permissions

-- Allow ANYONE (authenticated or not) to SELECT/view photos
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'daily-check-photos');

-- Allow authenticated users to INSERT photos
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'daily-check-photos');

-- Allow authenticated users to UPDATE their own photos
CREATE POLICY "Users can update own photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'daily-check-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow authenticated users to DELETE their own photos  
CREATE POLICY "Users can delete own photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'daily-check-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Step 5: Verify setup
SELECT 
  'Bucket created: ' || COUNT(*) as status
FROM storage.buckets 
WHERE id = 'daily-check-photos';

SELECT 
  'Policies created: ' || COUNT(*) as status
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND (policyname LIKE '%Public Access%' 
     OR policyname LIKE '%Authenticated users can upload%'
     OR policyname LIKE '%Users can update own photos%'
     OR policyname LIKE '%Users can delete own photos%');

-- Done! You should see:
-- "Bucket created: 1"
-- "Policies created: 4"

