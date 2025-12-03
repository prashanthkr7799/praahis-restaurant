# PAACS v2.0 Security Upgrade - Deployment Guide

## Overview

PAACS v2.0 (Praahis Advanced Authentication & Control System) adds enterprise-grade security features:

- ✅ **Account Lockout** - 5 failed attempts → 15 minute lockout
- ✅ **Session Management** - Multi-device tracking, max 5 sessions per user
- ✅ **Rate Limiting** - API rate limiting per user/IP
- ✅ **Security Events Logging** - Comprehensive audit trail
- ✅ **Token Rotation** - Refresh token rotation support

---

## Deployment Steps

### Step 1: Backup Database

```bash
# Create a backup before migration
supabase db dump -f backup_before_paacs_v2.sql
```

### Step 2: Run Migration

```bash
# Using Supabase CLI
supabase db push --include-schema

# Or manually in Supabase Dashboard SQL Editor:
# Copy contents of: supabase/migrations/20241202_paacs_v2_up.sql
```

### Step 3: Verify Tables Created

```sql
-- Run in Supabase SQL Editor
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('security_events', 'user_sessions', 'rate_limits');
```

Expected output: 3 tables

### Step 4: Verify Functions Created

```sql
-- Check security functions
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE '%login%' OR routine_name LIKE '%session%';
```

Expected functions:

- `is_account_locked`
- `record_failed_login`
- `record_successful_login`
- `create_user_session`
- `revoke_user_session`
- `revoke_all_user_sessions`
- `check_rate_limit`

### Step 5: Verify User Table Columns

```sql
-- Check new columns added to users table
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'users'
AND column_name IN (
  'failed_login_attempts',
  'account_locked_until',
  'last_login_at',
  'last_login_ip',
  'password_changed_at',
  'mfa_enabled'
);
```

---

## Usage Examples

### Check if Account is Locked

```javascript
const { data, error } = await supabase.rpc('is_account_locked', {
  p_user_id: userId,
});

if (data === true) {
  throw new Error('Account is locked. Please try again later.');
}
```

### Record Failed Login

```javascript
const { data, error } = await supabase.rpc('record_failed_login', {
  p_user_id: userId,
  p_ip_address: clientIP,
  p_user_agent: navigator.userAgent,
});

// data returns: { attempts, max_attempts, is_locked, lockout_minutes }
```

### Record Successful Login

```javascript
await supabase.rpc('record_successful_login', {
  p_user_id: userId,
  p_ip_address: clientIP,
  p_user_agent: navigator.userAgent,
});
```

### Create Session

```javascript
const { data: sessionId } = await supabase.rpc('create_user_session', {
  p_user_id: userId,
  p_refresh_token_hash: hashToken(refreshToken),
  p_device_info: { browser: 'Chrome', os: 'macOS' },
  p_ip_address: clientIP,
  p_user_agent: navigator.userAgent,
  p_expires_in_days: 30,
});
```

### Logout from All Devices

```javascript
const { data: sessionsRevoked } = await supabase.rpc('revoke_all_user_sessions', {
  p_user_id: userId,
});
```

### Check Rate Limit

```javascript
const { data } = await supabase.rpc('check_rate_limit', {
  p_identifier: userId || clientIP,
  p_endpoint: '/api/login',
  p_max_requests: 10,
  p_window_seconds: 60,
});

if (!data.allowed) {
  throw new Error(`Rate limit exceeded. Try again in ${data.reset_at}`);
}
```

---

## Rollback (if needed)

```bash
# Run the down migration
psql $DATABASE_URL -f supabase/migrations/20241202_paacs_v2_down.sql
```

---

## Cleanup Jobs

Set up these cleanup jobs using Supabase pg_cron or Edge Functions:

### Daily Cleanup (recommended)

```sql
-- Clean expired sessions (run daily)
SELECT public.cleanup_expired_sessions();

-- Clean old rate limits (run hourly)
SELECT public.cleanup_rate_limits();

-- Clean old security events (run weekly, keeps 90 days)
SELECT public.cleanup_security_events();
```

### Using pg_cron

```sql
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule cleanup jobs
SELECT cron.schedule('cleanup-sessions', '0 3 * * *', 'SELECT public.cleanup_expired_sessions()');
SELECT cron.schedule('cleanup-rate-limits', '0 * * * *', 'SELECT public.cleanup_rate_limits()');
SELECT cron.schedule('cleanup-security-events', '0 4 * * 0', 'SELECT public.cleanup_security_events()');
```

---

## Environment Variables

Add to your `.env`:

```env
# PAACS v2.0 Configuration
VITE_PAACS_V2_ENABLED=true
VITE_MAX_LOGIN_ATTEMPTS=5
VITE_LOCKOUT_MINUTES=15
VITE_MAX_SESSIONS_PER_USER=5
VITE_SESSION_EXPIRY_DAYS=30
```

---

## Migration Complete ✅

Your Praahis installation now has enterprise-grade security features:

| Feature          | Status    |
| ---------------- | --------- |
| Account Lockout  | ✅ Active |
| Session Tracking | ✅ Active |
| Rate Limiting    | ✅ Active |
| Security Logging | ✅ Active |
| Token Rotation   | ✅ Ready  |

---

**Migration Version:** 20241202  
**Last Updated:** December 2, 2024
