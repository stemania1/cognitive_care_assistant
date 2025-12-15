# EMG Sessions Migration Verification Guide

This guide will help you verify that the EMG sessions table migration has been properly applied in Supabase.

## Quick Verification Steps

### 1. Use the Verification Button (Easiest)

1. Go to the EMG page (`/emg`)
2. Click the **"Verify Setup"** button next to "View History"
3. Check the browser console (F12) for detailed results
4. The alert will tell you if all checks passed or failed

### 2. Manual Verification via Supabase Dashboard

1. **Go to Supabase Dashboard**
   - Navigate to https://supabase.com/dashboard
   - Select your project

2. **Check if Table Exists**
   - Go to "Table Editor" in the left sidebar
   - Look for `emg_sessions` table
   - If it doesn't exist, the migration hasn't been run

3. **Verify Table Structure**
   The table should have these columns:
   - `id` (UUID, primary key)
   - `user_id` (TEXT, not null)
   - `session_name` (TEXT, not null, default: 'Untitled Session')
   - `started_at` (TIMESTAMPTZ, not null)
   - `ended_at` (TIMESTAMPTZ)
   - `duration_seconds` (INTEGER)
   - `readings` (JSONB)
   - `average_voltage` (FLOAT)
   - `max_voltage` (FLOAT)
   - `created_at` (TIMESTAMPTZ, not null)

4. **Check RLS Policies**
   - Go to "Authentication" → "Policies"
   - Filter by table: `emg_sessions`
   - You should see 4 policies:
     - "Users can view their own EMG sessions" (SELECT)
     - "Users can insert their own EMG sessions" (INSERT)
     - "Users can update their own EMG sessions" (UPDATE)
     - "Users can delete their own EMG sessions" (DELETE)

5. **Run the Migration Manually (if needed)**
   - Go to "SQL Editor" in Supabase Dashboard
   - Copy the contents of `supabase/migrations/010_create_emg_sessions_table.sql`
   - Paste into SQL Editor
   - Click "Run"
   - Check for any errors

### 3. Verify Environment Variables

Check that your `.env.local` file has:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**Important**: The service role key is different from the anon key. You can find it in:
- Supabase Dashboard → Settings → API → `service_role` key (secret)

### 4. Test the API Endpoint Directly

Open your browser console and run:

```javascript
fetch('/api/emg-sessions/verify')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
```

This will show detailed diagnostic information.

## Common Issues and Solutions

### Issue: "Service role key not configured"

**Solution**: 
1. Check your `.env.local` file exists
2. Verify `SUPABASE_SERVICE_ROLE_KEY` is set
3. Restart your Next.js dev server after adding/changing env vars
4. Make sure you're using the `service_role` key, not the `anon` key

### Issue: "Table does not exist"

**Solution**:
1. Run the migration manually in Supabase SQL Editor
2. Copy contents of `supabase/migrations/010_create_emg_sessions_table.sql`
3. Paste and run in SQL Editor

### Issue: "RLS policy error" or "permission denied"

**Solution**:
1. Check that RLS policies exist (see step 4 above)
2. Verify policies allow `user_id = 'guest'` for inserts
3. The API uses service role key to bypass RLS, so this shouldn't be an issue if configured correctly

### Issue: "Failed to save" but no specific error

**Solution**:
1. Check browser console for detailed error logs
2. Check server logs (terminal where `npm run dev` is running)
3. Use the verification endpoint to see what's failing
4. Try saving again and watch the console output

### Issue: Recording saves but doesn't appear in history

**Solution**:
1. Check that you're using the same `userId` when saving and loading
2. Verify the `user_id` column in the database matches your user ID
3. Check browser console for errors when loading sessions
4. Try clicking "Refresh" on the history page

## Debugging Save Failures

When you click "Save to Cloud", check:

1. **Browser Console** (F12):
   - Look for `💾 Saving recording:` log
   - Look for `📤 Sending session data to API:` log
   - Look for `📥 API Response:` log
   - Look for any error messages

2. **Server Logs** (terminal):
   - Look for `📝 Inserting EMG session:` log
   - Look for `❌ Error inserting EMG session:` log
   - Look for `✅ EMG session inserted successfully:` log

3. **Network Tab** (F12 → Network):
   - Find the POST request to `/api/emg-sessions`
   - Check the request payload
   - Check the response status and body

## Next Steps After Verification

1. If all checks pass, try recording and saving again
2. If checks fail, follow the solutions above
3. If still having issues, check the detailed error messages in console/logs
4. Verify the migration was run in the correct Supabase project (if you have multiple)

## Manual SQL Check

You can also run this SQL in Supabase SQL Editor to check everything:

```sql
-- Check if table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'emg_sessions'
);

-- Check table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'emg_sessions'
ORDER BY ordinal_position;

-- Check RLS policies
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'emg_sessions';

-- Check if RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'emg_sessions';
```





