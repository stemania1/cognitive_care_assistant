# Clerk Provider Setup Guide

## Configure Sign-In Providers

To enable Email, Google, and Apple sign-in in your Clerk application:

### Step 1: Go to Clerk Dashboard

1. Visit https://dashboard.clerk.com
2. Select your application
3. Go to **"User & Authentication"** in the sidebar

### Step 2: Enable Email Authentication

1. Click on **"Email, Phone, Username"**
2. Enable **"Email address"**
3. Configure email verification (recommended: "Required")
4. Save changes

### Step 3: Enable Google Sign-In

1. Click on **"Social Connections"** or **"OAuth"**
2. Find **"Google"** in the list
3. Click **"Enable"** or toggle it on
4. You'll need to:
   - Create a Google OAuth app (if you don't have one)
   - Add Client ID and Client Secret
   - Configure redirect URLs
5. Follow Clerk's instructions to set up Google OAuth
6. Save changes

### Step 4: Enable Apple Sign-In

1. In **"Social Connections"** or **"OAuth"**, find **"Apple"**
2. Click **"Enable"** or toggle it on
3. You'll need to:
   - Have an Apple Developer account
   - Create an Apple Service ID
   - Configure redirect URLs
   - Add Client ID and Client Secret
4. Follow Clerk's instructions for Apple setup
5. Save changes

### Step 5: Configure Redirect URLs

1. Go to **"Paths"** in Clerk Dashboard
2. Set:
   - **After sign-in**: `http://localhost:3000/dashboard` (for development)
   - **After sign-up**: `http://localhost:3000/dashboard` (for development)
   - **Sign-in URL**: `http://localhost:3000/signin`
   - **Sign-up URL**: `http://localhost:3000/signup`

For production, also add:
- `https://yourdomain.com/dashboard`
- `https://yourdomain.com/signin`
- `https://yourdomain.com/signup`

### Step 6: Test

1. Start your dev server: `npm run dev`
2. Visit http://localhost:3000/signin
3. You should see:
   - Email/password form
   - Google sign-in button
   - Apple sign-in button (if configured)

## Provider-Specific Setup

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs from Clerk
6. Copy Client ID and Client Secret to Clerk

### Apple Sign-In Setup

1. Go to [Apple Developer Portal](https://developer.apple.com/)
2. Create a Service ID
3. Configure Sign in with Apple
4. Add redirect URLs
5. Create a Key for Sign in with Apple
6. Copy credentials to Clerk

## Troubleshooting

### Providers Not Showing

- Make sure providers are enabled in Clerk Dashboard
- Check that OAuth apps are properly configured
- Verify redirect URLs match exactly
- Clear browser cache and try again

### Sign-In Not Working

- Check browser console for errors
- Verify API keys are correct
- Ensure redirect URLs are configured
- Check Clerk Dashboard for error logs

## Notes

- **Email** is the default and doesn't require additional setup
- **Google** requires Google Cloud Console setup
- **Apple** requires Apple Developer account ($99/year)
- All providers work on both web and mobile (iPhone/iPad)

## Documentation

- Clerk OAuth Setup: https://clerk.com/docs/authentication/social-connections
- Google OAuth: https://clerk.com/docs/authentication/social-connections/google
- Apple OAuth: https://clerk.com/docs/authentication/social-connections/apple

