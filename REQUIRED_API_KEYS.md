# Required API Keys & Environment Variables

This document lists all API keys and environment variables needed to run this application.

## 🔐 Required for Authentication (Clerk)

### Clerk API Keys
**Status:** Required (currently in use)

1. **NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY**
   - Get from: https://dashboard.clerk.com/last-active?path=api-keys
   - Format: `pk_test_...` (development) or `pk_live_...` (production)
   - Example: `pk_test_Z29vZC1jb3ViaXJkLTI2LmNsZXJrLmFjY291bnRzLmRldiQ`
   - **Note:** Must have `NEXT_PUBLIC_` prefix to be accessible in browser

2. **CLERK_SECRET_KEY**
   - Get from: https://dashboard.clerk.com/last-active?path=api-keys
   - Format: `sk_test_...` (development) or `sk_live_...` (production)
   - Example: `sk_test_OTe76bd8NhO0YNBfUgtKpEjvwEMc1O0rsb3Tof3O3d`
   - **Note:** Keep this secret - never expose in client-side code

**Setup Instructions:**
1. Go to https://dashboard.clerk.com
2. Create or select your application
3. Go to **API Keys** section
4. Copy your Publishable Key and Secret Key
5. Add to `.env.local`

---

## 🗄️ Required for Database (Supabase)

### Supabase Credentials
**Status:** Required (for data storage)

1. **NEXT_PUBLIC_SUPABASE_URL**
   - Get from: Your Supabase project dashboard → Settings → API
   - Format: `https://xxxxx.supabase.co`
   - Used for: Client-side database operations

2. **NEXT_PUBLIC_SUPABASE_ANON_KEY**
   - Get from: Your Supabase project dashboard → Settings → API
   - Format: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - Used for: Client-side database operations (public/anonymous access)

3. **SUPABASE_SERVICE_ROLE_KEY**
   - Get from: Your Supabase project dashboard → Settings → API
   - Format: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - Used for: Server-side operations (bypasses Row Level Security)
   - **Warning:** Keep this secret - never expose in client-side code

**Setup Instructions:**
1. Go to https://supabase.com
2. Create or select your project
3. Go to **Settings** → **API**
4. Copy your Project URL, anon/public key, and service_role key
5. Add to `.env.local`

---

## 📧 Optional: Email Service (Resend)

### Resend API Key
**Status:** Optional (for password reset emails)

**RESEND_API_KEY**
- Get from: https://resend.com/api-keys
- Format: `re_...`
- Used for: Password reset emails
- **Note:** Only needed if you want password reset functionality

---

## 🛡️ Optional: CAPTCHA (hCaptcha)

### hCaptcha Site Key
**Status:** Optional (legacy - not used with Clerk)

**NEXT_PUBLIC_HCAPTCHA_SITE_KEY**
- Get from: https://www.hcaptcha.com/
- Format: `10000000-ffff-ffff-ffff-000000000001` (test key)
- **Note:** Not needed with Clerk authentication

---

## 📋 Complete .env.local Template

Create a `.env.local` file in your project root with:

```env
# Clerk Authentication (REQUIRED)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Supabase Database (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Email Service (OPTIONAL - for password reset)
RESEND_API_KEY=re_...

# CAPTCHA (OPTIONAL - not used with Clerk)
NEXT_PUBLIC_HCAPTCHA_SITE_KEY=10000000-ffff-ffff-ffff-000000000001
```

---

## ✅ Minimum Required for Development

To run the app locally with Clerk authentication, you need:

1. ✅ **NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY** (Clerk)
2. ✅ **CLERK_SECRET_KEY** (Clerk)
3. ✅ **NEXT_PUBLIC_SUPABASE_URL** (Supabase)
4. ✅ **NEXT_PUBLIC_SUPABASE_ANON_KEY** (Supabase)
5. ✅ **SUPABASE_SERVICE_ROLE_KEY** (Supabase)

---

## 🔒 Security Best Practices

1. **Never commit `.env.local` to git** (should be in `.gitignore`)
2. **Use test keys for development** (`pk_test_`, `sk_test_`)
3. **Use production keys only in production** (`pk_live_`, `sk_live_`)
4. **Never expose secret keys** in client-side code
5. **Rotate keys** if they're accidentally exposed
6. **Use environment variables** in production (Vercel, etc.)

---

## 📚 Setup Guides

- **Clerk Setup:** See `GET_CLERK_API_KEYS.md`
- **Clerk Providers:** See `CLERK_PROVIDER_SETUP.md`
- **Supabase Setup:** See Supabase documentation

---

## 🚀 Quick Checklist

- [ ] Clerk publishable key added
- [ ] Clerk secret key added
- [ ] Supabase URL added
- [ ] Supabase anon key added
- [ ] Supabase service role key added
- [ ] All keys added to `.env.local`
- [ ] `.env.local` is in `.gitignore`
- [ ] Dev server restarted after adding keys

---

## ❓ Troubleshooting

### "Missing publishableKey" Error
- Make sure `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is in `.env.local`
- Check that it has the `NEXT_PUBLIC_` prefix
- Restart your dev server after adding the key

### Build Fails
- Verify all required keys are present
- Check for typos in key names
- Make sure there are no extra spaces or quotes
- Restart dev server: `npm run dev`

