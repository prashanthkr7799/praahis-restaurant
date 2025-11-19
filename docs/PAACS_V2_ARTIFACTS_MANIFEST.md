# PAACS v2.0 Implementation Artifacts — Complete Package

**Status:** ✅ **Core artifacts generated** | 📋 Additional files ready for generation  
**Generated:** November 10, 2025  
**Version:** 1.0

---

## ✅ Files Already Created (Ready to Use)

### 📊 Documentation
1. **`docs/PAACS_V2_IMPLEMENTATION_STATUS.md`** ✅ CREATED
   - Complete implementation status analysis
   - Module-by-module gap analysis  
   - 8-phase implementation plan (30 days)
   - Risk assessment & mitigation strategies
   - Success metrics & KPIs
   - Post-deployment checklist
   - **Action:** Review with team, approve timeline

### 🗄️ Database Migrations
2. **`database/migrations/20251110_paacs_v2_up.sql`** ✅ CREATED
   - Adds `user_sessions` table (multi-device tracking)
   - Adds `auth_activity_logs` table (audit trail)
   - Adds `password_reset_tokens` table
   - Alters `users` table (security columns)
   - Creates helper functions & triggers
   - Adds RLS policies
   - **Action:** Run on staging first, then production

3. **`database/migrations/20251110_paacs_v2_down.sql`** ✅ CREATED
   - Rollback script (removes all changes)
   - **Action:** Keep for emergency rollback

### 🔧 Backend Utilities
4. **`src/lib/auth/tokens.js`** ✅ CREATED (443 lines)
   - `createAccessToken()` — 15-minute JWT
   - `createRefreshToken()` — 8h/30d JWT
   - `verifyAccessToken()` / `verifyRefreshToken()`
   - `rotateRefreshToken()` — Token rotation logic
   - Cookie utilities (HttpOnly, Secure, SameSite)
   - Validation helpers
   - Key generation utility
   - **Dependencies:** `jsonwebtoken`, `uuid`
   - **Action:** Run `npm install jsonwebtoken uuid`

5. **`src/lib/auth/sessions.js`** ✅ CREATED (426 lines)
   - `createSession()` — Session creation
   - `getSession()` / `getUserSessions()` — Retrieval
   - `updateSessionActivity()` — Track last active
   - `updateSessionTokens()` — Token rotation
   - `revokeSession()` / `revokeAllUserSessions()` — Revocation
   - `isSessionValid()` / `validateSessionJti()` — Validation
   - `cleanupExpiredSessions()` — Cron job function
   - Analytics functions
   - **Dependencies:** Your Supabase client
   - **Action:** Verify `src/lib/supabase.js` exists

6. **`src/lib/auth/logs.js`** ✅ CREATED (474 lines)
   - `logAuthEvent()` — Core logging function
   - Convenience functions: `logLoginSuccess()`, `logLoginFailure()`, etc.
   - `AUTH_EVENTS` constants (login, logout, password, 2FA)
   - `FAILURE_REASONS` constants (invalid_password, account_locked, etc.)
   - Query functions: `getUserAuthActivity()`, `getFailedLoginCount()`
   - `getAuthStats()` — Security dashboard metrics
   - `cleanupOldAuthLogs()` — Retention policy enforcement
   - **Action:** Ready to use

---

## 📋 Files To Be Generated (Next Batch)

### 🔌 API Routes (Next.js Pages API)
**Location:** `src/pages/api/auth/`

#### 7. `login.js` (POST /api/auth/login)
**Purpose:** Dual-token authentication with lockout enforcement
**Features:**
- Email/password validation
- Account lockout check (5 failures → 15 min lock)
- bcrypt password verification
- Session creation in database
- Access token (15 min) + Refresh token (HttpOnly cookie)
- Audit logging (success/failure)
- i18n error messages
- Remember Me support (30 days vs 8 hours)

