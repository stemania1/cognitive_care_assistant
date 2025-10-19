-- VIDEO STORAGE SETUP
-- Run this in Supabase SQL Editor to set up video storage

-- Step 1: Create video storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'workout-videos', 
  'workout-videos', 
  true,  -- Public bucket
  52428800,  -- 50MB limit (50 * 1024 * 1024)
  ARRAY['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime']
)
ON CONFLICT (id) 
DO UPDATE SET 
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];

-- Step 2: Remove any existing policies for workout-videos bucket
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage'
        AND policyname LIKE '%workout%'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
    END LOOP;
END $$;

-- Step 3: Create policies for video storage

-- Allow ANYONE to view videos (public access)
CREATE POLICY "Public video access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'workout-videos');

-- Allow service role to upload videos (for admin operations)
CREATE POLICY "Service role can upload videos"
ON storage.objects FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'workout-videos');

-- Allow service role to update videos
CREATE POLICY "Service role can update videos"
ON storage.objects FOR UPDATE
TO service_role
USING (bucket_id = 'workout-videos');

-- Allow service role to delete videos
CREATE POLICY "Service role can delete videos"
ON storage.objects FOR DELETE
TO service_role
USING (bucket_id = 'workout-videos');

-- Done! Video storage is ready.
