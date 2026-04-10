# Using Your Custom Domain with Clerk (Development Mode)

## Important Clarification

There are **two different things** you might want to do with your custom domain:

1. **Use your custom domain for your application** (Next.js app) - ✅ Works in development mode
2. **Use your custom domain for Clerk's authentication** (Clerk's auth service) - ❌ Requires production instance

---

## Scenario 1: Use Custom Domain for Your App (Development Mode) ✅

**This works!** You can use your custom domain for your Next.js application while keeping Clerk in development mode.

### What This Means:

- Your app runs on: `https://yourdomain.com`
- Clerk auth uses: `good-cowbird-26.clerk.accounts.dev` (Clerk's default domain)
- Clerk stays in development mode (using test keys: `pk_test_` / `sk_test_`)

### How to Set This Up:

#### Step 1: Configure Your Domain for Your App

1. **Point your domain to your hosting service:**
   - If using Vercel: Add your domain in Vercel dashboard
   - Vercel will provide DNS records to add
   - Add the DNS records at your domain registrar

2. **Wait for DNS propagation:**
   - Usually takes a few minutes to a few hours
   - Your app will be accessible at `https://yourdomain.com`

#### Step 2: Update Clerk Dashboard → Paths

1. Go to Clerk Dashboard: https://dashboard.clerk.com
2. Navigate to **Paths** (or **Configure** → **Paths**)
3. Use **relative paths** (these work automatically with your custom domain):
   ```
   Application Paths:
     Home URL:                  /signin
     Unauthorized sign in URL:  /signin

   Component Paths:
     Sign In URL:        /signin
     Sign Up URL:        /signup
     After Sign In URL:  /dashboard
     After Sign Up URL:  /dashboard
   ```

4. **Fallback Development Host:**
   - Set to: `https://yourdomain.com`
   - Or leave as `http://localhost:3000` if you're still developing locally

#### Step 3: Keep Using Development Keys

Continue using test keys in your environment variables:
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

**Result:** Your app runs on your custom domain, but Clerk authentication uses Clerk's default domain. This works perfectly for development!

---

## Scenario 2: Use Custom Domain for Clerk Auth (Requires Production) ❌

**This requires a production instance.** You cannot use a custom domain for Clerk's authentication service in development mode.

### What This Means:

- Your app runs on: `https://yourdomain.com`
- Clerk auth uses: `auth.yourdomain.com` (or similar, your custom domain)
- Requires: Production instance + DNS setup + SSL certificates

### Why This Requires Production:

- Clerk's custom domain feature includes SSL certificate management
- DNS verification is required for security
- This is a production-level feature

### What You Can Do Instead (For Now):

**Option A: Stay in Development Mode**
- Use your custom domain for your app
- Keep Clerk's default domain for authentication
- This works perfectly for development/testing

**Option B: Create a Production Instance (When Ready)**
- Create a production instance in Clerk
- Set up custom domain for Clerk auth
- Use production API keys
- More setup, but fully branded authentication

---

## Recommendation: Development Setup

For now, while staying in development mode, I recommend:

### ✅ Do This:

1. **Use your custom domain for your Next.js app:**
   - Configure in Vercel/hosting platform
   - Point DNS to your hosting service
   - Your app will be at `https://yourdomain.com`

2. **Keep Clerk in development mode:**
   - Use test keys (`pk_test_` / `sk_test_`)
   - Let Clerk use its default domain (`good-cowbird-26.clerk.accounts.dev`)
   - Configure Paths with relative paths

3. **Set Fallback Development Host:**
   - In Clerk Dashboard → Paths
   - Set "Fallback Development Host" to: `https://yourdomain.com`

**This setup works great!** Users will:
- Access your app at `https://yourdomain.com`
- See Clerk's default domain briefly during authentication
- Be redirected back to your custom domain after auth

---

## Step-by-Step: Setting Up Custom Domain for Your App

### Step 1: Configure Domain in Your Hosting Platform

**If using Vercel:**

1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to **Settings** → **Domains**
4. Click **Add Domain**
5. Enter your domain (e.g., `yourdomain.com`)
6. Follow Vercel's instructions for DNS setup

### Step 2: Add DNS Records

1. Go to your domain registrar (where you bought the domain)
2. Add the DNS records Vercel provides
3. Usually involves:
   - A record pointing to an IP, OR
   - CNAME record pointing to Vercel

### Step 3: Wait for DNS Propagation

- Check DNS propagation: https://dnschecker.org
- Usually takes 5-60 minutes
- Your domain should resolve to your app

### Step 4: Update Clerk Dashboard

1. Go to Clerk Dashboard → **Paths**
2. Set **Fallback Development Host** to: `https://yourdomain.com`
3. Keep Paths as relative paths: `/signin`, `/dashboard`, etc.
4. Save changes

### Step 5: Test

1. Visit `https://yourdomain.com`
2. Try signing in
3. You should see Clerk's authentication flow
4. After authentication, you'll be redirected back to your domain

---

## When to Create Production Instance

Create a production instance when you're ready to:

- ✅ Use custom domain for Clerk's authentication service
- ✅ Use production API keys (`pk_live_` / `sk_live_`)
- ✅ Deploy to production environment
- ✅ Have fully branded authentication

**You can do this later!** For now, using your custom domain for your app while keeping Clerk in development mode works perfectly.

---

## Quick Reference

| Feature | Development Mode | Production Instance |
|---------|-----------------|---------------------|
| **Your app custom domain** | ✅ Yes | ✅ Yes |
| **Clerk auth custom domain** | ❌ No | ✅ Yes |
| **API Keys** | `pk_test_` / `sk_test_` | `pk_live_` / `sk_live_` |
| **Setup Complexity** | Simple | Requires DNS + verification |
| **Use Case** | Development/testing | Production deployment |

---

## Summary

**For your situation (wanting custom domain + staying in development):**

1. ✅ **Use your custom domain for your Next.js app** - This works!
   - Configure in Vercel/hosting platform
   - Point DNS to your hosting service
   - Your app runs at `https://yourdomain.com`

2. ✅ **Keep Clerk in development mode** - This is fine!
   - Use test keys (`pk_test_` / `sk_test_`)
   - Clerk uses default domain (`good-cowbird-26.clerk.accounts.dev`)
   - Set Fallback Development Host to your custom domain

3. ⏳ **Use custom domain for Clerk auth** - Do this later!
   - Requires production instance
   - More setup (DNS, verification, SSL)
   - Can be done when ready for production

**Your app will work perfectly with your custom domain while Clerk stays in development mode!**

---

## Related Documentation

- `CLERK_DOMAIN_EXPLANATION.md` - Understanding Clerk domains
- `CLERK_ADD_PRODUCTION_URL.md` - Adding production domains
- `CLERK_PATHS_EXPLANATION.md` - Understanding Paths configuration