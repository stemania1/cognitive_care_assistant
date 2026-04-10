# Clerk Setup for Both localhost:3000 and cognitivecareassistant.com

## Quick Answer

**Yes, this works automatically!** Clerk uses relative paths that work with both domains without any additional configuration.

---

## How It Works

When you use **relative paths** (like `/signin`, `/dashboard`) in Clerk Dashboard → Paths, Clerk automatically detects the current domain at runtime and works with both:

- ✅ `http://localhost:3000` (development)
- ✅ `https://cognitivecareassistant.com` (production)

**No additional configuration needed!** The same Clerk application works for both domains.

---

## Step-by-Step Setup

### Step 1: Configure Clerk Dashboard → Paths

1. Go to https://dashboard.clerk.com
2. Select your application
3. Navigate to **Paths** (or **Configure** → **Paths**)

### Step 2: Set Up Paths with Relative Paths

Configure these sections:

#### Fallback Development Host
```
http://localhost:3000
```
- This is used as a fallback when Clerk can't detect the host
- Works for local development

#### Application Paths
```
Home URL:                  /signin
Unauthorized sign in URL:  /signin
```
- Use **relative paths** (start with `/`)
- These work automatically for both `localhost:3000` and `cognitivecareassistant.com`

#### Component Paths
```
Sign In URL:        /signin
Sign Up URL:        /signup
After Sign In URL:  /dashboard
After Sign Up URL:  /dashboard
```
- Use **relative paths** (start with `/`)
- Clerk automatically prepends the current domain

### Step 3: Save Changes

Click **Save** or **Apply** in the Clerk Dashboard.

---

## How Relative Paths Work

When you use relative paths:

| Path Setting | localhost:3000 | cognitivecareassistant.com |
|--------------|----------------|---------------------------|
| `/signin` | `http://localhost:3000/signin` | `https://cognitivecareassistant.com/signin` |
| `/dashboard` | `http://localhost:3000/dashboard` | `https://cognitivecareassistant.com/dashboard` |
| `/signup` | `http://localhost:3000/signup` | `https://cognitivecareassistant.com/signup` |

**Clerk automatically detects the domain at runtime!**

---

## Complete Configuration Example

### Clerk Dashboard → Paths

```
┌─────────────────────────────────────┐
│ Fallback Development Host           │
│ http://localhost:3000               │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Application Paths                   │
│ Home URL:                  /signin  │
│ Unauthorized sign in URL:  /signin  │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Component Paths                     │
│ Sign In URL:        /signin         │
│ Sign Up URL:        /signup         │
│ After Sign In URL:  /dashboard      │
│ After Sign Up URL:  /dashboard      │
└─────────────────────────────────────┘
```

---

## Environment Variables

### For Development (localhost:3000)

Use test keys in `.env.local`:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

### For Production (cognitivecareassistant.com)

**Option A: Same Clerk Application (Development Mode)**

If you want to keep using development mode:
- Use the same test keys (`pk_test_` / `sk_test_`)
- Set in your deployment platform (Vercel) environment variables
- Works for testing, but has usage limits

**Option B: Production Instance (Recommended for Production)**

When ready for production:
- Create a production instance in Clerk Dashboard
- Use production keys (`pk_live_` / `sk_live_`)
- Set in your deployment platform environment variables
- No usage limits

---

## Testing

### Test on localhost:3000

1. Run your dev server:
   ```bash
   npm run dev
   ```

2. Visit: `http://localhost:3000/signin`
3. Try signing in/signing up
4. Should redirect to: `http://localhost:3000/dashboard`

### Test on cognitivecareassistant.com

1. Deploy your app to production
2. Visit: `https://cognitivecareassistant.com/signin`
3. Try signing in/signing up
4. Should redirect to: `https://cognitivecareassistant.com/dashboard`

**Both should work with the same Clerk configuration!**

---

## Important Notes

### ✅ Do's

- Use **relative paths** (start with `/`) in Paths configuration
- Use the same Clerk application for both domains (or separate instances if preferred)
- Test both domains to ensure everything works

### ❌ Don'ts

- Don't use full URLs like `http://localhost:3000/signin` in Paths (use `/signin` instead)
- Don't use different Clerk applications unless you specifically need separate instances
- Don't forget to set environment variables in both local and production environments

---

## Troubleshooting

### Issue: Clerk works on localhost but not on cognitivecareassistant.com

**Check:**
1. ✅ Are you using relative paths (`/signin`, not `http://localhost:3000/signin`)?
2. ✅ Are environment variables set in your deployment platform?
3. ✅ Are you using the correct API keys (test keys for dev mode, live keys for production)?
4. ✅ Is your domain properly configured in your hosting platform (Vercel, etc.)?

### Issue: "Clerk has been loaded with development keys" warning in production

**Solution:**
- This is normal if you're using test keys in production
- For production, consider using a production instance with `pk_live_` / `sk_live_` keys
- Test keys have usage limits

### Issue: Redirects go to localhost when on production domain

**Check:**
1. Make sure Paths use relative paths, not full URLs
2. Clear browser cache and cookies
3. Verify environment variables are set correctly in production

---

## Quick Reference

| Setting | Value | Type |
|---------|-------|------|
| Fallback Development Host | `http://localhost:3000` | Full URL |
| Home URL | `/signin` | Relative path |
| Unauthorized Sign In URL | `/signin` | Relative path |
| Sign In URL | `/signin` | Relative path |
| Sign Up URL | `/signup` | Relative path |
| After Sign In URL | `/dashboard` | Relative path |
| After Sign Up URL | `/dashboard` | Relative path |

---

## Summary

1. **Use relative paths** in Clerk Dashboard → Paths (`/signin`, `/dashboard`, etc.)
2. **Set Fallback Development Host** to `http://localhost:3000`
3. **Same Clerk application** works for both domains automatically
4. **Test both domains** to verify everything works

**That's it!** Clerk automatically handles both domains when you use relative paths. No additional configuration needed.

---

## Related Documentation

- `CLERK_PATHS_EXPLANATION.md` - Understanding Paths sections
- `CLERK_ADD_PRODUCTION_URL.md` - Adding production domains
- `CLERK_CUSTOM_DOMAIN_DEVELOPMENT.md` - Using custom domains in development