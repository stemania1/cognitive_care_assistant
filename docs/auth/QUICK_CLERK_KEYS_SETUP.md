# Quick Fix: Missing Clerk Environment Keys

## You're Seeing This Error:
> "Missing environment keys - You claimed this application but haven't set keys in your environment. Get them from the Clerk Dashboard."

## Quick Solution (3 Steps)

### Step 1: Get Your Keys from Clerk Dashboard

1. Go to: **https://dashboard.clerk.com/last-active?path=api-keys**
2. Or navigate: Dashboard → **API Keys** (in sidebar)
3. Copy these two keys:
   - **Publishable Key** (starts with `pk_test_...`)
   - **Secret Key** (starts with `sk_test_...`)

### Step 2: Add Keys to .env.local

Open `.env.local` in your project root and make sure it contains:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
CLERK_SECRET_KEY=sk_test_your_secret_key_here
```

**Important:**
- ✅ Use the **exact** variable names shown above
- ✅ Replace `your_publishable_key_here` with your actual publishable key
- ✅ Replace `your_secret_key_here` with your actual secret key
- ✅ No spaces around the `=` sign
- ✅ No quotes around the values
- ✅ The `NEXT_PUBLIC_` prefix is required for the publishable key

### Step 3: Restart Your Dev Server

**Critical:** You MUST restart your dev server after adding/updating keys:

1. Stop your current server (press `Ctrl+C` in the terminal where it's running)
2. Restart it:
   ```bash
   npm run dev
   ```

---

## Verify Your Setup

After restarting, check:

1. ✅ Keys are in `.env.local` in the project root
2. ✅ Variable names are exactly correct (case-sensitive)
3. ✅ No typos in the keys
4. ✅ Dev server was restarted after adding keys

---

## Common Issues

### Keys Still Not Working?

1. **Check file location**: `.env.local` must be in the project root (same level as `package.json`)

2. **Check variable names**:
   - ✅ `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (has `NEXT_PUBLIC_` prefix)
   - ✅ `CLERK_SECRET_KEY` (no `NEXT_PUBLIC_` prefix)

3. **Copy the entire key**: Keys are long - make sure you copied the full key

4. **Restart the server**: This is the most common issue - always restart after changing `.env.local`

5. **Clear Next.js cache** (if still not working):
   ```bash
   # Windows PowerShell:
   Remove-Item -Recurse -Force .next
   
   # Then restart:
   npm run dev
   ```

---

## Direct Links

- **Clerk Dashboard:** https://dashboard.clerk.com
- **API Keys Page:** https://dashboard.clerk.com/last-active?path=api-keys

---

## Need More Help?

- See `GET_CLERK_API_KEYS.md` for detailed step-by-step instructions
- See `CLERK_TROUBLESHOOTING.md` for more troubleshooting tips
- See `REQUIRED_API_KEYS.md` for all required keys
