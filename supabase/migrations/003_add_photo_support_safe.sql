-- Safe migration that won't fail if already run

-- Add photo URL support to daily_checks table (safe if already exists)
ALTER TABLE daily_checks ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Create storage bucket for daily check photos if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('daily-check-photos', 'daily-check-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Authenticated users can upload photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own photos" ON storage.objects;

-- Create storage policy to allow authenticated users to upload photos
CREATE POLICY "Authenticated users can upload photos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'daily-check-photos');

-- Create storage policy to allow users to view photos
CREATE POLICY "Anyone can view photos" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'daily-check-photos');

-- Create storage policy to allow users to delete their own photos
CREATE POLICY "Users can delete their own photos" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'daily-check-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

