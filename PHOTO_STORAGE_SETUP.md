# Photo Storage Setup Guide

This guide will help you set up photo storage for the daily questions feature.

## Prerequisites
- Active Supabase project
- Database access (via Supabase SQL Editor or CLI)

## Setup Steps

### Option 1: Using Supabase Dashboard (Easiest)

1. **Go to your Supabase Dashboard**
   - Navigate to https://supabase.com/dashboard
   - Select your project

2. **Create Storage Bucket**
   - Go to "Storage" in the left sidebar
   - Click "Create bucket"
   - Bucket name: `daily-check-photos`
   - Make it **Public**: Toggle "Public bucket" to ON
   - Click "Create bucket"

3. **Set Up Storage Policies**
   - Click on the `daily-check-photos` bucket
   - Go to "Policies" tab
   - Add these policies:

   **Policy 1: Upload Policy**
   - Click "New Policy"
   - Name: "Authenticated users can upload"
   - Target roles: `authenticated`
   - Operation: `INSERT`
   - Definition: `bucket_id = 'daily-check-photos'`

   **Policy 2: View Policy**
   - Click "New Policy"
   - Name: "Anyone can view photos"
   - Target roles: `public`
   - Operation: `SELECT`
   - Definition: `bucket_id = 'daily-check-photos'`

   **Policy 3: Delete Policy**
   - Click "New Policy"
   - Name: "Users can delete their own photos"
   - Target roles: `authenticated`
   - Operation: `DELETE`
   - Definition: `bucket_id = 'daily-check-photos' AND auth.uid()::text = (storage.foldername(name))[1]`

4. **Update Database Table**
   - Go to "SQL Editor"
   - Run this query:
   ```sql
   ALTER TABLE daily_checks ADD COLUMN IF NOT EXISTS photo_url TEXT;
   ```

### Option 2: Using SQL Migration

1. **Go to SQL Editor** in your Supabase Dashboard

2. **Run the migration file**:
   - Copy the contents of `supabase/migrations/003_add_photo_support.sql`
   - Paste into SQL Editor
   - Click "Run"

### Option 3: Using Supabase CLI

If you have Supabase CLI installed:

```bash
supabase db push
```

This will apply all migrations including the photo storage setup.

## Verification

After setup, verify it works:

1. Sign in to your app
2. Go to Daily Questions
3. Try uploading a photo (any image file under 5MB)
4. The upload should succeed without errors

## Troubleshooting

### Error: "Storage not set up"
- The storage bucket hasn't been created
- Follow the setup steps above

### Error: "Upload failed: new row violates row-level security"
- Storage policies aren't set up correctly
- Check that you're signed in
- Verify the policies in Step 3 above

### Error: "Photo is too big"
- Maximum file size is 5MB
- Compress your image or choose a smaller one

### Photos not appearing in Photo Album
- Make sure you clicked "Save Answers" after uploading
- Check that the photo uploaded successfully (no red error message)
- Refresh the Photo Album page

## Environment Variables

Make sure these are set in your `.env.local` (local) and Vercel dashboard (production):

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Notes

- Photos are stored in Supabase Storage (free tier includes 1GB)
- Each user's photos are organized in their own folder (by user ID)
- Photos are publicly viewable but only deletable by the owner
- Old photos can be manually deleted from Supabase Storage dashboard if needed

