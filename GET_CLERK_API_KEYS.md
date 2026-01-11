# How to Get Clerk API Keys

## Step-by-Step Guide

### Step 1: Create a Clerk Account (if you don't have one)

1. Go to https://clerk.com
2. Click **"Sign Up"** or **"Get Started"**
3. Sign up with:
   - Email address, or
   - GitHub account, or
   - Google account

### Step 2: Create a New Application

1. After signing in, you'll see the Clerk Dashboard
2. Click **"Create Application"** button (or "New Application")
3. Fill in the application details:
   - **Application name**: e.g., "Cognitive Care Assistant"
   - **Authentication providers**: Select the ones you want (Email is recommended to start)
   - Click **"Create Application"**

### Step 3: Navigate to API Keys

1. In your Clerk Dashboard, look for the sidebar menu
2. Click on **"API Keys"** (or go to https://dashboard.clerk.com/last-active?path=api-keys)
3. You'll see two keys:

### Step 4: Copy Your Keys

You'll see two keys:

1. **Publishable Key**
   - Starts with `pk_test_...` (for development)
   - Or `pk_live_...` (for production)
   - This is safe to expose in client-side code
   - Click the copy icon or copy button

2. **Secret Key**
   - Starts with `sk_test_...` (for development)
   - Or `sk_live_...` (for production)
   - **⚠️ KEEP THIS SECRET** - Never expose this in client-side code
   - Click the copy icon or copy button

### Step 5: Add Keys to Your Project

1. Open or create `.env.local` file in your project root
2. Add the keys:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_actual_key_here
CLERK_SECRET_KEY=sk_test_your_actual_secret_key_here
```

**Important:**
- Replace `your_actual_key_here` with the actual keys you copied
- Do NOT include quotes around the values
- Do NOT commit `.env.local` to git (it should be in `.gitignore`)
- The `NEXT_PUBLIC_` prefix is required for the publishable key (makes it available in the browser)

### Step 6: Restart Your Development Server

After adding the keys:

```bash
# Stop your current dev server (Ctrl+C)
# Then restart it
npm run dev
```

Or test the build:

```bash
npm run build
```

## Quick Links

- **Clerk Dashboard**: https://dashboard.clerk.com
- **API Keys Page**: https://dashboard.clerk.com/last-active?path=api-keys
- **Clerk Documentation**: https://clerk.com/docs

## Troubleshooting

### "Missing publishableKey" Error

- Make sure `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is set in `.env.local`
- Make sure you included the `NEXT_PUBLIC_` prefix
- Restart your dev server after adding the key

### Keys Not Working

- Check that you copied the entire key (they're long)
- Make sure there are no extra spaces
- Verify you're using test keys (`pk_test_` / `sk_test_`) for development
- Check that `.env.local` is in the project root (same level as `package.json`)

### Can't Find API Keys

- Make sure you're in the correct application in Clerk Dashboard
- Check the sidebar for "API Keys" or "Configure" → "API Keys"
- Try the direct link: https://dashboard.clerk.com/last-active?path=api-keys

## Security Reminders

✅ **DO:**
- Use test keys (`pk_test_` / `sk_test_`) for development
- Keep secret key in `.env.local` only
- Use environment variables in production (Vercel, etc.)
- Commit `.env.local` to `.gitignore`

❌ **DON'T:**
- Commit API keys to git
- Share secret keys publicly
- Put secret keys in client-side code
- Use production keys (`pk_live_` / `sk_live_`) during development

## Next Steps

After adding your API keys:

1. Test the build: `npm run build`
2. Start the dev server: `npm run dev`
3. Visit http://localhost:3000
4. You should see Clerk authentication working!

Then we can proceed with updating the sign-in/sign-up pages.

