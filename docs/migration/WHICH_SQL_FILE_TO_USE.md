# Which SQL File Should I Use?

If you're getting errors about photo uploads, use **ONE** of these files:

## ✅ RECOMMENDED: PHOTO_ONLY_FIX.sql

**Use this if you're getting the RLS policy error when uploading photos.**

This file ONLY sets up photo storage and nothing else. It won't touch any other tables or policies.

**Steps:**
1. Open `PHOTO_ONLY_FIX.sql`
2. Copy ALL the contents
3. Go to Supabase Dashboard → SQL Editor
4. Paste and click "Run"
5. Try uploading your photo again

## Other Files (Don't use these unless instructed):

- `003_add_photo_support.sql` - Original migration (may conflict with existing setup)
- `003_add_photo_support_safe.sql` - Safe version but more complex
- `QUICK_PHOTO_SETUP.sql` - Alternative approach
- `FIX_PHOTO_UPLOAD.sql` - Comprehensive fix (may cause policy conflicts)

## If You See: "policy already exists"

This means you already have some policies set up. Use `PHOTO_ONLY_FIX.sql` instead - it drops and recreates only the photo-related policies.

## After Running the Fix

1. Refresh your browser
2. Go to Daily Questions
3. Try uploading a photo
4. It should work! ✅

## Still Having Issues?

Check the browser console (F12) for error messages and let us know what it says.

