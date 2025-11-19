# PAACS v2.0 (Fusion Edition) — Implementation Status & Upgrade Plan

**Project:** Praahis Restaurant Management System  
**Document Version:** 1.0  
**Date:** November 10, 2025  
**Status:** Ready for Implementation

---

## Executive Summary

This document maps the current Praahis implementation against **PAACS v2.0 (Fusion Edition)** authentication and security architecture. Based on project analysis, we have identified what exists, what's partial, and what needs to be implemented.

**Current State:**
- ✅ Multi-role system (Chef/Waiter/Manager/SuperAdmin) operational
- ✅ Dashboard UIs for Manager and SuperAdmin built
- ✅ Login UI design specifications complete
- ⚠️ Basic authentication exists but lacks dual-token system
- ⚠️ Session management UI prototypes exist but backend incomplete
- ❌ Multi-device session tracking not implemented
- ❌ Token rotation and refresh flows missing
- ❌ Account lockout enforcement absent
- ❌ Comprehensive audit logging missing
- ❌ i18n authentication messages not wired

**Upgrade Impact:** Medium-High
- Database schema changes required (additive only, reversible)
- New API endpoints needed (backward compatible possible)
- Frontend authentication flow modifications required
- Zero data loss, minimal user disruption with phased rollout

---

## 1. Module-by-Module Status Analysis

### Module 1: Unified Login Page
| Component | Status | Evidence | Priority |
|-----------|--------|----------|----------|
| UI Design | ✅ Complete | Design specs documented | - |
| Pre-validation (client) | ⚠️ Partial | Basic validation exists | HIGH |
| Remember Me checkbox | ❌ Not implemented | Feature missing | HIGH |
| i18n error messages | ❌ Not implemented | No language files | MEDIUM |
| Loading states | ⚠️ Partial | Basic UI exists | LOW |

**Next Action:** Implement Remember Me feature and wire i18n translations

---

### Module 2: Database Schema (Auth Foundation)
| Component | Status | Evidence | Priority |
|-----------|--------|----------|----------|
| `users` security fields | ❌ Missing | No lockout columns | **CRITICAL** |
| `user_sessions` table | ❌ Not exists | Multi-device tracking absent | **CRITICAL** |
| `auth_activity_logs` | ❌ Not exists | No audit trail | **CRITICAL** |
| `password_reset_tokens` | ❌ Not exists | Reset flow incomplete | HIGH |

**Next Action:** Run database migration (provided in migrations/ folder)

---

### Module 3: Dual-Token Authentication System
| Component | Status | Evidence | Priority |
|-----------|--------|----------|----------|
| Access token (JWT, 15min) | ❌ Not implemented | Single token used | **CRITICAL** |
| Refresh token (HttpOnly cookie) | ❌ Not implemented | No refresh mechanism | **CRITICAL** |
| Token rotation on refresh | ❌ Not implemented | Security gap | **CRITICAL** |
| JTI-based revocation | ❌ Not implemented | Can't revoke tokens | HIGH |
| In-memory access token | ❌ Not implemented | Token may be in localStorage | HIGH |

**Next Action:** Implement token utilities and refresh endpoint

---

### Module 4: Anti-Bruteforce & Account Lockout
| Component | Status | Evidence | Priority |
|-----------|--------|----------|----------|
| Failed login counter | ❌ Not implemented | No tracking | **CRITICAL** |
| Automatic lockout (5 fails) | ❌ Not implemented | Brute force possible | **CRITICAL** |
| Lockout duration (15 min) | ❌ Not implemented | No timeout | HIGH |
| Manager unlock capability | ❌ Not implemented | No admin override | MEDIUM |
| Lockout audit logs | ❌ Not implemented | No visibility | MEDIUM |

**Next Action:** Add lockout logic to login endpoint

---

### Module 5: Multi-Device Session Management
| Component | Status | Evidence | Priority |
|-----------|--------|----------|----------|
| Session creation on login | ❌ Not implemented | No DB tracking | **CRITICAL** |
| Session listing UI | ⚠️ Prototype exists | Backend missing | HIGH |
| Session revocation API | ❌ Not implemented | Can't logout devices | HIGH |
| Last active tracking | ❌ Not implemented | No activity monitoring | MEDIUM |
| Device/IP fingerprinting | ❌ Not implemented | Limited security | LOW |