**Key Code:**
```javascript
import bcrypt from 'bcrypt';
import { createAccessToken, createRefreshToken, generateRefreshTokenCookie } from '@/lib/auth/tokens';
import { createSession } from '@/lib/auth/sessions';
import { logLoginSuccess, logLoginFailure, logAccountLocked, FAILURE_REASONS } from '@/lib/auth/logs';
import { getUserByEmail, incrementFailedAttempts, resetFailedAttempts } from '@/lib/db/users';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });
  
  const { email, password, device_name, remember_me } = req.body;
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const ua = req.headers['user-agent'];
  
  // Validate input
  if (!email || !password) {
    return res.status(400).json({ error: 'email_password_required' });
  }
  
  // Get user
  const user = await getUserByEmail(email);
  if (!user) {
    await logLoginFailure({ email, ipAddress: ip, deviceInfo: ua, reason: FAILURE_REASONS.USER_NOT_FOUND });
    return res.status(401).json({ error: 'login_invalid' });
  }
  
  // Check lockout
  if (user.account_locked_until && new Date(user.account_locked_until) > new Date()) {
    const minutesLeft = Math.ceil((new Date(user.account_locked_until) - new Date()) / 60000);
    await logAccountLocked({ userId: user.id, email, ipAddress: ip, deviceInfo: ua, lockDurationMinutes: minutesLeft });
    return res.status(423).json({ error: 'account_locked', minutes: minutesLeft });
  }
  
  // Verify password
  const pwdOk = await bcrypt.compare(password, user.password_hash);
  if (!pwdOk) {
    await incrementFailedAttempts(user.id);
    await logLoginFailure({ userId: user.id, email, ipAddress: ip, deviceInfo: ua, reason: FAILURE_REASONS.INVALID_PASSWORD });
    return res.status(401).json({ error: 'login_invalid' });
  }
  
  // Success - reset counters
  await resetFailedAttempts(user.id);
  
  // Create session
  const expiresAt = new Date(Date.now() + (remember_me ? 30*24*3600*1000 : 8*3600*1000));
  const { token: accessToken, jti: accessJti } = createAccessToken({
    sub: user.id,
    role: user.role,
    restaurant_id: user.restaurant_id
  });
  const { token: refreshToken, jti: refreshJti } = createRefreshToken({ sub: user.id }, { rememberMe: !!remember_me });
  
  const session = await createSession({
    userId: user.id,
    restaurantId: user.restaurant_id,
    accessJti,
    refreshJti,
    deviceName: device_name || 'Unknown Device',
    ipAddress: ip,
    userAgent: ua,
    expiresAt
  });
  
  // Set refresh token cookie
  res.setHeader('Set-Cookie', generateRefreshTokenCookie(refreshToken, remember_me ? 30*24*3600 : 8*3600));
  
  // Log success
  await logLoginSuccess({ userId: user.id, restaurantId: user.restaurant_id, email, ipAddress: ip, deviceInfo: ua });
  
  // Return access token and user meta
  return res.status(200).json({
    access_token: accessToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      restaurant_id: user.restaurant_id,
      must_change_password: user.must_change_password
    }
  });
}
```

**Dependencies:** `bcrypt`, user DB utilities
**Priority:** 🔴 CRITICAL (Phase 2, Day 4-5)

---

#### 8. `refresh-token.js` (POST /api/auth/refresh-token)
**Purpose:** Token rotation with JTI validation
**Features:**
- Extract refresh token from HttpOnly cookie
- Verify refresh token signature
- Validate session in database
- Check JTI match (prevent replay attacks)
- Rotate refresh token (new JTI)
- Issue new access token
- Update session in database
- Detect token reuse → revoke session

