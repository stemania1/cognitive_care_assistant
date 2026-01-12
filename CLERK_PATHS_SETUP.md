# How to Find and Configure Paths in Clerk Dashboard

## Quick Navigation to Paths

1. Go to https://dashboard.clerk.com
2. Select your application
3. In the left sidebar, click on **"Paths"**

**Direct Link:** https://dashboard.clerk.com/last-active?path=paths

---

## Step-by-Step Instructions

### Step 1: Access Clerk Dashboard

1. Visit https://dashboard.clerk.com
2. Sign in to your Clerk account
3. Select your application from the list (or create a new one)

### Step 2: Navigate to Paths

**Option A: Using Sidebar**
1. Look at the left sidebar menu
2. Find and click on **"Paths"** (usually under "Configure" or "User & Authentication" section)

**Option B: Using Search**
1. Use the search bar at the top of the dashboard
2. Type "Paths" or "Redirect URLs"
3. Click on the Paths result

**Option C: Direct URL**
- Go directly to: https://dashboard.clerk.com/last-active?path=paths

### Step 3: Configure Paths

Once you're on the Paths page, you'll see fields for:

1. **Development host**
   - Shows: `$DEVHOST` (auto-detected at runtime)
   - **Action:** Leave as-is (this is automatically detected)

2. **Fallback development host**
   - **Development:** `http://localhost:3000` (just the base URL, no path)
   - **Note:** Used for features initiated externally like user impersonation

3. **Home URL**
   - **Development:** `/signin` (relative path - Clerk will prepend `$DEVHOST`)
   - **Production:** `/signin` (relative path) or leave blank if homepage is at root
   - **Note:** Use a relative path (starts with `/`) or leave blank. Clerk will add the domain automatically.

4. **Unauthorized sign in URL**
   - **Development:** `/signin` (relative path - Clerk will prepend `$DEVHOST`)
   - **Production:** `/signin` (relative path)
   - **Note:** Use a relative path (starts with `/`). This is where users are redirected when signing in from an unrecognized device.

**Additional fields you might see:**

5. **After sign-in redirect** (if present)
   - Development: `http://localhost:3000/dashboard`
   - Production: `https://yourdomain.com/dashboard`

6. **After sign-up redirect** (if present)
   - Development: `http://localhost:3000/dashboard`
   - Production: `https://yourdomain.com/dashboard`

### Step 4: Save Changes

1. Enter your URLs in the fields
2. Click **"Save"** or **"Apply"** button
3. Changes are applied immediately

---

## Recommended Paths Configuration

### For Development (localhost)

Based on the Clerk Dashboard interface you're seeing:

```
Development host:          $DEVHOST (auto-detected - leave as-is)
Fallback development host: http://localhost:3000
Home URL:                  /signin (relative path)
Unauthorized sign in URL:  /signin (relative path)
```

### For Production

```
Home URL:                  /signin (relative path) or leave blank
Unauthorized sign in URL:  /signin (relative path)
```

**Important Notes:** 
- ✅ Use **relative paths** (start with `/`) like `/signin`, not full URLs
- ✅ Clerk automatically prepends the domain (`$DEVHOST` for development)
- ✅ `$DEVHOST` is automatically detected - you don't need to change it
- ❌ Don't use full URLs like `http://localhost:3000/signin` - this will cause an error

---

## Alternative Navigation Methods

### If Paths is Not Visible in Sidebar

Sometimes the sidebar structure changes. Try these:

1. **Go to "Configure" → "Paths"**
2. **Go to "User & Authentication" → "Paths"**
3. **Use the search function** in the dashboard (top right)
4. **Check "Settings" → "Paths"**

### Using the Dashboard URL Structure

Clerk Dashboard URLs typically follow this pattern:
- Base: `https://dashboard.clerk.com/last-active?path=`
- Paths: `https://dashboard.clerk.com/last-active?path=paths`
- API Keys: `https://dashboard.clerk.com/last-active?path=api-keys`
- Social Connections: `https://dashboard.clerk.com/last-active?path=social-connections`

---

## Visual Guide

```
Clerk Dashboard
├── Sidebar Menu
│   ├── Overview
│   ├── Users
│   ├── Sessions
│   ├── Configure
│   │   ├── Paths          ← Click here!
│   │   ├── API Keys
│   │   ├── Social Connections
│   │   └── Email Templates
│   └── ...
└── Main Content Area
    └── Paths Configuration Form
```

---

## Troubleshooting

### Can't Find Paths Section

1. **Make sure you're in the correct application**
   - Check the application name at the top
   - You might have multiple applications

2. **Check your Clerk plan**
   - Paths configuration should be available on all plans
   - If you don't see it, try refreshing the page

3. **Use the direct URL**
   - https://dashboard.clerk.com/last-active?path=paths

### Paths Not Saving

1. Make sure you're using **relative paths** (start with `/`), not full URLs
2. Check for typos in the paths
3. Try refreshing the page and checking again
4. Clear browser cache and try again

### "The path must be either relative or an empty string" Error

If you see this error, you're using a full URL instead of a relative path:

❌ **Wrong:** `http://localhost:3000/signin`
✅ **Correct:** `/signin`

**Solution:**
- Use relative paths (start with `/`) like `/signin`, `/dashboard`, etc.
- Clerk automatically adds the domain (`$DEVHOST` for development)
- Leave blank (empty string) if the path should be at the root

### Redirects Not Working

1. Verify the paths match your Next.js routes exactly
2. Check that your routes exist in your app (`/signin`, `/signup`, `/dashboard`)
3. Make sure you're using the correct URL (localhost for dev, domain for production)
4. Clear browser cache and cookies

---

## Quick Reference

- **Dashboard Home:** https://dashboard.clerk.com
- **Paths:** https://dashboard.clerk.com/last-active?path=paths
- **API Keys:** https://dashboard.clerk.com/last-active?path=api-keys
- **Social Connections:** https://dashboard.clerk.com/last-active?path=social-connections

---

## Related Documentation

- See `CLERK_PROVIDER_SETUP.md` for more details on configuring OAuth providers
- See `REQUIRED_API_KEYS.md` for API key configuration
- See `CLERK_SETUP_INSTRUCTIONS.md` for general Clerk setup