**Next Action:** Create user_sessions table and APIs

---

### Module 6: Internationalized Error Messages
| Component | Status | Evidence | Priority |
|-----------|--------|----------|----------|
| English (en) messages | ⚠️ Partial | Hardcoded strings | HIGH |
| Hindi (hi) translations | ❌ Not exists | No file | HIGH |
| Telugu (te) translations | ❌ Not exists | No file | HIGH |
| Tamil (ta) translations | ❌ Not exists | No file | HIGH |
| Backend i18n integration | ❌ Not implemented | No language routing | HIGH |
| User language preference | ❌ Not implemented | No storage | MEDIUM |

**Next Action:** Create i18n JSON files and wire to responses

---

### Module 7: Authentication Flow (End-to-End)
| Component | Status | Evidence | Priority |
|-----------|--------|----------|----------|
| POST /api/auth/login | ⚠️ Basic exists | Needs upgrade | **CRITICAL** |
| Session creation logic | ❌ Not implemented | No session row | **CRITICAL** |
| Token issuance | ⚠️ Basic exists | Not dual-token | **CRITICAL** |
| Role-based redirect | ✅ Implemented | Working | - |
| Audit logging | ❌ Not implemented | No logs | HIGH |

**Next Action:** Refactor login endpoint with full flow

---

### Module 8: Silent Token Refresh
| Component | Status | Evidence | Priority |
|-----------|--------|----------|----------|
| Frontend token watcher | ❌ Not implemented | No background refresh | **CRITICAL** |
| Refresh endpoint | ❌ Not implemented | No API | **CRITICAL** |
| Token rotation on refresh | ❌ Not implemented | Security gap | **CRITICAL** |
| Graceful expiry handling | ❌ Not implemented | Users kicked out | HIGH |

**Next Action:** Build refresh-token endpoint and frontend watcher

---

### Module 9: Reauthentication for Sensitive Actions
| Component | Status | Evidence | Priority |
|-----------|--------|----------|----------|
| Reauth timestamp tracking | ❌ Not implemented | No tracking | MEDIUM |
| Reauth modal UI | ❌ Not implemented | No UI | MEDIUM |
| Reauth endpoint | ❌ Not implemented | No API | MEDIUM |
| Sensitive action hooks | ❌ Not implemented | No enforcement | MEDIUM |

**Next Action:** Design reauth flow (Phase 2)

---

### Module 10: Automatic Session Invalidation
| Component | Status | Evidence | Priority |
|-----------|--------|----------|----------|
| Role change trigger | ❌ Not implemented | Sessions not revoked | HIGH |
| Password change trigger | ❌ Not implemented | Sessions not revoked | HIGH |
| Account deactivation trigger | ❌ Not implemented | Sessions not revoked | HIGH |
| Restaurant suspension trigger | ❌ Not implemented | Sessions not revoked | HIGH |

**Next Action:** Add database triggers or service hooks

---

### Module 11: Forgot Password & Reset
| Component | Status | Evidence | Priority |
|-----------|--------|----------|----------|
| Forgot password UI | ⚠️ Design exists | Not implemented | HIGH |
| Token generation | ❌ Not implemented | No table | HIGH |
| Email sending | ⚠️ May exist | Verify status | HIGH |
| Reset endpoint | ❌ Not implemented | No API | HIGH |
| Token expiry (15 min) | ❌ Not implemented | No logic | HIGH |

**Next Action:** Create password reset flow

---

### Module 12: First-Time Login (Force Password Change)
| Component | Status | Evidence | Priority |
|-----------|--------|----------|----------|
| `must_change_password` flag | ❌ Not exists | No column | MEDIUM |
| Password change enforcement | ❌ Not implemented | No redirect | MEDIUM |
| Change password UI | ⚠️ May exist | Verify | MEDIUM |

**Next Action:** Add must_change_password column and flow

---

### Module 13: Security Dashboard & Monitoring
| Component | Status | Evidence | Priority |
|-----------|--------|----------|----------|
| Security metrics UI | ⚠️ Prototype exists | Backend missing | MEDIUM |
| Failed login aggregation | ❌ Not implemented | No queries | MEDIUM |
| Active sessions count | ❌ Not implemented | No data | MEDIUM |
| Alert rules | ❌ Not implemented | No monitoring | LOW |
| Real-time updates | ❌ Not implemented | No WebSockets | LOW |