**Key Logic:**
```javascript
// 1. Extract cookie
const refreshToken = cookies.refresh_token;
if (!refreshToken) return res.status(401).json({ error: 'no_refresh_token' });

// 2. Verify token
const payload = verifyRefreshToken(refreshToken);
if (!payload) return res.status(401).json({ error: 'invalid_refresh_token' });

// 3. Get session from DB
const session = await getSessionByRefreshJti(payload.jti);
if (!session || !session.is_active) {
  return res.status(401).json({ error: 'session_inactive' });
}

// 4. Check JTI match (critical for security!)
if (session.refresh_jti !== payload.jti) {
  // Possible token replay attack - revoke session immediately
  await revokeSession(session.session_id);
  await logSuspiciousActivity({ userId: payload.sub, description: 'refresh_token_jti_mismatch' });
  return res.status(401).json({ error: 'token_replay_detected' });
}

// 5. Rotate tokens
const { token: newAccessToken, jti: newAccessJti } = createAccessToken({ sub: payload.sub, role: session.role, restaurant_id: session.restaurant_id, session_id: session.session_id });
const { token: newRefreshToken, jti: newRefreshJti } = rotateRefreshToken(payload, session.remember_me);

// 6. Update session in DB
await updateSessionTokens(session.session_id, newRefreshJti, newAccessJti, new Date(Date.now() + 8*3600*1000));

// 7. Set new refresh cookie
res.setHeader('Set-Cookie', generateRefreshTokenCookie(newRefreshToken, 8*3600));

// 8. Return new access token
return res.status(200).json({ access_token: newAccessToken });
```

**Priority:** 🔴 CRITICAL (Phase 2, Day 6-7)

---

#### 9. `logout.js` (POST /api/auth/logout)
**Purpose:** Revoke session and clear cookies
**Features:**
- Extract session_id from body or refresh token
- Revoke session in database (is_active = FALSE)
- Clear refresh token cookie
- Log logout event

**Priority:** 🟡 HIGH (Phase 4, Day 11)

---

#### 10. `sessions.js` (GET /api/auth/sessions)
**Purpose:** List all active sessions for current user
**Features:**
- Extract user from access token
- Query `user_sessions` table
- Return array of sessions with device info, last active, created date
- Used for "Manage Devices" UI

**Priority:** 🟡 HIGH (Phase 4, Day 11-12)

---

#### 11. `sessions/[id]/revoke.js` (POST /api/auth/sessions/:id/revoke)
**Purpose:** Logout a specific device
**Features:**
- Verify user owns the session
- Revoke session by session_id
- Return success

**Priority:** 🟡 HIGH (Phase 4, Day 11-12)

---

#### 12. `forgot-password.js` (POST /api/auth/forgot-password)
**Purpose:** Generate password reset token and send email
**Features:**
- Validate email exists
- Create reset token (UUID, expires in 15 minutes)
- Insert into `password_reset_tokens` table
- Send email with reset link
- Log event

**Priority:** 🟡 HIGH (Phase 4, Day 13-14)

---

#### 13. `reset-password.js` (POST /api/auth/reset-password)
**Purpose:** Reset password using token
**Features:**
- Validate token (not used, not expired)
- Validate new password (strength requirements)
- Hash password with bcrypt
- Update user password
- Mark token as used
- Revoke all user sessions (force re-login)
- Log event

**Priority:** 🟡 HIGH (Phase 4, Day 13-14)

---

### 🛡️ Middleware
**Location:** `src/middleware.js` (Next.js root)

#### 14. `middleware.js`
**Purpose:** Token validation on every protected route
**Features:**
- Extract access token from Authorization header
- Verify token signature
- Check session is active in database
- Attach user data to request
- Allow/deny based on route + role

