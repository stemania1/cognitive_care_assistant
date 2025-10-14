-- QUICK PHOTO SETUP
-- Copy and paste this into Supabase SQL Editor and click "Run"

-- Step 1: Add photo column to table (safe if already exists)
ALTER TABLE daily_checks ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Step 2: Create storage bucket (safe if already exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('daily-check-photos', 'daily-check-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Step 3: Set up storage policies (remove old ones first to avoid conflicts)
DO $$
BEGIN
    -- Drop policies if they exist
    DROP POLICY IF EXISTS "Authenticated users can upload photos" ON storage.objects;
    DROP POLICY IF EXISTS "Anyone can view photos" ON storage.objects;
    DROP POLICY IF EXISTS "Users can delete their own photos" ON storage.objects;
    
    -- Create new policies
    CREATE POLICY "Authenticated users can upload photos" ON storage.objects
      FOR INSERT TO authenticated
      WITH CHECK (bucket_id = 'daily-check-photos');
    
    CREATE POLICY "Anyone can view photos" ON storage.objects
      FOR SELECT TO public
      USING (bucket_id = 'daily-check-photos');
    
    CREATE POLICY "Users can delete their own photos" ON storage.objects
      FOR DELETE TO authenticated
      USING (bucket_id = 'daily-check-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
END $$;

-- Done! You can now upload photos in the daily questions.