**Next Action:** Build backend aggregation queries

---

### Module 14: SuperAdmin Hardened Authentication
| Component | Status | Evidence | Priority |
|-----------|--------|----------|----------|
| SuperAdmin flag/table | ⚠️ Partially exists | Verify structure | HIGH |
| TOTP 2FA setup | ❌ Not implemented | No 2FA | HIGH |
| TOTP verification | ❌ Not implemented | No validation | HIGH |
| Backup codes | ❌ Not implemented | No recovery | HIGH |
| Stricter session rules | ❌ Not implemented | Same as users | MEDIUM |
| IP whitelist | ❌ Not implemented | No restriction | LOW |

**Next Action:** Implement TOTP flow

---

### Module 15: Logout Flows
| Component | Status | Evidence | Priority |
|-----------|--------|----------|----------|
| Single device logout | ⚠️ Basic exists | Needs session revoke | HIGH |
| All devices logout | ❌ Not implemented | No API | HIGH |
| Logout audit logging | ❌ Not implemented | No logs | MEDIUM |
| Cookie clearing | ⚠️ Basic exists | Verify refresh cookie | HIGH |

**Next Action:** Enhance logout with session DB updates

---

## 2. Priority Task List (Phased Implementation)

### 🔴 Phase 0: Preparation (Day 0)
**Duration:** 1 day  
**Risk:** Low

- [ ] Create feature branch `feature/paacs-v2-fusion`
- [ ] Add feature flag `PAACS_V2_ENABLED=false` to environment
- [ ] Generate RSA key pairs for access/refresh tokens
- [ ] Document rollback procedures
- [ ] Set up staging environment
- [ ] Notify team of upcoming changes

**Success Criteria:** Branch ready, keys generated, team briefed

---

### 🔴 Phase 1: Foundation (Database & Core Utilities) (Days 1-3)
**Duration:** 3 days  
**Risk:** Medium  
**Rollback:** Drop tables if issues

#### Tasks:
1. **Database Schema** (Day 1)
   - [ ] Run `20251110_paacs_v2_up.sql` on staging
   - [ ] Verify all tables created successfully
   - [ ] Test rollback with `20251110_paacs_v2_down.sql`
   - [ ] Run on production during low-traffic window
   - [ ] Monitor for errors

2. **Backend Utilities** (Day 2-3)
   - [ ] Create `lib/auth/tokens.js` (JWT utilities)
   - [ ] Create `lib/auth/sessions.js` (session management)
   - [ ] Create `lib/auth/logs.js` (audit logging)
   - [ ] Write unit tests for each utility
   - [ ] Test token generation/verification
   - [ ] Test session CRUD operations

**Success Criteria:** All tables exist, utilities tested, 100% test coverage

---

### 🔴 Phase 2: Authentication Core (Login & Refresh) (Days 4-7)
**Duration:** 4 days  
**Risk:** High  
**Rollback:** Feature flag disable, code revert

#### Tasks:
3. **Login Endpoint Refactor** (Day 4-5)
   - [ ] Refactor `/api/auth/login` with dual-token
   - [ ] Add account lockout logic (5 failures → 15 min lock)
   - [ ] Add session creation to database
   - [ ] Add audit logging (success/failure)
   - [ ] Test with Postman/curl
   - [ ] Write integration tests

4. **Refresh Token Endpoint** (Day 6-7)
   - [ ] Create `/api/auth/refresh-token` with rotation
   - [ ] Add JTI validation against database
   - [ ] Add session active check
   - [ ] Implement automatic token rotation
   - [ ] Test token replay attack scenarios
   - [ ] Write security tests

**Success Criteria:** Login returns dual tokens, refresh rotates properly, tests pass

---

### 🟡 Phase 3: Middleware & Frontend Integration (Days 8-10)
**Duration:** 3 days  
**Risk:** Medium  
**Rollback:** Frontend rollback via CDN/deployment

#### Tasks:
5. **Middleware** (Day 8)
   - [ ] Create `middleware.js` for token validation
   - [ ] Add session active check on every request
   - [ ] Add role-based route protection
   - [ ] Test with protected routes
   - [ ] Monitor performance impact