**Key Code:**
```javascript
import { NextResponse } from 'next/server';
import { verifyAccessToken } from './lib/auth/tokens';
import { getSession, isSessionValid } from './lib/auth/sessions';

export async function middleware(req) {
  const authHeader = req.headers.get('authorization');
  const pathname = req.nextUrl.pathname;
  
  // Public routes (skip authentication)
  const publicRoutes = ['/api/auth/login', '/api/auth/forgot-password', '/api/auth/reset-password'];
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }
  
  // Protected routes require valid token
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new NextResponse(JSON.stringify({ error: 'unauthorized', message: 'No access token provided' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  const token = authHeader.split(' ')[1];
  const payload = verifyAccessToken(token);
  
  if (!payload) {
    return new NextResponse(JSON.stringify({ error: 'invalid_token', message: 'Access token invalid or expired' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // Check session is active
  const session = await getSession(payload.session_id);
  if (!session || !isSessionValid(session)) {
    return new NextResponse(JSON.stringify({ error: 'session_inactive', message: 'Session has been revoked or expired' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // Attach user to request (via header - Next.js Edge limitation)
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-user-id', payload.sub);
  requestHeaders.set('x-user-role', payload.role);
  requestHeaders.set('x-restaurant-id', payload.restaurant_id);
  
  return NextResponse.next({
    request: {
      headers: requestHeaders
    }
  });
}

export const config = {
  matcher: [
    '/api/:path*', // Protect all API routes
    '/dashboard/:path*', // Protect dashboard pages
    '/manager/:path*',
    '/chef/:path*',
    '/superadmin/:path*'
  ]
};
```

**Priority:** 🔴 CRITICAL (Phase 3, Day 8)

---

### 🎨 Frontend Components

#### 15. `src/app/(auth)/login/page.jsx`
**Purpose:** Unified login page with i18n and Remember Me
**Features:**
- Email + Password fields
- Remember Me checkbox (30 days vs 8 hours)
- Client-side validation (email format, password length)
- Loading states
- Error display with i18n
- Forgot password link
- SuperAdmin login link
- Role-based redirect after login

**Code:** Already provided in original prompt (see Section 7)
**Priority:** 🟡 MEDIUM (Phase 3, Day 9)

---

#### 16. `src/components/auth/SilentRefresh.jsx`
**Purpose:** Background token refresh before expiry
**Features:**
- Monitors access token expiry time
- Calls refresh endpoint 2 minutes before expiry
- Updates in-memory access token
- Graceful logout if refresh fails
- No user interruption

**Key Logic:**
```javascript
import { useEffect } from 'react';
import { getTimeUntilExpiry } from '@/lib/auth/tokens';
import axios from 'axios';

export default function SilentRefresh({ accessToken, onTokenRefreshed, onLogout }) {
  useEffect(() => {
    if (!accessToken) return;
    
    const checkToken = () => {
      const timeLeft = getTimeUntilExpiry(accessToken);
      
      // Refresh if less than 2 minutes left
      if (timeLeft < 2 * 60 * 1000 && timeLeft > 0) {
        refreshToken();
      }
    };
    
    const refreshToken = async () => {
      try {
        const resp = await axios.post('/api/auth/refresh-token');
        onTokenRefreshed(resp.data.access_token);
      } catch (err) {
        console.error('Silent refresh failed:', err);
        onLogout(); // Force logout
      }
    };
    
    // Check every 30 seconds
    const interval = setInterval(checkToken, 30 * 1000);
    checkToken(); // Immediate check
    
    return () => clearInterval(interval);
  }, [accessToken, onTokenRefreshed, onLogout]);
  
  return null; // No UI
}
```

**Priority:** 🟡 MEDIUM (Phase 3, Day 10)

---

#### 17. `src/app/(dashboard)/sessions/page.jsx`
**Purpose:** Multi-device session management UI
**Features:**
- List all active sessions with device, IP, last active
- Highlight current session
- "Logout This Device" button
- "Logout All Other Devices" button
- Confirmation modals

**Priority:** 🟡 MEDIUM (Phase 4, Day 11-12)

---

### 🌐 Internationalization

#### 18-21. Language Files
**Location:** `src/i18n/`
- `en.json` (English)
- `hi.json` (Hindi)
- `te.json` (Telugu)
- `ta.json` (Tamil)

