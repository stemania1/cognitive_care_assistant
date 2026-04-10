# Clerk Setup Troubleshooting

## Build Error: "Missing publishableKey"

If you're seeing this error after adding API keys, check the following:

### 1. Verify .env.local File Location

The `.env.local` file **must** be in the **root** of your project (same level as `package.json`).

```
cognitive_care_assistant/
├── .env.local          ← Must be here!
├── package.json
├── next.config.ts
├── src/
└── ...
```

### 2. Verify Variable Names

Make sure the variable names are **exactly** as shown:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

**Important:**
- ✅ `NEXT_PUBLIC_` prefix is required for the publishable key
- ✅ No spaces around the `=` sign
- ✅ No quotes around the values (unless the value itself contains spaces)
- ✅ Copy the entire key (they're long)

### 3. Verify File Format

The `.env.local` file should look like this:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_abcdefghijklmnopqrstuvwxyz1234567890
CLERK_SECRET_KEY=sk_test_abcdefghijklmnopqrstuvwxyz1234567890
```

**Common mistakes:**
- ❌ `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = pk_test_...` (spaces around `=`)
- ❌ `CLERK_PUBLISHABLE_KEY=pk_test_...` (missing `NEXT_PUBLIC_` prefix)
- ❌ `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."` (quotes not needed)
- ❌ Extra blank lines or comments that might break parsing

### 4. Restart Everything

After adding/updating `.env.local`:

1. **Stop your dev server** (if running) - Press `Ctrl+C`
2. **Clear Next.js cache** (optional but recommended):
   ```bash
   rm -rf .next
   # On Windows PowerShell:
   # Remove-Item -Recurse -Force .next
   ```
3. **Restart dev server**:
   ```bash
   npm run dev
   ```

### 5. Verify Keys Are Correct

1. Go to https://dashboard.clerk.com/last-active?path=api-keys
2. Copy your keys again
3. Make sure you copied:
   - The **entire** Publishable Key (starts with `pk_test_...`)
   - The **entire** Secret Key (starts with `sk_test_...`)
4. Keys are long - make sure nothing was cut off

### 6. Test Environment Variables

You can verify Next.js is reading your keys by checking:

```bash
# On Windows PowerShell:
$env:NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

# Should output your key (if set)
```

Or create a test route to check (then remove it):

```typescript
// src/app/api/test-clerk/route.ts
export async function GET() {
  return Response.json({
    hasPublishableKey: !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    hasSecretKey: !!process.env.CLERK_SECRET_KEY,
    publishableKeyPrefix: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.substring(0, 10),
  });
}
```

### 7. Check for Multiple .env Files

Make sure you're editing the **correct** `.env.local` file:

- ✅ `.env.local` (used by Next.js)
- ❌ `.env` (not used if `.env.local` exists)
- ❌ `.env.development` (lower priority)

### 8. Verify .gitignore

Make sure `.env.local` is in `.gitignore`:

```gitignore
.env*
```

This is important for security, but shouldn't affect local development.

## Still Not Working?

1. **Double-check the keys in Clerk Dashboard** - Make sure they're active
2. **Try copying the keys again** - Sometimes copy/paste misses characters
3. **Check for typos** - Variable names must be exact
4. **Verify the file is saved** - Make sure `.env.local` is saved after editing
5. **Check file encoding** - Should be UTF-8 (usually automatic)

## Quick Test

1. Open `.env.local`
2. Make sure it contains:
   ```
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
   CLERK_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE
   ```
3. Save the file
4. Delete `.next` folder: `rm -rf .next` (or `Remove-Item -Recurse -Force .next` on Windows)
5. Run: `npm run build`

If it still fails, double-check:
- ✅ Keys start with `pk_test_` and `sk_test_`
- ✅ No extra spaces or characters
- ✅ File is named `.env.local` (not `.env.local.txt`)
- ✅ File is in the project root (same folder as `package.json`)