6. **Frontend Login Page** (Day 9)
   - [ ] Update login component with Remember Me
   - [ ] Implement in-memory access token storage
   - [ ] Add error message i18n hooks
   - [ ] Test login flow end-to-end
   - [ ] Add loading states and animations

7. **Silent Refresh** (Day 10)
   - [ ] Create token watcher service
   - [ ] Implement background refresh (2 min before expiry)
   - [ ] Add graceful logout on refresh failure
   - [ ] Test with long-running sessions
   - [ ] Monitor refresh success rate

**Success Criteria:** Users can login, stay logged in, seamless token refresh

---

### 🟡 Phase 4: Security Features (Days 11-14)
**Duration:** 4 days  
**Risk:** Low  
**Rollback:** Disable features individually

#### Tasks:
8. **Session Management** (Day 11-12)
   - [ ] Create `/api/auth/sessions` (list active sessions)
   - [ ] Create `/api/auth/sessions/:id/revoke` endpoint
   - [ ] Build Sessions UI page (list devices)
   - [ ] Add "Logout All Devices" button
   - [ ] Test multi-device scenarios

9. **Forgot Password Flow** (Day 13-14)
   - [ ] Create `/api/auth/forgot-password` endpoint
   - [ ] Create `/api/auth/reset-password` endpoint
   - [ ] Build forgot password UI
   - [ ] Integrate email service
   - [ ] Test token expiry and reuse prevention

**Success Criteria:** Users can manage sessions and reset passwords

---

### 🟢 Phase 5: Internationalization (Days 15-16)
**Duration:** 2 days  
**Risk:** Low  
**Rollback:** Remove i18n, keep English

#### Tasks:
10. **i18n Setup** (Day 15)
    - [ ] Create `i18n/en.json` (complete)
    - [ ] Create `i18n/hi.json` (Hindi)
    - [ ] Create `i18n/te.json` (Telugu)
    - [ ] Create `i18n/ta.json` (Tamil)
    - [ ] Add `preferred_language` to users table (already in migration)

11. **Backend Integration** (Day 16)
    - [ ] Create i18n middleware/utility
    - [ ] Update all error responses to use i18n
    - [ ] Add language switcher to login page
    - [ ] Test all languages
    - [ ] Get translations reviewed by native speakers

**Success Criteria:** All auth errors available in 4 languages

---

### 🟢 Phase 6: Advanced Features (Days 17-20)
**Duration:** 4 days  
**Risk:** Low  
**Rollback:** Feature-specific disable

#### Tasks:
12. **Auto Session Invalidation** (Day 17)
    - [ ] Add trigger on users.role change → revoke sessions
    - [ ] Add trigger on users.password change → revoke sessions
    - [ ] Add trigger on users.is_active=false → revoke sessions
    - [ ] Test each trigger
    - [ ] Document behavior

13. **SuperAdmin 2FA** (Day 18-19)
    - [ ] Add `superadmin_users.totp_secret` column
    - [ ] Create `/api/superadmin/setup-2fa` endpoint
    - [ ] Create `/api/superadmin/verify-2fa` endpoint
    - [ ] Generate backup codes (encrypted storage)
    - [ ] Build 2FA setup UI (QR code)
    - [ ] Enforce 2FA on SuperAdmin login

14. **Security Dashboard** (Day 20)
    - [ ] Create aggregation queries (failed logins, active sessions)
    - [ ] Build security metrics API endpoint
    - [ ] Update Manager Dashboard with security cards
    - [ ] Add real-time alerts (optional WebSocket)

**Success Criteria:** SuperAdmin has 2FA, managers see security metrics

---

### 🟢 Phase 7: Testing & Documentation (Days 21-23)
**Duration:** 3 days  
**Risk:** Low

#### Tasks:
15. **Testing** (Day 21-22)
    - [ ] Run full test suite (unit + integration)
    - [ ] Perform manual QA on staging
    - [ ] Run OWASP ZAP security scan
    - [ ] Load test authentication endpoints
    - [ ] Fix any discovered issues

16. **Documentation** (Day 23)
    - [ ] Update API documentation
    - [ ] Create admin user guide
    - [ ] Create developer guide
    - [ ] Update CHANGELOG.md
    - [ ] Record demo video (optional)

**Success Criteria:** 90%+ test coverage, docs complete

---