**Content:** 50+ authentication messages

**Sample** (`en.json`):
```json
{
  "login_invalid": "Invalid email or password. Please try again.",
  "account_locked": "Account temporarily locked due to multiple failed attempts. Try again in {minutes} minutes.",
  "email_required": "Please enter your email address.",
  "password_required": "Please enter your password.",
  "login_success": "Login successful! Redirecting...",
  "session_expired": "Your session has expired. Please log in again.",
  "token_refresh_failed": "Session refresh failed. Please log in again.",
  "logout_success": "You have been logged out successfully.",
  "password_reset_sent": "Password reset instructions sent to your email.",
  "password_reset_success": "Password reset successful. Please log in with your new password.",
  "invalid_token": "Invalid or expired reset token.",
  "weak_password": "Password must be at least 8 characters with uppercase, lowercase, number, and special character.",
  "device_logged_out": "Device logged out successfully.",
  "all_devices_logged_out": "All devices logged out successfully.",
  "2fa_required": "Two-factor authentication required.",
  "invalid_2fa_code": "Invalid authentication code."
}
```

**Priority:** 🟢 MEDIUM (Phase 5, Day 15-16)

---

### 🧪 Tests

#### 22. `tests/unit/auth.tokens.test.js`
**Purpose:** Unit tests for token utilities
**Tests:**
- Access token creation and verification
- Refresh token creation and verification
- Token rotation
- Expiry detection
- Cookie generation

**Framework:** Jest or Vitest
**Priority:** 🟢 LOW (Phase 7, Day 21)

---

#### 23. `tests/integration/auth.login.test.js`
**Purpose:** Integration tests for login flow
**Tests:**
- Successful login creates session
- Failed login increments counter
- Account lockout after 5 failures
- Lockout expires after 15 minutes
- Remember Me extends session

**Framework:** Jest + Supertest
**Priority:** 🟢 LOW (Phase 7, Day 21)

---

#### 24. `tests/security/auth.security.test.js`
**Purpose:** Security tests
**Tests:**
- SQL injection attempts
- XSS in inputs
- CSRF protection
- Token replay attacks
- Session hijacking attempts

**Framework:** Jest + OWASP ZAP
**Priority:** 🟢 LOW (Phase 7, Day 21-22)

---

### 📝 Configuration

#### 25. `.env.example`
```bash
# PAACS v2.0 Configuration

# Feature Flags
PAACS_V2_ENABLED=false

# JWT Token Keys (RS256)
ACCESS_TOKEN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
ACCESS_TOKEN_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"
REFRESH_TOKEN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
REFRESH_TOKEN_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"

# Database (Supabase)
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Email Service
EMAIL_PROVIDER=sendgrid # sendgrid | aws-ses | postmark
EMAIL_API_KEY=your_email_api_key
EMAIL_FROM=noreply@praahis.com

# Security Settings
LOCKOUT_THRESHOLD=5
LOCKOUT_DURATION_MINUTES=15
PASSWORD_RESET_TOKEN_EXPIRY_MINUTES=15
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY_DEFAULT=8h
REFRESH_TOKEN_EXPIRY_REMEMBER_ME=30d

# Monitoring
SENTRY_DSN=your_sentry_dsn
LOG_LEVEL=info # debug | info | warn | error
```

**Priority:** 🔴 CRITICAL (Phase 0, Day 0)

---

