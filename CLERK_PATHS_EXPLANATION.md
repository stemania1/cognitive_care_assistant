# Clerk Dashboard - Paths Configuration Explained

## Overview

In the Clerk Dashboard → Paths section, you'll see three main categories:

1. **Fallback development host**
2. **Application paths**
3. **Component paths**

This guide explains what each section means and what values to use.

---

## 1. Fallback Development Host

**What it is:**
- The base URL for your development environment
- Used when Clerk needs to redirect users but can't detect the current host
- Used for features initiated externally (like user impersonation or IdP-initiated SAML)

**What to set:**
```
http://localhost:3000
```

**Notes:**
- Use the full URL (with `http://` or `https://`)
- Only needed for development - production doesn't need this
- This is a fallback - Clerk usually detects the host automatically at runtime

---

## 2. Application Paths

**What it is:**
- General paths that apply to your entire application
- Used for application-wide functionality like the homepage

**Common fields:**

### Home URL
- Where your application's homepage lives
- **Development:** `/signin` (or leave blank if homepage is at root)
- **Production:** `/signin` (or leave blank)
- Use a **relative path** (starts with `/`)

### Unauthorized Sign In URL
- Where users are redirected when signing in from an unrecognized device
- **Development:** `/signin`
- **Production:** `/signin`
- Use a **relative path** (starts with `/`)

**Example configuration:**
```
Home URL:                  /signin
Unauthorized sign in URL:  /signin
```

**Important:** Use relative paths (start with `/`), not full URLs. Clerk automatically adds the domain.

---

## 3. Component Paths

**What it is:**
- Specific paths where Clerk's authentication components are mounted
- These are the routes where your `<SignIn>`, `<SignUp>`, and `<UserProfile>` components are located

**Common fields:**

### Sign In URL
- The path where your SignIn component is located
- **Value:** `/signin`
- Use a **relative path**

### Sign Up URL
- The path where your SignUp component is located
- **Value:** `/signup`
- Use a **relative path**

### After Sign In URL
- Where users are redirected after successfully signing in
- **Value:** `/dashboard` (or wherever you want users to land after login)
- Use a **relative path**

### After Sign Up URL
- Where users are redirected after successfully signing up
- **Value:** `/dashboard` (or wherever you want new users to land)
- Use a **relative path**

**Example configuration:**
```
Sign In URL:        /signin
Sign Up URL:        /signup
After Sign In URL:  /dashboard
After Sign Up URL:  /dashboard
```

---

## Complete Example Configuration

### For Development (localhost)

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

### For Production

```
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

**Note:** Production doesn't need "Fallback Development Host" - that's only for local development.

---

## Important Notes

### ✅ Do's

- Use **relative paths** (start with `/`) for Application Paths and Component Paths
- Use **full URLs** (with `http://` or `https://`) only for Fallback Development Host
- Match the paths to your actual Next.js routes
- Use the same values for both development and production (relative paths work for both)

### ❌ Don'ts

- Don't use full URLs like `http://localhost:3000/signin` in Application/Component Paths
- Don't leave paths blank unless you want the route at the root (`/`)
- Don't use different paths for development vs production (use relative paths that work for both)

---

## How These Paths Relate to Your App

Your Next.js app should have these routes:

```
src/app/
├── signin/
│   └── [[...rest]]/
│       └── page.tsx          ← Sign In component (<SignIn>)
├── signup/
│   └── [[...rest]]/
│       └── page.tsx          ← Sign Up component (<SignUp>)
└── dashboard/
    └── page.tsx              ← Landing page after login
```

The Clerk Dashboard paths should match these routes:

- **Sign In URL:** `/signin` → matches `src/app/signin/[[...rest]]/page.tsx`
- **Sign Up URL:** `/signup` → matches `src/app/signup/[[...rest]]/page.tsx`
- **After Sign In URL:** `/dashboard` → matches `src/app/dashboard/page.tsx`

---

## Troubleshooting

### "The path must be either relative or an empty string" Error

**Problem:** You used a full URL instead of a relative path.

**Solution:** Change from:
```
❌ http://localhost:3000/signin
```

To:
```
✅ /signin
```

### Users Not Redirecting After Sign In

**Problem:** After Sign In URL doesn't match your app's routes.

**Solution:** 
1. Check that `/dashboard` (or your After Sign In URL) exists in your app
2. Verify the path matches exactly (case-sensitive)
3. Make sure you're using a relative path, not a full URL

### Component Paths Not Working

**Problem:** Sign In/Sign Up URLs don't match where components are mounted.

**Solution:**
1. Verify your routes exist: `src/app/signin/[[...rest]]/page.tsx`
2. Check that you're using catch-all routes (`[[...rest]]`) for Clerk components
3. Ensure paths match exactly (no typos, correct case)

---

## Quick Reference

| Setting | Type | Example | Notes |
|---------|------|---------|-------|
| Fallback Development Host | Full URL | `http://localhost:3000` | Development only |
| Home URL | Relative path | `/signin` | Use `/` prefix |
| Unauthorized Sign In URL | Relative path | `/signin` | Use `/` prefix |
| Sign In URL | Relative path | `/signin` | Use `/` prefix |
| Sign Up URL | Relative path | `/signup` | Use `/` prefix |
| After Sign In URL | Relative path | `/dashboard` | Use `/` prefix |
| After Sign Up URL | Relative path | `/dashboard` | Use `/` prefix |

---

## Related Documentation

- `CLERK_PATHS_SETUP.md` - Detailed setup instructions
- `CLERK_PRODUCTION_LOGIN_ISSUE.md` - Troubleshooting production login
- `CLERK_SETUP_INSTRUCTIONS.md` - General Clerk setup guide