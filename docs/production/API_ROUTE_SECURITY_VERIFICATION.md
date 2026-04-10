# API Route Security Verification - Clerk User ID Validation

## ❌ Critical Security Issue Found

**Status:** API routes are NOT validating Clerk user IDs

## The Problem

All API routes that use `userId` are accepting it from request parameters/body **without verifying** it matches the authenticated Clerk user. This means:

- Any authenticated user could access/modify any other user's data
- Security vulnerability: users can pass a different `userId` to access other accounts
- No validation between requested `userId` and authenticated Clerk user ID

## Affected Routes

### ❌ Routes Missing Validation:

1. **`/api/daily-checks`** (GET, POST, DELETE)
   - Accepts `userId` from query params or body
   - No validation against Clerk auth

2. **`/api/daily-check-sessions`** (GET, POST, DELETE)
   - Accepts `userId` from query params or body
   - No validation against Clerk auth

3. **`/api/thermal-sessions`** (GET, POST, PUT, DELETE)
   - Accepts `userId` from query params or body
   - No validation against Clerk auth

4. **`/api/emg-sessions`** (GET, POST, PUT, DELETE)
   - Accepts `userId` from query params or body
   - No validation against Clerk auth

## Solution

I've added a validation helper function: `validateUserId()` in `src/lib/clerk-auth.ts`

### How to Fix Each Route

For each API route, add validation like this:

```typescript
import { validateUserId } from '@/lib/clerk-auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    // ✅ Add this validation
    try {
      await validateUserId(userId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unauthorized';
      if (message.includes('Unauthorized')) {
        return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
      }
      if (message.includes('Forbidden')) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
      return NextResponse.json({ error: message }, { status: 400 });
    }
    
    // ... rest of route logic
  } catch (error) {
    // ... error handling
  }
}
```

Or simpler pattern:

```typescript
import { validateUserId, getClerkUserId } from '@/lib/clerk-auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const requestedUserId = searchParams.get('userId');
    
    // ✅ Validate userId matches authenticated user
    const authenticatedUserId = await getClerkUserId();
    if (!authenticatedUserId) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }
    if (requestedUserId !== authenticatedUserId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    // Use authenticatedUserId (or requestedUserId - they're the same now)
    const userId = authenticatedUserId;
    
    // ... rest of route logic
  } catch (error) {
    // ... error handling
  }
}
```

## Next Steps

1. ✅ **Helper function created** - `validateUserId()` in `src/lib/clerk-auth.ts`
2. ⏳ **Update `/api/daily-checks/route.ts`** - Add validation to GET, POST, DELETE
3. ⏳ **Update `/api/daily-check-sessions/route.ts`** - Add validation to GET, POST, DELETE
4. ⏳ **Update `/api/thermal-sessions/route.ts`** - Add validation to GET, POST, PUT, DELETE
5. ⏳ **Update `/api/emg-sessions/route.ts`** - Add validation to GET, POST, PUT, DELETE

## Testing

After adding validation, test:

1. ✅ Authenticated user can access their own data
2. ✅ Authenticated user gets 403 when trying to access another user's data
3. ✅ Unauthenticated user gets 401
4. ✅ Missing userId parameter returns 400

## Notes

- Since RLS is disabled, **API route validation is the ONLY security layer**
- This is critical - without this validation, the database is completely insecure
- The validation should be added to ALL routes that use `userId`
