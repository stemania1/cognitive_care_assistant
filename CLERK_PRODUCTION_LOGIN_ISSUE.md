# Clerk Production Login Issue

## Problem
User `corbinaltaicraig@gmail.com` can log in on localhost but not in production.

## Common Causes

### 1. Production API Keys Not Set

Production environment needs Clerk API keys. Make sure your production environment (Vercel, etc.) has:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...  (production key, not test)
CLERK_SECRET_KEY=sk_live_...  (production key, not test)
```

**Important:** 
- Use `pk_live_` and `sk_live_` keys for production (not `pk_test_` / `sk_test_`)
- These are different from your development keys

### 2. Production Domain Not Configured in Clerk

Clerk needs your production domain in the allowed origins/redirect URLs.

**Steps:**
1. Go to Clerk Dashboard: https://dashboard.clerk.com
2. Select your application
3. Go to **Paths** (or **Configure** → **Paths**)
4. Add your production URLs:
   - **After sign-in:** `https://your-production-domain.com/dashboard`
   - **After sign-up:** `https://your-production-domain.com/dashboard`
   - **Sign-in URL:** `https://your-production-domain.com/signin`
   - **Sign-up URL:** `https://your-production-domain.com/signup`
   - **Unauthorized sign in URL:** `https://your-production-domain.com/signin`

5. Go to **Allowlist** or **Allowed Origins** (if visible)
   - Add: `https://your-production-domain.com`

### 3. Using Test Keys in Production

**Development keys (`pk_test_`, `sk_test_`):**
- Only work for development/localhost
- Have usage limits
- Should NOT be used in production

**Production keys (`pk_live_`, `sk_live_`):**
- Required for production
- No usage limits
- Must be obtained from Clerk Dashboard (separate from test keys)

### 4. Clerk Application Environment Mismatch

If you have separate Clerk applications for dev/prod:
- Make sure production is using the correct application's keys
- Verify the user exists in the production Clerk application

### 5. CORS/Origin Issues

If you see CORS errors:
- Make sure production domain is in Clerk's allowed origins
- Check browser console for specific error messages

## How to Get Production Keys

1. Go to Clerk Dashboard: https://dashboard.clerk.com
2. Select your application
3. Go to **API Keys**
4. You'll see two sets of keys:
   - **Test keys** (`pk_test_`, `sk_test_`) - for development
   - **Production keys** (`pk_live_`, `sk_live_`) - for production

5. Copy the production keys
6. Add them to your production environment variables

## Quick Checklist

- [ ] Production environment has `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (production key: `pk_live_...`)
- [ ] Production environment has `CLERK_SECRET_KEY` (production key: `sk_live_...`)
- [ ] Production domain is configured in Clerk Dashboard → Paths
- [ ] Production domain is in allowed origins (if applicable)
- [ ] User exists in the Clerk application (check Users section)
- [ ] Production environment variables are actually set (check deployment platform)

## Testing

1. Check browser console on production - what error do you see?
2. Check network tab - are API requests to Clerk failing?
3. Verify environment variables in your deployment platform (Vercel, etc.)
4. Check Clerk Dashboard → Users - is the user there?

## Next Steps

1. **Check production environment variables** - Make sure Clerk keys are set
2. **Configure production domain in Clerk** - Add your domain to Paths
3. **Use production keys** - Make sure you're using `pk_live_` / `sk_live_` keys
4. **Check browser console** - What specific error appears?
