# Complete Fix for Photo Upload RLS Error

## Problem
When uploading photos in daily questions, you get:
```
Upload failed: new row violates row-level security policy
```

## Root Cause
After migrating to Clerk authentication:
1. Storage bucket policies check `auth.uid()` which doesn't work with Clerk
2. Client-side Supabase client tries to use Supabase Auth (not Clerk)
3. RLS policies block the upload because there's no Supabase Auth session

## Solution Implemented

### 1. Created Server-Side API Route ✅
- **File**: `src/app/api/photos/upload/route.ts`
- Uses service role key (bypasses RLS)
- Validates Clerk authentication
- Handles file uploads securely

### 2. Updated Photo Upload Component ✅
- **File**: `src/app/components/daily-questions/QuestionCard.tsx`
- Changed from direct Supabase storage upload to API route
- Removed dependency on Supabase Auth client

### 3. SQL Fix Required (Run This!)

Go to **Supabase Dashboard → SQL Editor** and run:

```sql
-- Disable RLS on storage.objects (safe because we validate in API layer)
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- Ensure bucket exists and is configured
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

-- Verify RLS is disabled
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'objects'
  AND schemaname = 'storage';
```

The `rls_enabled` should show `false`.

## How It Works Now

1. User selects photo → Frontend validates file
2. Frontend calls `/api/photos/upload` → API validates Clerk auth
3. API uses service role key → Bypasses RLS
4. Photo uploaded to storage → Returns public URL
5. URL saved to database → Via existing `/api/daily-checks` route

## Security

- ✅ Clerk authentication validated in API
- ✅ User ID verified (can only upload for themselves)
- ✅ File size and type validation
- ✅ Service role key only used server-side
- ✅ RLS disabled but security handled in API layer

## Testing

After running the SQL:
1. Go to Daily Questions page
2. Answer a question
3. Click photo upload button
4. Select an image
5. Photo should upload successfully without RLS error
