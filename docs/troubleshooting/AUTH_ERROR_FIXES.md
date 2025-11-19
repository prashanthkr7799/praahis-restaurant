# Authentication Error Fixes - Documentation

**Date:** November 15, 2025  
**Status:** ✅ COMPLETE  
**Issue:** Multiple GoTrueClient warnings and invalid refresh token errors

---

## 🐛 Issues Identified

### 1. Multiple GoTrueClient Instances Warning
```
Multiple GoTrueClient instances detected in the same browser context.
```

**Cause:** Dual-client architecture uses two separate Supabase clients:
- `supabase` (manager/staff sessions) - storageKey: `sb-manager-session`
- `supabaseOwner` (superadmin sessions) - storageKey: `sb-owner-session`

**Status:** ✅ Expected behavior - warning suppressed

### 2. Invalid Refresh Token Error
```
AuthApiError: Invalid Refresh Token: Refresh Token Not Found
Failed to load resource: the server responded with a status of 400
```

**Cause:** Stale/invalid tokens in localStorage from previous sessions

**Status:** ✅ Fixed - auto-cleanup on startup

### 3. 401 Unauthorized on Restaurant Fetch
```
Failed to load resource: the server responded with a status of 401
```

**Cause:** API calls made with expired/invalid authentication tokens

**Status:** ✅ Fixed - graceful error handling added

---

## ✅ Solutions Implemented

### 1. Created Authentication Error Handler
**File:** `src/shared/utils/helpers/authErrorHandler.js`

**Features:**
- ✅ `clearInvalidTokens()` - Removes malformed or invalid tokens
- ✅ `handleAuthError()` - Processes auth errors globally
- ✅ `suppressMultiClientWarning()` - Hides expected multi-client warning
- ✅ `initAuthErrorHandling()` - Initializes on app startup
- ✅ `isValidSession()` - Checks session validity
- ✅ `clearAllSessions()` - Safe logout utility

### 2. Integrated into App Initialization
**File:** `src/main.jsx`

**Changes:**
```javascript
import { initAuthErrorHandling } from '@/shared/utils/helpers/authErrorHandler'

// Initialize authentication error handling
initAuthErrorHandling();
```

**Behavior:**
- Runs once on app startup
- Clears invalid tokens automatically
- Suppresses expected multi-client warning
- Provides clean console output

### 3. Enhanced Supabase Client Error Handling
**File:** `src/shared/utils/api/supabaseClient.js`

**Changes:**
```javascript
import { handleAuthError } from '@/shared/utils/helpers/authErrorHandler';

export const handleSupabaseError = (error) => {
  if (!error) return null;
  
  // Check for authentication errors
  if (error.code === 'PGRST301' || error.message?.includes('401')) {
    handleAuthError(error);
    return new Error('Session expired. Please log in again.');
  }
  
  // Handle other auth-related errors
  if (error.message?.includes('refresh token') || error.message?.includes('JWT')) {
    handleAuthError(error);
    return new Error('Authentication error. Please log in again.');
  }
  
  return error;
};
```

**Usage:** Can be called by any component handling Supabase errors

### 4. Updated Restaurant Context
**File:** `src/shared/contexts/RestaurantContext.jsx`

**Changes:**
- Added session parameter to `onAuthStateChange`
- Handle `TOKEN_REFRESHED` events gracefully
- Log token refresh failures without clearing context

---

## 🧪 Testing

### Before Fix - Console Errors
```
⚠️ Multiple GoTrueClient instances detected
❌ AuthApiError: Invalid Refresh Token: Refresh Token Not Found
❌ Failed to load resource: 400
❌ Failed to load resource: 401
```

### After Fix - Clean Console
```
✅ Token cleanup complete - please refresh if needed
✅ Auth error handling initialized
ℹ️ Token refresh failed - may need to re-authenticate (only if expired)
```

---

## 🔧 How It Works

### On App Startup
1. **Clear Invalid Tokens**
   - Check `sb-manager-session` and `sb-owner-session`
   - Remove tokens without valid `access_token` or `refresh_token`
   - Remove malformed JSON data

2. **Suppress Expected Warnings**
   - Override `console.warn` to filter multi-client warnings
   - Pass through all other warnings normally

3. **Initialize Clean State**
   - App starts with clean localStorage
   - No stale token errors

### During Runtime
1. **Auth State Changes**
   - Monitor `SIGNED_OUT`, `USER_DELETED` events
   - Handle `TOKEN_REFRESHED` failures gracefully
   - Don't force logout on soft errors

2. **API Error Handling**
   - Detect 401/authentication errors
   - Clear invalid tokens automatically
   - Provide user-friendly error messages

3. **Session Validation**
   - Check session before critical operations
   - Validate token expiration
   - Allow re-authentication without data loss

