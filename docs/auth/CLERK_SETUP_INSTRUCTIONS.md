# Clerk Setup Instructions

## Current Status

✅ Clerk package installed  
✅ Middleware configured  
✅ Layout updated with ClerkProvider  
⚠️ **API keys required** - Build will fail until keys are added

## Quick Setup

### Step 1: Get Your Clerk API Keys

1. Go to https://dashboard.clerk.com
2. Sign in or create an account
3. Create a new application (or use existing)
4. Go to **API Keys** section
5. Copy your:
   - **Publishable Key** (starts with `pk_test_` or `pk_live_`)
   - **Secret Key** (starts with `sk_test_` or `sk_live_`)

### Step 2: Add Environment Variables

Create or update `.env.local` in the root directory:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxx
CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxx
```

### Step 3: Configure Clerk Dashboard

1. Go to **User & Authentication** → **Email, Phone, Username**
2. Enable the sign-in methods you want (Email is recommended)
3. Go to **Paths**
4. Configure redirect URLs:
   - **After sign-in**: `http://localhost:3000/dashboard`
   - **After sign-up**: `http://localhost:3000/dashboard`
   - **Sign-in URL**: `http://localhost:3000/signin`
   - **Sign-up URL**: `http://localhost:3000/signup`

### Step 4: Test the Build

After adding the keys, restart your dev server:

```bash
npm run dev
```

Or test the build:

```bash
npm run build
```

## What's Been Set Up

1. **middleware.ts** - Protects routes and handles authentication
2. **src/app/layout.tsx** - Wrapped with ClerkProvider
3. **src/lib/clerk-auth.ts** - Helper functions for server-side auth

## Next Steps

After adding API keys and verifying the build works:

1. ✅ Get API keys (you're here)
2. ⏳ Update sign-in page to use Clerk
3. ⏳ Update sign-up page to use Clerk  
4. ⏳ Update sign-out page to use Clerk
5. ⏳ Update API routes to use Clerk auth
6. ⏳ Update pages to use Clerk hooks

See `CLERK_MIGRATION.md` for complete migration details.

## Troubleshooting

### Build Error: "Missing publishableKey"

**Solution**: Add `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` to `.env.local`

### Runtime Error: "ClerkProvider must be used within..."

**Solution**: Make sure `ClerkProvider` wraps your app in `layout.tsx` (already done)

### Sign-in/Sign-up not working

**Solution**: 
1. Check API keys are correct
2. Check redirect URLs match Clerk dashboard settings
3. Check browser console for errors

## Documentation

- Clerk Dashboard: https://dashboard.clerk.com
- Clerk Docs: https://clerk.com/docs
- Next.js Integration: https://clerk.com/docs/nextjs/overview