### 🔵 Phase 8: Deployment & Rollout (Days 24-30)
**Duration:** 7 days  
**Risk:** Medium  
**Rollback:** Feature flag disable → immediate revert

#### Rollout Strategy:
1. **Day 24:** Enable for internal team only (5 users)
2. **Day 25:** Monitor logs, fix critical issues
3. **Day 26:** Enable for 5% of users (canary)
4. **Day 27-28:** Monitor metrics (failed logins, refresh success rate)
5. **Day 29:** Enable for 50% of users
6. **Day 30:** Full enable (100%)

#### Monitoring Metrics:
- Login success rate (target: >98%)
- Refresh token success rate (target: >99%)
- Failed login rate (expect slight increase due to lockout)
- Session creation rate
- Lockout events per hour
- API response times (target: <200ms for auth endpoints)

#### Rollback Triggers:
- Login success rate drops below 90%
- Refresh failures spike above 5%
- P0 security vulnerability discovered
- Database performance degradation

**Success Criteria:** Smooth rollout, no incidents, metrics healthy

---

## 3. Risk Assessment & Mitigation

### 🔴 Critical Risks

#### Risk 1: Mass User Lockouts
**Probability:** Medium | **Impact:** High | **Severity:** Critical

**Scenario:** Lockout threshold too aggressive, legitimate users locked out en masse

**Mitigation:**
- Use conservative defaults (5 failures, 15 min lock)
- Add manager unlock capability immediately
- Monitor lockout rate during rollout
- Provide clear unlock instructions via email
- Emergency disable feature flag ready

**Rollback Plan:** Increase threshold to 10 attempts or disable lockout temporarily

---

#### Risk 2: Refresh Token Rotation Bugs
**Probability:** Medium | **Impact:** High | **Severity:** Critical

**Scenario:** Token rotation logic breaks, users forced to re-login frequently

**Mitigation:**
- Extensive testing of rotation logic
- Canary rollout to catch issues early
- Keep old refresh tokens valid for 5 minutes (grace period)
- Monitor refresh failure rate closely
- Fast rollback via feature flag

**Rollback Plan:** Disable rotation temporarily, allow non-rotating refresh

---

#### Risk 3: Database Migration Failure
**Probability:** Low | **Impact:** High | **Severity:** Critical

**Scenario:** Migration fails mid-execution, database in inconsistent state

**Mitigation:**
- Test migrations extensively on staging
- Run migrations during low-traffic window
- Use database transactions (all-or-nothing)
- Have immediate rollback script ready
- Database backup before migration

**Rollback Plan:** Run down migration, restore from backup if needed

---

### 🟡 Medium Risks

#### Risk 4: Performance Degradation
**Probability:** Medium | **Impact:** Medium | **Severity:** Medium

**Scenario:** Session table queries slow down authentication

**Mitigation:**
- Add database indexes on critical columns
- Implement query result caching (Redis)
- Monitor query performance
- Set up alerts for slow queries
- Optimize session cleanup job

**Rollback Plan:** Add emergency indexes, scale database if needed

---

#### Risk 5: Token Secret Compromise
**Probability:** Low | **Impact:** High | **Severity:** Medium

**Scenario:** Private keys leaked, all tokens compromised

**Mitigation:**
- Store keys in secure vault (AWS Secrets Manager / Azure Key Vault)
- Never commit keys to git
- Rotate keys quarterly
- Use separate keys for staging/production
- Monitor for suspicious token usage

**Rollback Plan:** Emergency key rotation, revoke all sessions, force re-login

---

### 🟢 Low Risks

#### Risk 6: i18n Translation Errors
**Probability:** Medium | **Impact:** Low | **Severity:** Low

**Scenario:** Poor translations confuse users

**Mitigation:**
- Have native speakers review translations
- Use professional translation service
- Provide feedback mechanism
- Keep English as fallback
- Iterate based on user feedback

**Rollback Plan:** Revert to English-only temporarily

---

## 4. Success Metrics & KPIs

### Authentication Metrics
- **Login Success Rate:** Target >98% (currently: unknown)
- **Failed Login Rate:** Baseline, monitor for anomalies
- **Account Lockout Rate:** <1% of daily active users
- **Refresh Token Success:** >99%
- **Session Creation Time:** <100ms (p95)

