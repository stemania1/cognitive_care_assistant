# Session History User ID Issue

## Problem

The EMG and Thermal history pages are not showing sessions for `corbinaltaicraig@gmail.com` because:

1. **Pages still use Supabase Auth**: The history pages (`emg-history/page.tsx` and `thermal-history/page.tsx`) are still using `safeGetUser()` from Supabase auth, but we migrated to Clerk authentication
2. **User ID mismatch**: The data was stored with Supabase Auth UUIDs (like `550e8400-e29b-41d4-a716-446655440000`), but Clerk users have different IDs (like `user_2abc123def456`)

## Root Cause

### Issue 1: Pages Not Using Clerk

The history pages still have this code:
```typescript
const { user, error } = await safeGetUser(); // ❌ Supabase auth (doesn't work anymore)
if (user?.id) {
  setUserId(user.id);
}
```

Since we migrated to Clerk, `safeGetUser()` returns `null`, so `userId` stays `null` and no sessions load.

### Issue 2: User ID Format Mismatch

- **Old data**: Stored with Supabase Auth UUIDs (e.g., `550e8400-e29b-41d4-a716-446655440000`)
- **New Clerk user**: Has Clerk ID (e.g., `user_2abc123def456`)
- **Result**: Database queries don't match, so old data isn't found

## Solution

### Step 1: Update Pages to Use Clerk ✅

Update the history pages to use Clerk's `useUser()` hook instead of `safeGetUser()`:

```typescript
import { useUser } from '@clerk/nextjs';

export default function EMGHistoryPage() {
  const { user } = useUser(); // ✅ Use Clerk
  
  useEffect(() => {
    if (user?.id) {
      setUserId(user.id);
    }
  }, [user]);
  
  // ... rest of code
}
```

### Step 2: Handle Old Data (User ID Mapping)

For existing data, you have two options:

**Option A: Find the old Supabase UUID and query with it**
- Check Supabase dashboard for the old user UUID
- Manually query with that UUID (but this doesn't solve the long-term problem)

**Option B: Create a user ID mapping table** (recommended)
- Create a table that maps old Supabase UUIDs to new Clerk IDs
- Update queries to check both the Clerk ID and the mapped old UUID
- This allows access to both old and new data

**Option C: Migrate data** (if you have both IDs)
- Update `user_id` in the database from old Supabase UUID to new Clerk ID
- This requires knowing which Clerk user corresponds to which old Supabase user

## Files That Need Updating

1. ✅ `src/app/emg-history/page.tsx` - Update to use Clerk
2. ✅ `src/app/thermal-history/page.tsx` - Update to use Clerk
3. ⏳ Consider creating a user ID mapping system for old data

## Testing

After fixing:
1. ✅ New sessions should save with Clerk user ID
2. ✅ New sessions should appear in history
3. ⚠️ Old sessions (with Supabase UUIDs) won't appear unless you create a mapping
