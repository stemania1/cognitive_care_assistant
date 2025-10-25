# Guest Account Feature

## Overview
The Cognitive Care Assistant now supports guest accounts, allowing users to try the app without creating a permanent account. Guest accounts use Supabase's anonymous authentication and store data locally with automatic cleanup.

## Features

### Guest Authentication
- **Anonymous Sign-in**: Users can click "Continue as Guest" on the signin page
- **Supabase Anonymous Auth**: Uses `supabase.auth.signInAnonymously()` for secure temporary authentication
- **Automatic Session Management**: Guest sessions are handled by Supabase's built-in anonymous auth

### Data Storage
- **Local Storage**: Guest data is stored in browser's localStorage with 7-day expiration
- **Automatic Cleanup**: Data automatically expires and is removed after 7 days
- **Data Types Supported**:
  - Daily check responses
  - Session completion data
  - Photo uploads (temporary)

### User Experience
- **Guest Indicator**: Yellow notification appears in top-left corner for guest users
- **Upgrade Prompts**: Clear messaging about temporary data and account creation benefits
- **Seamless Migration**: Guest data can be migrated to permanent accounts

## Technical Implementation

### Files Modified/Created
1. **`src/app/signin/page.tsx`** - Added guest sign-in button and handler
2. **`src/app/components/daily-questions/AuthenticationGuard.tsx`** - Enhanced to handle guest users
3. **`src/lib/guestDataManager.ts`** - New utility for managing guest data
4. **`src/lib/useDailyChecks.ts`** - Updated to handle both guest and regular users
5. **`src/app/components/GuestIndicator.tsx`** - New component for guest account notifications
6. **`src/app/dashboard/page.tsx`** - Added guest indicator

### Guest Data Manager
The `GuestDataManager` class provides:
- **Singleton Pattern**: Single instance manages all guest data
- **Expiration Handling**: Automatic cleanup of expired data
- **Migration Support**: Transfer guest data to permanent accounts
- **Type Safety**: Full TypeScript support

### Data Flow
1. **Guest Sign-in**: User clicks "Continue as Guest" → Supabase anonymous auth
2. **Data Storage**: All interactions stored in localStorage with expiration
3. **Data Retrieval**: Guest data loaded from localStorage instead of API
4. **Account Migration**: Guest data can be transferred to permanent account
5. **Cleanup**: Data automatically removed after 7 days

## Usage Examples

### Signing in as Guest
```typescript
// In signin page
const handleGuestSignIn = async () => {
  const { error } = await supabase.auth.signInAnonymously();
  if (!error) {
    router.push("/dashboard");
  }
};
```

### Checking Guest Status
```typescript
import { isGuestUser } from '@/lib/guestDataManager';

const guestStatus = await isGuestUser();
if (guestStatus) {
  // Handle guest user
}
```

### Managing Guest Data
```typescript
import { getGuestDataManager } from '@/lib/guestDataManager';

const guestManager = getGuestDataManager();
guestManager.saveDailyCheck(checkData);
const checks = guestManager.getDailyChecks();
```

## Security Considerations
- **Anonymous Auth**: Supabase handles secure anonymous authentication
- **Data Isolation**: Guest data is isolated per browser/session
- **Automatic Expiration**: Data automatically cleans up after 7 days
- **No Cross-Session**: Guest data doesn't persist across different browsers/devices

## Limitations
- **Temporary Data**: All data is lost after 7 days or browser clear
- **No Cross-Device**: Data doesn't sync across devices
- **Limited Features**: Some advanced features may be restricted for guests
- **No Email Recovery**: No password reset or account recovery for guests

## Future Enhancements
- **Data Migration UI**: Streamlined process to convert guest to permanent account
- **Guest Analytics**: Track guest usage patterns
- **Feature Restrictions**: Implement different feature sets for guests vs. users
- **Data Export**: Allow guests to export their data before expiration
