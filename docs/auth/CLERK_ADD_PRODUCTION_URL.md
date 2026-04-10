# How to Add Production URL in Clerk

## Overview

To enable production login, you need to configure your production domain in Clerk. Clerk uses relative paths that work automatically, but you may need to verify your production domain is recognized.

---

## Method 1: Using Relative Paths (Recommended)

**Good news:** If you're using relative paths (like `/signin`, `/dashboard`), Clerk automatically works with your production domain! No additional configuration needed.

**How it works:**
- Clerk detects the domain at runtime (automatically)
- Relative paths work for both `localhost:3000` and your production domain
- Example: `/signin` works as `http://localhost:3000/signin` (dev) and `https://your-domain.com/signin` (prod)

**What to set in Clerk Dashboard → Paths:**
```
Application Paths:
  Home URL:                  /signin  (relative path)
  Unauthorized sign in URL:  /signin  (relative path)

Component Paths:
  Sign In URL:        /signin         (relative path)
  Sign Up URL:        /signup         (relative path)
  After Sign In URL:  /dashboard      (relative path)
  After Sign Up URL:  /dashboard      (relative path)
```

✅ **These paths work for both development and production automatically!**

---

## Method 2: Check Allowed Origins (If Needed)

If you're having production login issues, you might need to verify your production domain is allowed.

### Step 1: Check Clerk Dashboard → Paths

1. Go to https://dashboard.clerk.com
2. Select your application
3. Navigate to **Paths** (or **Configure** → **Paths**)

### Step 2: Look for "Allowed Origins" or "Domains" Section

In some Clerk configurations, you might see:
- **Allowed Origins** section
- **Domains** section
- **Frontend API** section

**If you see these sections:**
- Add your production domain: `https://your-production-domain.com`
- Example: `https://cognitive-care-assistant.vercel.app`

**Where to find your production domain:**
- If using Vercel: Check your Vercel dashboard for your deployment URL
- Example: `https://your-app-name.vercel.app`
- Or your custom domain: `https://yourdomain.com`

---

## Method 3: Add Production Domain in Clerk Dashboard

### Option A: Domains Section (If Available)

1. Go to Clerk Dashboard: https://dashboard.clerk.com
2. Select your application
3. Look for **"Domains"** in the sidebar (or **Configure** → **Domains**)
4. Click **"Add Domain"** or **"Add Production Domain"**
5. Enter your production domain (e.g., `your-app.vercel.app`)
6. Follow Clerk's instructions to verify domain ownership (if required)

### Option B: Environment Settings

1. Go to Clerk Dashboard → **Settings** (or **Configure** → **Settings**)
2. Look for **"Frontend API"** or **"Domains"** section
3. Add your production domain to the list of allowed domains
4. Save changes

### Option C: API Keys Section

1. Go to Clerk Dashboard → **API Keys**
2. Check if there's a **"Allowed Origins"** or **"Domains"** section
3. Add your production domain here

---

## Finding Your Production Domain

### If Using Vercel:

1. Go to https://vercel.com/dashboard
2. Select your project
3. Check the **"Domains"** section
4. You'll see your deployment URL (e.g., `your-app.vercel.app`)
5. Or your custom domain if configured

### Common Production Domain Formats:

- **Vercel:** `https://your-app-name.vercel.app`
- **Custom domain:** `https://yourdomain.com`
- **Netlify:** `https://your-app.netlify.app`
- **Other platforms:** Check your deployment platform's dashboard

---

## Complete Production Setup Checklist

To ensure production login works:

### ✅ 1. Clerk Dashboard Configuration

- [ ] Paths configured with relative paths (`/signin`, `/dashboard`, etc.)
- [ ] Production domain added to Allowed Origins (if section exists)
- [ ] Using same Clerk application for both dev and prod (or separate prod instance configured)

### ✅ 2. Production Environment Variables

- [ ] `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` = `pk_live_...` (production key, NOT `pk_test_`)
- [ ] `CLERK_SECRET_KEY` = `sk_live_...` (production key, NOT `sk_test_`)
- [ ] Environment variables set in your deployment platform (Vercel, etc.)

### ✅ 3. Clerk API Keys

- [ ] Using production keys (`pk_live_` / `sk_live_`) in production
- [ ] Not using test keys (`pk_test_` / `sk_test_`) in production

### ✅ 4. Verification

- [ ] User exists in Clerk Dashboard → Users
- [ ] Can access production URL
- [ ] Browser console shows no errors

---

## Step-by-Step: Adding Production Domain (If Required)

**Note:** Most Clerk setups work automatically with relative paths. Only follow these steps if you see domain/origin configuration options or are having production login issues.

### Step 1: Identify Your Production Domain

```
Example: https://cognitive-care-assistant.vercel.app
```

### Step 2: Open Clerk Dashboard

1. Go to https://dashboard.clerk.com
2. Sign in
3. Select your application

### Step 3: Navigate to Configuration

Look for one of these sections:
- **Configure** → **Paths** → Look for "Allowed Origins" or "Domains"
- **Configure** → **Domains**
- **Settings** → **Frontend API**
- **Settings** → **Domains**

### Step 4: Add Production Domain

If you find a domain/origin configuration section:
1. Click **"Add Domain"** or **"Add Origin"**
2. Enter: `https://your-production-domain.com`
   - Include `https://`
   - Don't include trailing slash
   - Example: `https://cognitive-care-assistant.vercel.app`
3. Click **Save** or **Add**

### Step 5: Verify Configuration

1. Check that your production domain appears in the list
2. Make sure it shows as "Active" or "Verified"
3. Save any changes

---

## Common Issues and Solutions

### Issue: "I don't see a Domains section"

**Solution:** This is normal! Clerk automatically detects domains at runtime. Just use relative paths in the Paths section.

### Issue: "Production login still not working"

**Checklist:**
1. ✅ Using production API keys (`pk_live_` / `sk_live_`)
2. ✅ Production keys set in deployment platform environment variables
3. ✅ Paths configured with relative paths (`/signin`, etc.)
4. ✅ User exists in Clerk Dashboard → Users

### Issue: "Clerk shows localhost in production"

**Solution:** Make sure you're using production API keys, not test keys. Test keys force localhost.

---

## Quick Reference

| What | Where | Value |
|------|-------|-------|
| Paths | Clerk Dashboard → Paths | Use relative paths (`/signin`, `/dashboard`) |
| Production Domain | Clerk Dashboard → Domains (if available) | `https://your-domain.com` |
| API Keys (Production) | Clerk Dashboard → API Keys | `pk_live_...` / `sk_live_...` |
| Environment Variables | Vercel/Deployment Platform | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` |

---

## Summary

**Most Common Setup (Works for 90% of cases):**

1. **Clerk Dashboard → Paths:**
   - Use relative paths: `/signin`, `/dashboard`, etc.
   - These work automatically for both dev and prod

2. **Production Environment:**
   - Use production API keys (`pk_live_` / `sk_live_`)
   - Set in Vercel/deployment platform environment variables

3. **That's it!** Clerk automatically detects your production domain.

**Only add domains explicitly if:**
- You see a "Domains" or "Allowed Origins" section
- You're having production login issues
- Clerk specifically requires domain verification

---

## Related Documentation

- `CLERK_PATHS_EXPLANATION.md` - Understanding Paths sections
- `CLERK_PRODUCTION_LOGIN_ISSUE.md` - Troubleshooting production login
- `CLERK_SETUP_INSTRUCTIONS.md` - General Clerk setup