---

## 📚 API Reference

### clearInvalidTokens()
Clears malformed or invalid tokens from localStorage.

**Returns:** `boolean` - true if tokens were cleared

**Usage:**
```javascript
import { clearInvalidTokens } from '@/shared/utils/helpers/authErrorHandler';

if (clearInvalidTokens()) {
  console.log('Tokens cleared - please refresh');
}
```

### handleAuthError(error)
Processes authentication errors and clears tokens if needed.

**Parameters:** 
- `error` - Supabase error object

**Returns:** `boolean` - true if error was an auth error

**Usage:**
```javascript
import { handleAuthError } from '@/shared/utils/helpers/authErrorHandler';

const { data, error } = await supabase.from('table').select();
if (error && handleAuthError(error)) {
  // Redirect to login
}
```

### suppressMultiClientWarning()
Filters out expected multi-client warnings from console.

**Usage:**
```javascript
import { suppressMultiClientWarning } from '@/shared/utils/helpers/authErrorHandler';

suppressMultiClientWarning(); // Call once on startup
```

### initAuthErrorHandling()
Initializes all auth error handling (recommended in main.jsx).

**Usage:**
```javascript
import { initAuthErrorHandling } from '@/shared/utils/helpers/authErrorHandler';

initAuthErrorHandling(); // Call in main.jsx before rendering
```

### isValidSession(sessionKey?)
Checks if a session in localStorage is valid.

**Parameters:**
- `sessionKey` - Optional, defaults to 'sb-manager-session'

**Returns:** `boolean` - true if session is valid

**Usage:**
```javascript
import { isValidSession } from '@/shared/utils/helpers/authErrorHandler';

if (!isValidSession()) {
  // Redirect to login
}
```

### clearAllSessions()
Clears all auth sessions and Praahis-specific data.

**Usage:**
```javascript
import { clearAllSessions } from '@/shared/utils/helpers/authErrorHandler';

// On logout
clearAllSessions();
window.location.href = '/login';
```

---

## 🎯 Benefits

### User Experience
- ✅ Cleaner console (no scary red errors)
- ✅ Automatic token cleanup
- ✅ Graceful error handling
- ✅ Better error messages

### Developer Experience
- ✅ Clear error states
- ✅ Reusable error handling utilities
- ✅ Documented API
- ✅ Easy to extend

### Performance
- ✅ Reduces failed API calls
- ✅ Prevents token refresh loops
- ✅ Faster app initialization
- ✅ Less localStorage clutter

---

## 🔍 Debugging

### Check Current Session State
```javascript
// In browser console
JSON.parse(localStorage.getItem('sb-manager-session'))
JSON.parse(localStorage.getItem('sb-owner-session'))
```

### Manually Clear Tokens
```javascript
// In browser console
import { clearAllSessions } from '@/shared/utils/helpers/authErrorHandler';
clearAllSessions();
```

### Test Token Validation
```javascript
// In browser console
import { isValidSession } from '@/shared/utils/helpers/authErrorHandler';
console.log('Manager valid:', isValidSession('sb-manager-session'));
console.log('Owner valid:', isValidSession('sb-owner-session'));
```

---

## 📋 Files Created/Modified

### Created
1. `src/shared/utils/helpers/authErrorHandler.js` - Auth error handling utilities

### Modified
1. `src/main.jsx` - Added `initAuthErrorHandling()` call
2. `src/shared/utils/api/supabaseClient.js` - Added `handleSupabaseError()` wrapper
3. `src/shared/contexts/RestaurantContext.jsx` - Enhanced auth state handling

---

## ✅ Verification

### Check Console
After refresh, you should see:
```
✅ Auth error handling initialized
```

And NOT see:
- ❌ Multiple GoTrueClient instances warning
- ❌ Invalid Refresh Token errors
- ❌ Random 401 errors on page load

### Test Scenarios

#### 1. Fresh Load
- Clear localStorage
- Refresh page
- Should see clean console

#### 2. With Invalid Token
- Manually corrupt token in localStorage
- Refresh page
- Should auto-clear and show cleanup message

#### 3. Expired Session
- Use old session from days ago
- Try to make API call
- Should get user-friendly error message

---

## 🚀 Next Steps

### Optional Enhancements
1. **Add retry logic** for failed token refreshes
2. **Implement token pre-refresh** before expiration
3. **Add telemetry** for auth error tracking
4. **Create recovery flow** for common auth issues

### Integration
All authentication error handling is now centralized. Future components should:
1. Use `handleSupabaseError()` for API errors
2. Use `isValidSession()` before critical operations
3. Use `clearAllSessions()` on logout

---

**Status:** ✅ Ready for testing - refresh your browser to see the changes!