#### 26. `scripts/generate-jwt-keys.js`
**Purpose:** Generate RSA key pairs for JWT signing
```javascript
const crypto = require('crypto');
const fs = require('fs');

function generateKeyPair(name) {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
  });
  
  fs.writeFileSync(`${name}_public.pem`, publicKey);
  fs.writeFileSync(`${name}_private.pem`, privateKey);
  
  console.log(`✅ Generated ${name} key pair`);
}

generateKeyPair('access_token');
generateKeyPair('refresh_token');

console.log('\n📋 Copy these keys to your .env file:');
console.log('ACCESS_TOKEN_PRIVATE_KEY="' + fs.readFileSync('access_token_private.pem', 'utf8').replace(/\n/g, '\\n') + '"');
console.log('ACCESS_TOKEN_PUBLIC_KEY="' + fs.readFileSync('access_token_public.pem', 'utf8').replace(/\n/g, '\\n') + '"');
console.log('REFRESH_TOKEN_PRIVATE_KEY="' + fs.readFileSync('refresh_token_private.pem', 'utf8').replace(/\n/g, '\\n') + '"');
console.log('REFRESH_TOKEN_PUBLIC_KEY="' + fs.readFileSync('refresh_token_public.pem', 'utf8').replace(/\n/g, '\\n') + '"');
```

**Usage:** `node scripts/generate-jwt-keys.js`
**Priority:** 🔴 CRITICAL (Phase 0, Day 0)

---

### 📚 Documentation

#### 27. `docs/PAACS_V2_DEPLOYMENT_GUIDE.md`
**Content:**
- Prerequisites checklist
- Step-by-step deployment instructions
- Database migration commands
- Environment variable setup
- Rollback procedures
- Smoke testing checklist
- Monitoring setup

**Priority:** 🟢 MEDIUM (Phase 7, Day 23)

---

#### 28. `docs/PAACS_V2_API_REFERENCE.md`
**Content:**
- All authentication endpoints documented
- Request/response examples
- Error codes and meanings
- Authentication flow diagrams
- Token lifecycle diagrams

**Priority:** 🟢 MEDIUM (Phase 7, Day 23)

---

#### 29. `CHANGELOG.md` (update)
```markdown
## [2.0.0] - 2025-11-10

### Added - PAACS v2.0 (Fusion Edition)
- **Dual-Token Authentication:** Access tokens (15 min) + Refresh tokens (8h/30d) with HttpOnly cookies
- **Multi-Device Session Management:** Track and revoke sessions per device
- **Account Lockout:** 5 failed attempts → 15 minute lock
- **Comprehensive Audit Logging:** All auth events logged to `auth_activity_logs`
- **Token Rotation:** Refresh tokens rotate on each use (prevents replay attacks)
- **Silent Token Refresh:** Background refresh before expiry (no user disruption)
- **Internationalization:** English, Hindi, Telugu, Tamil auth messages
- **Password Reset Flow:** Secure token-based password recovery
- **Automatic Session Revocation:** On password change, role change, or deactivation
- **Security Dashboard:** Failed login tracking, active session monitoring
- **SuperAdmin 2FA:** TOTP-based two-factor authentication (Phase 2)

### Changed
- Login endpoint now returns dual tokens
- All API routes require session validation
- Database schema updated (3 new tables, users table enhanced)

### Security
- Mitigated brute force attacks via account lockout
- Prevented token replay attacks via JTI validation
- Implemented CSRF protection via SameSite cookies
- Added comprehensive authentication audit trail

### Database Migrations
- Run `20251110_paacs_v2_up.sql` to upgrade
- Run `20251110_paacs_v2_down.sql` to rollback (if needed)
```

**Priority:** 🟢 LOW (Phase 7, Day 23)

---

## 🚀 Quick Start Guide

### Phase 0: Immediate Setup (Today)

1. **Review Implementation Status Document**
   ```bash
   open docs/PAACS_V2_IMPLEMENTATION_STATUS.md
   ```
   
2. **Generate JWT Keys**
   ```bash
   node scripts/generate-jwt-keys.js
   # Copy output to .env
   ```

3. **Install Dependencies**
   ```bash
   npm install jsonwebtoken uuid bcrypt
   ```

4. **Create Feature Branch**
   ```bash
   git checkout -b feature/paacs-v2-fusion
   ```

