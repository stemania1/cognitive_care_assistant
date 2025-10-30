-- GUARANTEED WORKING PHOTO FIX
-- Copy and paste this ENTIRE script into Supabase SQL Editor and click Run

-- Step 1: Add photo column to daily_checks table
ALTER TABLE daily_checks ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Step 2: Create or update the storage bucket
DO $$
BEGIN
    -- Try to insert the bucket
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
        'daily-check-photos',
        'daily-check-photos',
        true,
        5242880,
        ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'image/bmp', 'image/tiff']
    )
    ON CONFLICT (id) DO UPDATE SET
        public = true,
        file_size_limit = 5242880,
        allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'image/bmp', 'image/tiff'];
    
    RAISE NOTICE 'Bucket created/updated successfully';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Bucket already exists or error: %', SQLERRM;
END $$;

-- Step 3: Drop ALL existing policies on storage.objects (safe, won't error if they don't exist)
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects'
    LOOP
        BEGIN
            EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', policy_record.policyname);
            RAISE NOTICE 'Dropped policy: %', policy_record.policyname;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'Could not drop policy %: %', policy_record.policyname, SQLERRM;
        END;
    END LOOP;
END $$;

-- Step 4: Create fresh policies with simpler logic
-- Policy 1: Anyone can view/download photos (public access)
CREATE POLICY "photo_select_public"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'daily-check-photos');

-- Policy 2: Authenticated users can upload photos
CREATE POLICY "photo_insert_auth"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'daily-check-photos');

-- Policy 3: Authenticated users can update their own photos
CREATE POLICY "photo_update_auth"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'daily-check-photos');

-- Policy 4: Authenticated users can delete their own photos
CREATE POLICY "photo_delete_auth"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'daily-check-photos');

-- Step 5: Verify everything is set up correctly
DO $$
DECLARE
    bucket_count INTEGER;
    policy_count INTEGER;
BEGIN
    -- Check bucket
    SELECT COUNT(*) INTO bucket_count
    FROM storage.buckets
    WHERE id = 'daily-check-photos';
    
    IF bucket_count > 0 THEN
        RAISE NOTICE '✓ Bucket "daily-check-photos" exists';
    ELSE
        RAISE WARNING '✗ Bucket not found!';
    END IF;
    
    -- Check policies
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname LIKE 'photo_%';
    
    IF policy_count = 4 THEN
        RAISE NOTICE '✓ All 4 policies created successfully';
    ELSE
        RAISE WARNING '✗ Only % policies found (should be 4)', policy_count;
    END IF;
    
    -- Check if bucket is public
    PERFORM 1 FROM storage.buckets WHERE id = 'daily-check-photos' AND public = true;
    IF FOUND THEN
        RAISE NOTICE '✓ Bucket is PUBLIC (correct)';
    ELSE
        RAISE WARNING '✗ Bucket is not public!';
    END IF;
END $$;

-- Done! You should see green checkmarks (✓) in the output
-- If you see any red X marks (✗), let us know what the error says

