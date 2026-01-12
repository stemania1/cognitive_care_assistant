# Clerk: User Found on Localhost But Not in Production

## Problem

User account works on `localhost:3000` but Clerk can't find the account on `cognitivecareassistant.com` (production).

---

## Most Common Causes

### 1. Different Clerk Instances (Development vs Production) ⚠️ MOST COMMON

**The Issue:**
- Clerk has **separate user databases** for development and production instances
- Users created in development don't automatically exist in production
- If you're using different Clerk instances (dev vs prod), the user only exists in one

**Solution Options:**

#### Option A: Use Same Clerk Instance for Both (Easiest - Recommended for Now)

Keep using the **development instance** for both localhost and production:

1. **In Production Environment (Vercel, etc.):**
   - Use the same test keys from development:
     ```env
     NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
     CLERK_SECRET_KEY=sk_test_...
     ```
   - These are the same keys you use in `.env.local`

2. **Verify in Clerk Dashboard:**
   - Go to https://dashboard.clerk.com
   - Select your application (should be in "Development" mode)
   - Go to **Users** section
   - Confirm your user exists there

**Pros:**
- ✅ Works immediately
- ✅ Same user database for both environments
- ✅ No additional setup needed

**Cons:**
- ⚠️ Test keys have usage limits
- ⚠️ Not recommended for production long-term

#### Option B: Create User in Production Instance

If you want to use a production instance:

1. **Create Production Instance:**
   - In Clerk Dashboard, click the environment dropdown
   - Select "Create production instance" or "Switch to Production"
   - Clone settings from development if prompted

2. **User Must Sign Up Again:**
   - Go to your production site: `https://cognitivecareassistant.com/signup`
   - Create a new account (users don't migrate automatically)
   - OR invite the user via Clerk Dashboard

3. **Use Production Keys:**
   - Get production keys from Clerk Dashboard → API Keys (production instance)
   - Set in production environment:
     ```env
     NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
     CLERK_SECRET_KEY=sk_live_...
     ```

---

### 2. Production Environment Variables Not Set

**The Issue:**
- Production environment doesn't have Clerk API keys set
- Or using wrong keys

**Solution:**

1. **Check Production Environment Variables:**
   - Go to your deployment platform (Vercel, etc.)
   - Navigate to: **Settings** → **Environment Variables**
   - Verify these are set:
     - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
     - `CLERK_SECRET_KEY`

2. **Verify Key Values:**
   - If using same instance for both: Use test keys (`pk_test_` / `sk_test_`)
   - If using production instance: Use production keys (`pk_live_` / `sk_live_`)

3. **Redeploy After Adding Keys:**
   - After adding/updating environment variables, redeploy your application
   - In Vercel: Go to **Deployments** → **Redeploy**

---

### 3. Using Test Keys When Production Instance Exists

**The Issue:**
- Production instance exists but you're using test keys
- Test keys only work with development instance

**Solution:**

1. **Check Which Instance You Have:**
   - Go to Clerk Dashboard
   - Look at the environment dropdown (top of page)
   - See if you have "Development" and "Production" instances

2. **Match Keys to Instance:**
   - **Development instance** → Use test keys (`pk_test_` / `sk_test_`)
   - **Production instance** → Use production keys (`pk_live_` / `sk_live_`)

3. **Use Same Instance for Both (Recommended for Now):**
   - Keep using development instance for both environments
   - Use test keys everywhere
   - This ensures same user database

---

## Step-by-Step Troubleshooting

### Step 1: Identify Your Setup

1. Go to Clerk Dashboard: https://dashboard.clerk.com
2. Check the environment dropdown (top of page):
   - Do you see "Development" only?
   - Or "Development" AND "Production"?

### Step 2: Check User Exists

1. In Clerk Dashboard, go to **Users** section
2. Search for your user (e.g., `corbinaltaicraig@gmail.com`)
3. **Which instance is it in?**
   - Development instance? → User exists in dev
   - Production instance? → User exists in prod
   - Both? → User exists in both

### Step 3: Check Production Environment Variables

1. Go to your deployment platform (Vercel, Netlify, etc.)
2. Navigate to: **Settings** → **Environment Variables**
3. Verify these variables exist:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
4. **What keys are set?**
   - `pk_test_` / `sk_test_` → Using development instance
   - `pk_live_` / `sk_live_` → Using production instance

### Step 4: Match Instance to Keys

**If user exists in Development instance:**
- ✅ Use test keys (`pk_test_` / `sk_test_`) in production environment
- ✅ This uses the same Clerk instance for both localhost and production

**If user exists in Production instance:**
- ✅ Use production keys (`pk_live_` / `sk_live_`) in production environment
- ✅ Create a production instance if you haven't already
- ⚠️ Users from development won't exist here - they need to sign up again

**If user doesn't exist anywhere:**
- Create the user in the instance you want to use
- Or have the user sign up again on production

---

## Quick Fix (Recommended for Now)

**Use the same Clerk development instance for both environments:**

### 1. Check Your Current Keys

Look at your `.env.local`:
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...  (or pk_live_...)
CLERK_SECRET_KEY=sk_test_...  (or sk_live_...)
```

### 2. Use Same Keys in Production

In your production environment (Vercel, etc.):
- Set the **exact same keys** from `.env.local`
- If using test keys (`pk_test_`), use those in production too
- This ensures both environments use the same Clerk instance

### 3. Verify User Exists

1. Go to Clerk Dashboard → **Users**
2. Find your user
3. Confirm it exists in the instance matching your keys

### 4. Redeploy

After setting environment variables:
- Redeploy your production application
- Test login on `https://cognitivecareassistant.com`

---

## Testing Checklist

- [ ] User exists in Clerk Dashboard → Users (in the correct instance)
- [ ] Production environment has `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` set
- [ ] Production environment has `CLERK_SECRET_KEY` set
- [ ] Keys match the Clerk instance (test keys for dev, live keys for prod)
- [ ] Application was redeployed after setting environment variables
- [ ] Browser console on production shows no Clerk errors
- [ ] Can access `https://cognitivecareassistant.com/signin`

---

## Common Error Messages

### "User not found" or "Account doesn't exist"

**Cause:** User exists in different Clerk instance than the one you're using.

**Solution:**
- Use the same Clerk instance for both environments (use test keys in production)
- OR create user in the production instance

### "Missing environment keys"

**Cause:** Production environment doesn't have Clerk API keys set.

**Solution:**
- Add `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` to production environment
- Redeploy after adding

### "Clerk has been loaded with development keys" (warning)

**Cause:** Using test keys in production.

**Solution:**
- This is OK if you want to use development instance for production
- For production, consider using production instance with live keys

---

## Summary

**Most Likely Issue:** Using different Clerk instances (dev vs prod), so user only exists in one.

**Quick Fix:** Use the same development instance for both environments by using test keys (`pk_test_` / `sk_test_`) in production environment variables.

**Long-term Solution:** When ready for production:
1. Create production instance
2. Use production keys (`pk_live_` / `sk_live_`)
3. Users need to sign up again in production (or invite them)

---

## Related Documentation

- `CLERK_PRODUCTION_LOGIN_ISSUE.md` - General production login issues
- `CLERK_MULTI_DOMAIN_SETUP.md` - Using multiple domains with Clerk
- `GET_CLERK_API_KEYS.md` - How to get Clerk API keys