5. **Run Database Migration on Staging**
   ```bash
   psql $STAGING_DB_URL -f database/migrations/20251110_paacs_v2_up.sql
   ```

6. **Verify Migration**
   ```bash
   psql $STAGING_DB_URL -c "SELECT table_name FROM information_schema.tables WHERE table_name IN ('user_sessions', 'auth_activity_logs', 'password_reset_tokens');"
   # Should return 3 rows
   ```

### Phase 1: Backend Foundation (Days 1-3)

✅ **Already Complete:**
- Database tables created
- Token utilities implemented
- Session management implemented
- Audit logging implemented

**Next Steps:**
- Write unit tests for utilities
- Test token creation/verification
- Test session CRUD operations

### Phase 2: Authentication Core (Days 4-7)

**TODO:**
- Implement login endpoint (use code from Section 7 above)
- Implement refresh-token endpoint (use code from Section 8)
- Implement logout endpoint
- Write integration tests

### Phase 3-8: See Implementation Status Document

---

## 📦 Package Dependencies

Add to `package.json`:
```json
{
  "dependencies": {
    "jsonwebtoken": "^9.0.2",
    "uuid": "^9.0.0",
    "bcrypt": "^5.1.1",
    "otplib": "^12.0.1",
    "qrcode": "^1.5.3",
    "nookies": "^2.5.2"
  },
  "devDependencies": {
    "jest": "^29.7.0",
    "@types/jest": "^29.5.5",
    "supertest": "^6.3.3"
  }
}
```

---

## 🔍 Verification Checklist

After implementing each phase, verify:

### Database
- [ ] All tables exist: `user_sessions`, `auth_activity_logs`, `password_reset_tokens`
- [ ] Users table has new columns: `failed_login_attempts`, `account_locked_until`, etc.
- [ ] Triggers are active: `\dS users` shows triggers
- [ ] RLS policies exist: `\d user_sessions` shows policies

### Backend
- [ ] Token utilities work: Run `node -e "require('./src/lib/auth/tokens').generateRSAKeyPair()"`
- [ ] Session functions work: Test `createSession()` with mock data
- [ ] Logging works: Check `auth_activity_logs` table has rows

### API Routes
- [ ] Login returns access token + sets refresh cookie
- [ ] Refresh rotates tokens successfully
- [ ] Logout clears cookie and revokes session
- [ ] Middleware blocks requests without valid token

### Frontend
- [ ] Login page displays and submits
- [ ] Silent refresh runs in background
- [ ] Sessions page lists devices
- [ ] i18n messages display in correct language

### Security
- [ ] Refresh tokens are HttpOnly and Secure
- [ ] SameSite=Strict prevents CSRF
- [ ] Failed logins increment counter
- [ ] Account locks after 5 failures
- [ ] Password reset tokens expire

---

## 📞 Support & Next Steps

**You now have:**
✅ Complete implementation plan (30 days, 8 phases)
✅ Database migrations (up/down)
✅ Backend utilities (tokens, sessions, logs)
✅ Detailed code samples for API routes
✅ Frontend component samples
✅ i18n templates
✅ Testing strategy
✅ Deployment guide outline

**To proceed:**

1. **Generate remaining files:** Let me know which specific files you want generated next (API routes, frontend components, i18n, tests). I can create them individually or in batches.

2. **Start implementation:** Follow the phase-by-phase plan in the Implementation Status document. Each phase is atomic and testable.

3. **Questions:** Ask about any specific implementation details, architecture decisions, or security concerns.

**Command to generate next batch:**
Just say: **"Generate API routes"** or **"Generate frontend components"** or **"Generate i18n files"** and I'll create the complete implementations.

---

**Status:** 📊 **6 core files created** | 📋 **23 additional files ready to generate**
**Estimated completion time:** 30 days (with team of 2-3 developers)
**Risk level:** Medium (with proper testing and phased rollout)

---

*End of Artifact Manifest*