### Security Metrics
- **Brute Force Attempts Blocked:** Track count (new metric)
- **Multi-Device Sessions:** Average sessions per user
- **Password Reset Success:** >95%
- **2FA Adoption (SuperAdmin):** 100% required
- **Audit Log Coverage:** 100% of auth events

### User Experience Metrics
- **Login Page Load Time:** <1s
- **Time to Interactive:** <2s
- **Silent Refresh Success:** No user disruption
- **Session Persistence:** 8 hours (default) / 30 days (remember me)

### System Health Metrics
- **API Response Time (auth):** <200ms (p95)
- **Database Query Time:** <50ms (p95)
- **Error Rate:** <0.1%
- **Uptime:** >99.9%

---

## 5. Post-Deployment Checklist

### Week 1 (Days 1-7)
- [ ] Monitor all metrics daily
- [ ] Review auth_activity_logs for anomalies
- [ ] Check lockout rate and user complaints
- [ ] Verify silent refresh working across devices
- [ ] Review error logs and fix non-critical issues
- [ ] Gather user feedback

### Week 2 (Days 8-14)
- [ ] Analyze login patterns by role
- [ ] Review session duration statistics
- [ ] Check password reset usage
- [ ] Verify 2FA enforcement for SuperAdmins
- [ ] Optimize slow queries if any

### Month 1
- [ ] Full security audit
- [ ] Review and update threat model
- [ ] Plan Phase 2 features (reauthentication, IP whitelist)
- [ ] Conduct retrospective with team
- [ ] Update documentation based on learnings

---

## 6. Dependencies & Prerequisites

### Technical Dependencies
- ✅ PostgreSQL 12+ (or Supabase)
- ✅ Node.js 18+
- ✅ Next.js 13+ (App Router preferred)
- ⚠️ Redis (optional, recommended for caching)
- ⚠️ Email service (SendGrid / AWS SES / Postmark)
- ❌ TOTP library (e.g., `otplib`)
- ❌ QR code generator (e.g., `qrcode`)

### Infrastructure Requirements
- [ ] Generate RSA key pairs (2048-bit minimum)
- [ ] Set up secure key storage (Secrets Manager)
- [ ] Configure SMTP or email API
- [ ] Set up monitoring (Sentry / DataDog / CloudWatch)
- [ ] Prepare staging environment
- [ ] Database backup system verified

### Team Requirements
- [ ] Backend developer (Node/Next.js) - 1 FTE
- [ ] Frontend developer (React/Next.js) - 1 FTE
- [ ] QA engineer - 0.5 FTE
- [ ] DevOps engineer - 0.25 FTE
- [ ] Security reviewer - 0.25 FTE

---

## 7. Open Questions & Decisions Needed

### Technical Decisions
1. **Redis for session caching?**
   - Recommended: YES (improves performance)
   - Alternative: PostgreSQL only (simpler)

2. **Token expiry times?**
   - Access: 15 minutes (recommended)
   - Refresh: 8 hours default / 30 days remember me
   - Adjust based on security requirements?

3. **Lockout threshold?**
   - Proposed: 5 failures → 15 min lock
   - Alternative: 3 failures (stricter) or 10 failures (lenient)?

4. **Session limit per user?**
   - Proposed: No limit (track all devices)
   - Alternative: Max 5 devices, force oldest logout?

### Business Decisions
5. **SuperAdmin 2FA enforcement?**
   - Proposed: MANDATORY for all SuperAdmins
   - Timeline: Immediate or grace period?

6. **User communication?**
   - In-app notification of security upgrade?
   - Email explaining new features?

7. **Rollout timeline?**
   - Proposed: 30 days
   - Faster (2 weeks) or slower (6 weeks)?

---

## 8. Next Steps — Immediate Actions

### For Product Owner / Manager:
1. **Review and approve** this implementation plan
2. **Make decisions** on open questions (Section 7)
3. **Allocate resources** (developers, QA)
4. **Set timeline** and communicate to stakeholders
5. **Approve infrastructure costs** (Redis, monitoring tools)

### For Development Team:
1. **Review technical specifications** in migration files
2. **Set up development environment** with feature flag
3. **Generate RSA key pairs** for staging
4. **Create feature branch** `feature/paacs-v2-fusion`
5. **Begin Phase 0 tasks** (preparation)

