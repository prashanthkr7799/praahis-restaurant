# 🔑 API Keys & Credentials Reference Guide

**Project:** Praahis Restaurant Management Platform  
**Generated:** November 15, 2025  
**Security Level:** CONFIDENTIAL - Do Not Share

---

## 📋 Table of Contents

1. [Environment Variables Overview](#environment-variables-overview)
2. [Supabase Credentials](#supabase-credentials)
3. [Razorpay Payment Gateway](#razorpay-payment-gateway)
4. [Edge Function Secrets](#edge-function-secrets)
5. [Seeding & Testing Credentials](#seeding--testing-credentials)
6. [Configuration Files](#configuration-files)
7. [Security Best Practices](#security-best-practices)
8. [Setup Instructions](#setup-instructions)

---

## 🌍 Environment Variables Overview

### **Required Files:**

```
.env.local          # Main environment file (NEVER commit to Git)
.env.example        # Template (safe to commit)
```

### **Variable Categories:**

| Category | Variables | Purpose | Exposure |
|----------|-----------|---------|----------|
| **Supabase (Frontend)** | 2 vars | Client-side database access | ✅ Public (safe in frontend) |
| **Supabase (Backend)** | 2 vars | Server-side admin access | ❌ Private (scripts only) |
| **Razorpay (Optional)** | 2 vars | Global payment fallback | ⚠️ Conditional (per-restaurant preferred) |
| **Seed/Test** | 2 vars | Development convenience | ⚠️ Dev only |

---

## 🗄️ Supabase Credentials

### **1. Frontend Credentials (Client-Side)**

#### **VITE_SUPABASE_URL**
```bash
VITE_SUPABASE_URL=https://YOUR-PROJECT-ID.supabase.co
```
- **Type:** Public
- **Purpose:** Supabase project URL for client connections
- **Used in:** 
  - `src/shared/utils/api/supabaseClient.js` (Staff client)
  - `src/shared/utils/api/supabaseOwnerClient.js` (Owner client)
- **How to get:**
  1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
  2. Select your project
  3. Go to **Settings** → **API**
  4. Copy **Project URL**
- **Example:** `https://abcdefghijklmnop.supabase.co`
- **Security:** ✅ Safe to expose (public URL)

#### **VITE_SUPABASE_ANON_KEY**
```bash
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByYWFoaXMiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYzMjQxNjAwMCwiZXhwIjoxOTQ3OTkyMDAwfQ.xxxxxxxxxxxxxxxxxxxxx
```
- **Type:** Public (Anon Key)
- **Purpose:** Public API key for client-side operations (respects RLS)
- **Used in:**
  - `src/shared/utils/api/supabaseClient.js`
  - `src/shared/utils/api/supabaseOwnerClient.js`
- **How to get:**
  1. Supabase Dashboard → **Settings** → **API**
  2. Copy **Project API keys** → **anon** → **public**
- **Security:** ✅ Safe to expose (RLS protects data)
- **Note:** This key respects Row Level Security policies

---

### **2. Backend Credentials (Server-Side)**

#### **SUPABASE_URL**
```bash
SUPABASE_URL=https://YOUR-PROJECT-ID.supabase.co
```
- **Type:** Private (for scripts)
- **Purpose:** Same as VITE_SUPABASE_URL but for Node.js scripts
- **Used in:**
  - `scripts/seed-tenants.js` (Tenant seeding)
  - `scripts/verify-subscriptions.js` (Subscription check)
  - `scripts/verify-supabase.js` (Connection test)
- **How to get:** Same as VITE_SUPABASE_URL
- **Security:** ⚠️ Keep private (script access only)

#### **SUPABASE_SERVICE_ROLE_KEY**
```bash
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByYWFoaXMiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjMyNDE2MDAwLCJleHAiOjE5NDc5OTIwMDB9.xxxxxxxxxxxxxxxxxxxxx
```
- **Type:** 🔴 HIGHLY SENSITIVE - NEVER EXPOSE
- **Purpose:** Admin key that bypasses ALL RLS policies
- **Used in:**
  - `scripts/seed-tenants.js` (Create users/restaurants)
  - Edge Functions (platform billing operations)
- **How to get:**
  1. Supabase Dashboard → **Settings** → **API**
  2. Copy **Project API keys** → **service_role** → **secret**
  3. ⚠️ Click "Reveal" (it's hidden by default)
- **Security:** ❌ NEVER expose to frontend or Git
- **Capabilities:**
  - Full database access (bypasses RLS)
  - Create/delete users
  - Modify any data
  - Execute admin functions

---

## 💳 Razorpay Payment Gateway

### **Two-Level Configuration:**

#### **Level 1: Per-Restaurant Razorpay (Recommended)**
```sql
-- Stored in database: restaurants.payment_settings (JSONB)
{
  "razorpay_key_id": "rzp_live_XXXXXXXXXX",
  "razorpay_key_secret": "XXXXXXXXXXXXXXXX",
  "gateway": "razorpay",
  "enabled": true
}
```
- **Type:** Per-tenant configuration
- **Purpose:** Each restaurant uses their own Razorpay account
- **Managed via:** Manager Portal → Settings → Payment Settings
- **Used in:** `src/pages/customer/PaymentPage.jsx`
- **Security:** ✅ Isolated per restaurant (best practice)
- **How to get:**
  1. Restaurant owner creates [Razorpay account](https://razorpay.com)
  2. Go to **Settings** → **API Keys**
  3. Generate keys (Test or Live mode)
  4. Manager enters keys in Payment Settings page

#### **Level 2: Global Fallback Razorpay (Optional)**
```bash
# .env.local (optional global fallback)
VITE_RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXX
VITE_RAZORPAY_KEY_SECRET=XXXXXXXXXXXXXXXX
```
- **Type:** Optional fallback
- **Purpose:** Used only if restaurant hasn't configured their keys
- **Used in:**
  - `src/domains/billing/utils/razorpayHelper.js`
  - `src/domains/billing/utils/subscriptionPaymentHelper.js`
- **How to get:**
  1. Create platform-level Razorpay account
  2. Settings → API Keys
  3. Generate Test/Live keys
- **Security:** ⚠️ Keep private (platform account)
- **Note:** Per-restaurant keys take precedence

### **Razorpay Key Types:**

| Key Type | Format | Purpose | Exposure |
|----------|--------|---------|----------|
| **Test Key ID** | `rzp_test_XXXXXXXXXX` | Testing/development | ✅ Public (safe in frontend) |
| **Test Key Secret** | `XXXXXXXXXXXXXXXX` | Test mode validation | ⚠️ Private (server-side) |
| **Live Key ID** | `rzp_live_XXXXXXXXXX` | Production payments | ✅ Public (safe in frontend) |
| **Live Key Secret** | `XXXXXXXXXXXXXXXX` | Live mode validation | 🔴 Private (never expose) |

### **Razorpay Webhook Secret**
```bash
RAZORPAY_WEBHOOK_SECRET=whsec_XXXXXXXXXXXXXXXXXX
```
- **Type:** Edge Function secret
- **Purpose:** Verify webhook authenticity (HMAC signature)
- **Used in:** `supabase/functions/payment-webhook/index.ts`
- **How to get:**
  1. Razorpay Dashboard → **Settings** → **Webhooks**
  2. Create webhook: `https://YOUR-PROJECT.supabase.co/functions/v1/payment-webhook`
  3. Copy **Secret** (shown once)
- **Set via:** `supabase secrets set RAZORPAY_WEBHOOK_SECRET=xxx`
- **Security:** 🔴 Critical for payment security

---

## ⚡ Edge Function Secrets

### **Supabase Edge Function Environment Variables:**

Edge Functions (Deno) have their own separate environment:

#### **Required Secrets:**

```bash
# Set via Supabase CLI
supabase secrets set SUPABASE_URL="https://YOUR-PROJECT.supabase.co"
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="eyJhbGci..."
supabase secrets set RAZORPAY_WEBHOOK_SECRET="whsec_XXXXX"
```

#### **Available in Edge Functions:**

| Secret | Used By | Purpose |
|--------|---------|---------|
| `SUPABASE_URL` | All 3 functions | Connect to database |
| `SUPABASE_SERVICE_ROLE_KEY` | All 3 functions | Admin database access |
| `RAZORPAY_WEBHOOK_SECRET` | `payment-webhook` | Verify webhook signatures |

#### **Edge Functions List:**

1. **payment-webhook** (`supabase/functions/payment-webhook/`)
   - Receives Razorpay/Stripe webhooks
   - Verifies HMAC signature
   - Marks bills as paid
   - Reactivates suspended restaurants

2. **monthly-bill-generator** (`supabase/functions/monthly-bill-generator/`)
   - Runs on 1st of each month
   - Generates bills: table_count × ₹100 × days
   - Creates billing records

3. **daily-suspension-check** (`supabase/functions/daily-suspension-check/`)
   - Runs daily at 01:00 UTC
   - Finds overdue bills (past grace period)
   - Auto-suspends restaurants

#### **Deploy Secrets:**

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref YOUR-PROJECT-ID

# Set secrets
supabase secrets set SUPABASE_URL="https://YOUR-PROJECT.supabase.co"
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="eyJhbG..."
supabase secrets set RAZORPAY_WEBHOOK_SECRET="whsec_XXX"

# Deploy functions
supabase functions deploy payment-webhook
supabase functions deploy monthly-bill-generator
supabase functions deploy daily-suspension-check
```

---

## 🌱 Seeding & Testing Credentials

### **Seed Owner Password**
```bash
SEED_OWNER_PASSWORD=Praahis@123
```
- **Type:** Optional (defaults to `Praahis@123`)
- **Purpose:** Password for seeded SuperAdmin account
- **Used in:** `scripts/seed-tenants.js`
- **Default account:**
  - Email: `admin@praahis.com`
  - Password: Value of SEED_OWNER_PASSWORD or `Praahis@123`
  - Role: `owner` (SuperAdmin)
- **Security:** ⚠️ Change in production!

### **App Origin**
```bash
APP_ORIGIN=http://localhost:5173
VITE_APP_URL=http://localhost:5173
```
- **Type:** Development convenience
- **Purpose:** Base URL for generated links in seed output
- **Used in:** `scripts/seed-tenants.js`
- **Examples:**
  - Dev: `http://localhost:5173`
  - Prod: `https://yourdomain.com`

### **Default Test Credentials (After Seeding):**

#### **SuperAdmin:**
```
URL: http://localhost:5173/login (Purple panel)
Email: admin@praahis.com
Password: Praahis@123 (or SEED_OWNER_PASSWORD)
Access: All restaurants
```

#### **Manager (per restaurant):**
```
URL: http://localhost:5173/login (Blue panel)
Example: manager@tabun.local / Tabun@123
Access: Single restaurant only
```

---

## 📝 Configuration Files

### **File Locations:**

```
Project Root:
├── .env.local              # ❌ Never commit (Git ignored)
├── .env.example            # ✅ Template (commit this)
└── .gitignore              # Blocks .env.local

Frontend:
├── src/shared/utils/api/supabaseClient.js       # Uses VITE_*
└── src/shared/utils/api/supabaseOwnerClient.js  # Uses VITE_*

Scripts:
├── scripts/seed-tenants.js           # Uses SUPABASE_SERVICE_ROLE_KEY
└── scripts/verify-subscriptions.js   # Uses SUPABASE_SERVICE_ROLE_KEY

Edge Functions:
└── supabase/functions/*/index.ts     # Uses Deno.env.get()
```

### **gitignore Protection:**

```gitignore
# Environment variables (MUST BE IN .gitignore)
.env
.env.local
.env.production
.env.*.local

# Supabase
.supabase/

# Never commit these patterns
**/secrets.json
**/credentials.json
**/*secret*
**/*password*
```

---

## 🔒 Security Best Practices

### **DO ✅**

1. **Use .env.local for secrets**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with real values
   ```

2. **Separate client and server keys**
   - Frontend: `VITE_*` variables (safe)
   - Backend: `SUPABASE_SERVICE_ROLE_KEY` (dangerous)

3. **Per-restaurant Razorpay accounts**
   - Each restaurant uses their own keys
   - Stored in database (encrypted at rest)
   - Managed via Payment Settings UI

4. **Rotate credentials regularly**
   - Regenerate Supabase keys every 90 days
   - Rotate Razorpay secrets quarterly
   - Update Edge Function secrets

5. **Use environment-specific keys**
   - Test keys for development
   - Live keys for production only
   - Never mix environments

6. **Verify .gitignore**
   ```bash
   # Check if .env.local is ignored
   git check-ignore .env.local
   # Should output: .env.local
   ```

### **DON'T ❌**

1. **Never commit .env.local**
   ```bash
   # If accidentally committed:
   git rm --cached .env.local
   git commit -m "Remove env file"
   # Then rotate ALL exposed credentials
   ```

2. **Never expose service role key**
   - ❌ Don't use in frontend
   - ❌ Don't log to console
   - ❌ Don't send in API responses
   - ❌ Don't commit to Git

3. **Never share credentials in:**
   - Slack/Discord messages
   - Email
   - Screenshots
   - Code comments
   - Documentation (use placeholders)

4. **Never hardcode secrets**
   ```javascript
   // ❌ BAD
   const apiKey = 'rzp_live_XXXXXXXXXX';
   
   // ✅ GOOD
   const apiKey = import.meta.env.VITE_RAZORPAY_KEY_ID;
   ```

5. **Never use production keys in development**
   - Use test keys for local development
   - Only use live keys in production

---

## 🚀 Setup Instructions

### **Step 1: Create Supabase Project**

1. Go to [supabase.com](https://supabase.com/dashboard)
2. Click **New Project**
3. Fill in:
   - Name: `Praahis` (or your choice)
   - Database Password: (save this!)
   - Region: Closest to your users
4. Wait for project creation (~2 minutes)

### **Step 2: Get Supabase Credentials**

1. Go to **Settings** → **API**
2. Copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`
   - **service_role secret** (reveal) → `SUPABASE_SERVICE_ROLE_KEY`

### **Step 3: Create .env.local**

```bash
cd /path/to/Praahis
cp .env.example .env.local
nano .env.local  # or use your preferred editor
```

Paste your credentials:
```bash
# Frontend (safe to expose)
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cC...

# Backend (keep private)
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cC...

# Optional
SEED_OWNER_PASSWORD=YourSecurePassword123!
APP_ORIGIN=http://localhost:5173
VITE_APP_URL=http://localhost:5173
```

### **Step 4: Run Database Migrations**

```bash
# Open Supabase SQL Editor
# Run migrations in order:
1. database/01_schema.sql
2. database/22_table_sessions.sql
3. database/70_unified_login_rls_FIXED.sql
4. database/71_security_audit_logging.sql
5. database/40_billing_payments_system.sql
6. database/52_add_order_payments_table.sql
# ... (see deployment docs for full list)
```

### **Step 5: Seed Data**

```bash
npm install
npm run seed:tenants
```

Output will show:
```
✅ Super Admin created: admin@praahis.com / Praahis@123
✅ Restaurant: Tabun (manager@tabun.local / Tabun@123)
...
```

### **Step 6: Setup Razorpay (Optional)**

#### **For Platform-Level (Optional):**
1. Create Razorpay account
2. Get Test keys
3. Add to .env.local:
   ```bash
   VITE_RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXX
   ```

#### **For Per-Restaurant (Recommended):**
1. Login as Manager: `http://localhost:5173/login`
2. Go to **Settings** → **Payment Settings**
3. Enter restaurant's Razorpay keys
4. Enable payment gateway

### **Step 7: Configure Edge Functions**

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref YOUR-PROJECT-ID

# Set secrets
supabase secrets set SUPABASE_URL="https://YOUR-PROJECT.supabase.co"
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="YOUR-SERVICE-KEY"
supabase secrets set RAZORPAY_WEBHOOK_SECRET="YOUR-WEBHOOK-SECRET"

# Deploy functions
supabase functions deploy payment-webhook
supabase functions deploy monthly-bill-generator
supabase functions deploy daily-suspension-check
```

### **Step 8: Setup Razorpay Webhooks**

1. Razorpay Dashboard → **Settings** → **Webhooks**
2. Click **Create New Webhook**
3. URL: `https://YOUR-PROJECT.supabase.co/functions/v1/payment-webhook`
4. Events: Select:
   - `payment.captured`
   - `payment.failed`
5. Active: ✅ Yes
6. Copy **Secret** → use in `supabase secrets set`

### **Step 9: Test the Setup**

```bash
# Start development server
npm run dev

# Visit: http://localhost:5173

# Test logins:
# SuperAdmin: admin@praahis.com / Praahis@123
# Manager: manager@tabun.local / Tabun@123
```

---

## 📞 Support & Resources

### **Documentation:**
- [Supabase Docs](https://supabase.com/docs)
- [Razorpay Docs](https://razorpay.com/docs/)
- Project README.md
- COMPLETE_PROJECT_DOCUMENTATION.md

### **Troubleshooting:**
- See `FIX_NOW.md` for common issues
- See `SECURITY.md` for security guidelines
- See `READY_TO_DEPLOY.md` for deployment

### **Get Credentials:**
- Supabase: [dashboard](https://supabase.com/dashboard)
- Razorpay: [dashboard](https://dashboard.razorpay.com/)

---

## 🔄 Credential Rotation Schedule

### **Recommended Rotation:**

| Credential | Rotation Period | Priority |
|------------|----------------|----------|
| SUPABASE_SERVICE_ROLE_KEY | Every 90 days | 🔴 Critical |
| RAZORPAY_WEBHOOK_SECRET | Every 90 days | 🔴 Critical |
| VITE_SUPABASE_ANON_KEY | Every 180 days | ⚠️ Medium |
| Razorpay Test Keys | Every 180 days | 🟡 Low |
| Razorpay Live Keys | Every 90 days | 🔴 Critical |
| SEED_OWNER_PASSWORD | On first deployment | 🔴 Critical |

### **Rotation Process:**

1. **Generate new credentials** in respective dashboards
2. **Update .env.local** with new values
3. **Update Edge Function secrets**: `supabase secrets set`
4. **Restart application**
5. **Verify functionality**
6. **Revoke old credentials** (after 24h grace period)

---

## 📊 Environment Variables Summary

### **Complete List:**

```bash
# === Frontend (Client-Side) ===
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
VITE_RAZORPAY_KEY_ID=rzp_test_XXXXX          # Optional fallback
VITE_APP_URL=http://localhost:5173            # Optional

# === Backend (Server-Side Scripts) ===
SUPABASE_URL=https://YOUR-PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...        # 🔴 SENSITIVE
SEED_OWNER_PASSWORD=Praahis@123              # Optional
APP_ORIGIN=http://localhost:5173             # Optional

# === Edge Functions (Set via CLI) ===
# supabase secrets set SUPABASE_URL="..."
# supabase secrets set SUPABASE_SERVICE_ROLE_KEY="..."
# supabase secrets set RAZORPAY_WEBHOOK_SECRET="..."

# === Per-Restaurant (Database) ===
# Stored in: restaurants.payment_settings (JSONB)
# - razorpay_key_id
# - razorpay_key_secret
# - gateway
# - enabled
```

---

## ⚠️ Emergency: Credential Compromise

### **If credentials are exposed:**

1. **Immediately rotate all affected credentials**
2. **Check Supabase logs** for unauthorized access
3. **Review database for suspicious activity**
4. **Enable Supabase email notifications**
5. **Update all deployment environments**
6. **Notify team members**
7. **Document the incident**

### **Supabase Rotation:**
1. Dashboard → Settings → API
2. Click **Regenerate** next to affected key
3. Update .env.local immediately
4. Redeploy application

### **Razorpay Rotation:**
1. Dashboard → Settings → API Keys
2. Generate new keys
3. Regenerate webhook secret
4. Update all configurations

---

**Last Updated:** November 15, 2025  
**Document Version:** 1.0  
**Security Classification:** CONFIDENTIAL

---

*This document should be stored securely and never committed to version control.*
