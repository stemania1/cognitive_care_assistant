# Clerk Authentication Migration Guide

This document outlines the migration from Supabase Auth to Clerk authentication.

## Migration Status

- ✅ Clerk package installed (`@clerk/nextjs@6.36.7`)
- ✅ Middleware created (`middleware.ts`)
- ✅ Layout updated with `ClerkProvider`
- ⏳ Sign-in page migration (in progress)
- ⏳ Sign-up page migration (pending)
- ⏳ Sign-out page migration (pending)
- ⏳ API routes migration (pending)
- ⏳ Page components migration (pending)
- ⏳ Guest account handling (pending - Clerk doesn't support anonymous auth natively)

## Setup Steps

### 1. Get Clerk API Keys

1. Go to https://dashboard.clerk.com
2. Create a new application (or use existing)
3. Copy your **Publishable Key** and **Secret Key**

### 2. Add Environment Variables

Add to `.env.local`:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

### 3. Configure Clerk Dashboard

- Set up sign-in methods (email/password, social, etc.)
- Configure redirect URLs:
  - After sign-in: `http://localhost:3000/dashboard`
  - After sign-up: `http://localhost:3000/dashboard`
  - Sign-in URL: `http://localhost:3000/signin`
  - Sign-up URL: `http://localhost:3000/signup`

## Key Differences from Supabase

### User ID Format
- **Supabase**: UUID format (e.g., `550e8400-e29b-41d4-a716-446655440000`)
- **Clerk**: String format (e.g., `user_2abc123def456`)

### User Object Structure
- **Supabase**: `user.id`, `user.email`, `user.user_metadata`
- **Clerk**: `user.id`, `user.emailAddresses[0].emailAddress`, `user.publicMetadata`, `user.unsafeMetadata`

### Server-Side Authentication
- **Supabase**: `supabase.auth.getUser()` or `supabase.auth.getSession()`
- **Clerk**: `auth()` or `currentUser()` from `@clerk/nextjs/server`

### Client-Side Authentication
- **Supabase**: `supabase.auth.getUser()` or `supabase.auth.onAuthStateChange()`
- **Clerk**: `useUser()` or `useAuth()` from `@clerk/nextjs`

## Migration Checklist

### Frontend Components
- [ ] Sign-in page (`src/app/signin/page.tsx`)
- [ ] Sign-up page (`src/app/signup/page.tsx`)
- [ ] Sign-out page (`src/app/signout/page.tsx`)
- [ ] UserStatusIndicator (`src/app/components/UserStatusIndicator.tsx`)
- [ ] AuthenticationGuard (`src/app/components/daily-questions/AuthenticationGuard.tsx`)
- [ ] GuestIndicator (`src/app/components/GuestIndicator.tsx`)

### Pages
- [ ] Dashboard (`src/app/dashboard/page.tsx`)
- [ ] Daily Questions (`src/app/daily-questions/page.tsx`)
- [ ] EMG (`src/app/emg/page.tsx`)
- [ ] EMG History (`src/app/emg-history/page.tsx`)
- [ ] Sleep Behaviors (`src/app/sleepbehaviors/page.tsx`)
- [ ] Thermal History (`src/app/thermal-history/page.tsx`)
- [ ] Photo Album (`src/app/photo-album/page.tsx`)
- [ ] Questions History (`src/app/questions/history/page.tsx`)

### API Routes
- [ ] Daily Checks (`src/app/api/daily-checks/route.ts`)
- [ ] Daily Check Sessions (`src/app/api/daily-check-sessions/route.ts`)
- [ ] EMG Sessions (`src/app/api/emg-sessions/route.ts`)
- [ ] Thermal Sessions (`src/app/api/thermal-sessions/route.ts`)
- [ ] All other API routes that check authentication

### Utilities
- [x] Clerk auth utilities (`src/lib/clerk-auth.ts`) - Created
- [ ] Update guest data manager (if keeping guest support)
- [ ] Update Supabase queries to use Clerk user IDs

### Database Considerations

**Important**: Clerk user IDs are different from Supabase user IDs. If you have existing data:

1. **Option 1**: Migrate user data (add `clerk_user_id` column, map old IDs to new IDs)
2. **Option 2**: Start fresh (users sign up again with Clerk)
3. **Option 3**: Keep Supabase for data storage, use Clerk only for auth (requires syncing user IDs)

## Guest Account Handling

Clerk doesn't support anonymous authentication natively. Options:

1. **Remove guest accounts** (recommended for production)
2. **Use Clerk's experimental features** (if available)
3. **Keep local storage guest system** (current fallback) - but won't sync with Clerk

## Testing

After migration, test:
- [ ] Sign up new user
- [ ] Sign in existing user
- [ ] Sign out
- [ ] Protected routes redirect to sign-in
- [ ] Public routes accessible without auth
- [ ] API routes validate Clerk tokens
- [ ] User data persists correctly

## Rollback Plan

If migration needs to be rolled back:
1. Remove Clerk middleware
2. Remove ClerkProvider from layout
3. Restore Supabase auth code
4. Update environment variables

## Documentation

- Clerk Next.js Docs: https://clerk.com/docs/nextjs/overview
- Clerk Quickstart: https://clerk.com/docs/quickstarts/nextjs
- Clerk Customization: https://clerk.com/docs/customization/overview