### For DevOps / Infrastructure:
1. **Verify staging environment** matches production
2. **Set up monitoring** for new auth metrics
3. **Prepare rollback procedures** and test
4. **Configure secrets management** for token keys
5. **Schedule low-traffic window** for DB migration

### For QA / Testing:
1. **Review test strategy** (unit, integration, security)
2. **Prepare test scenarios** for each module
3. **Set up OWASP ZAP** or equivalent security scanner
4. **Create load test scripts** for auth endpoints
5. **Define acceptance criteria** for each phase

---

## Appendix A: File Manifest

The following files are included in this PAACS v2.0 implementation package:

### Database Migrations
- `database/migrations/20251110_paacs_v2_up.sql` — Creates tables and adds columns
- `database/migrations/20251110_paacs_v2_down.sql` — Rollback script

### Backend / API
- `src/lib/auth/tokens.js` — JWT token utilities (create, verify, rotate)
- `src/lib/auth/sessions.js` — Session management (create, revoke, list)
- `src/lib/auth/logs.js` — Audit logging utilities
- `src/pages/api/auth/login.js` — Login endpoint (refactored)
- `src/pages/api/auth/refresh-token.js` — Token refresh with rotation
- `src/pages/api/auth/logout.js` — Logout and session revocation
- `src/pages/api/auth/sessions.js` — List active sessions
- `src/pages/api/auth/sessions/[id]/revoke.js` — Revoke specific session
- `src/pages/api/auth/forgot-password.js` — Request password reset
- `src/pages/api/auth/reset-password.js` — Reset password with token
- `src/middleware.js` — Next.js middleware for token validation

### Frontend / UI
- `src/app/(auth)/login/page.jsx` — Unified login page
- `src/app/(auth)/forgot-password/page.jsx` — Forgot password page
- `src/app/(auth)/reset-password/page.jsx` — Reset password page
- `src/app/(dashboard)/sessions/page.jsx` — Multi-device session management
- `src/components/auth/SilentRefresh.jsx` — Background token refresh
- `src/components/auth/LoginForm.jsx` — Login form component

### Internationalization
- `src/i18n/en.json` — English translations
- `src/i18n/hi.json` — Hindi translations
- `src/i18n/te.json` — Telugu translations
- `src/i18n/ta.json` — Tamil translations
- `src/lib/i18n.js` — i18n utility functions

### Testing
- `tests/unit/auth.tokens.test.js` — Token utility tests
- `tests/integration/auth.login.test.js` — Login flow tests
- `tests/integration/auth.refresh.test.js` — Token refresh tests
- `tests/security/auth.security.test.js` — Security test suite

### Configuration
- `.env.example` — Environment variables template
- `docs/PAACS_V2_DEPLOYMENT_GUIDE.md` — Deployment instructions
- `docs/PAACS_V2_API_REFERENCE.md` — API documentation
- `CHANGELOG.md` — Version history

---

## Appendix B: Glossary

- **Access Token:** Short-lived JWT (15 min) used for API authentication
- **Refresh Token:** Long-lived token (8h/30d) stored in HttpOnly cookie for obtaining new access tokens
- **JTI:** JWT ID, unique identifier for each token used for revocation
- **Token Rotation:** Issuing a new refresh token and invalidating the old one on each refresh
- **Silent Refresh:** Background process that refreshes access token before expiry without user interaction
- **Account Lockout:** Temporary suspension of login after N failed attempts
- **Session:** Database-tracked user authentication session tied to a specific device
- **Reauthentication:** Requiring user to re-enter password for sensitive actions
- **TOTP:** Time-based One-Time Password (e.g., Google Authenticator)
- **Backup Codes:** One-time recovery codes for 2FA if TOTP unavailable
- **RLS:** Row-Level Security (database-level access control)

---

## Appendix C: Support & Contact

**For Implementation Questions:**
- Technical Lead: [Your Name]
- Backend Team: [Contact]
- Frontend Team: [Contact]

**For Security Concerns:**
- Security Team: [Email]
- Incident Response: [On-call rotation]

**For Deployment Issues:**
- DevOps Team: [Contact]
- Database Admin: [Contact]

---

**Document Approval:**

- [ ] Product Owner
- [ ] Technical Lead
- [ ] Security Team
- [ ] DevOps Lead

**Approval Date:** _____________

**Implementation Start Date:** _____________

---

*End of PAACS v2.0 Implementation Status Document*
