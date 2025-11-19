# 🔒 Security & Privacy Guide

## What's Private vs Public in Your Project

---

## ✅ **SAFE TO SHARE (Public Files)**

### All SQL Files in `database/` folder:
```
✅ 00_reset_database.sql
✅ 01_schema.sql
✅ 02_seed.sql (with placeholder passwords)
✅ 03_enable_realtime.sql
✅ 04_disable_rls_testing.sql
✅ 05_production_rls.sql
✅ 06_maintenance.sql
✅ README.md
```

**Why?** These only contain:
- Database structure
- Sample/demo data
- Configuration commands
- No real credentials

### Source Code:
```
✅ src/ folder (all React components)
✅ Components/
✅ pages/
✅ utils/
✅ package.json
✅ README.md
✅ tailwind.config.js
✅ vite.config.js
```

---

## ❌ **KEEP PRIVATE (Never Share!)**

### 1. Environment Variables File
```bash
# .env.local - NEVER COMMIT THIS!
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2. Supabase Dashboard Access
- ❌ Supabase project URL
- ❌ Supabase API keys (anon, service_role)
- ❌ Database password
- ❌ JWT secret

### 3. Payment Gateway Credentials
- ❌ Razorpay API keys
- ❌ Payment gateway secrets
- ❌ Webhook secrets

### 4. Production Passwords
- ❌ Real staff passwords
- ❌ Admin credentials
- ❌ Database connection strings

---

## 🛡️ .gitignore Protection

Make sure your `.gitignore` includes:

```gitignore
# Environment variables
.env
.env.local
.env.production

# Supabase
.supabase/

# Build files
dist/
build/

# Dependencies
node_modules/

# OS files
.DS_Store
Thumbs.db
```

---

## ⚠️ Before Sharing or Pushing to GitHub

### ✅ Safe to push:
```bash
git add database/
git add src/
git add README.md
git add package.json
git add tailwind.config.js
git commit -m "Add database schema and setup"
git push
```

### ❌ Never push:
```bash
# Make sure .env.local is in .gitignore!
git add .env.local  ← DON'T DO THIS!
```

---

## 🔐 What to Do with Sensitive Data

### Option 1: Environment Variables (Recommended)
```bash
# Use .env.local for development
VITE_SUPABASE_URL=your_url
VITE_SUPABASE_ANON_KEY=your_key

# Use platform environment variables for production
# (Vercel, Netlify, etc. have secure env var storage)
```

### Option 2: Secrets Management
```bash
# For production, use:
- Vercel Environment Variables
- Netlify Environment Variables
- GitHub Secrets (for CI/CD)
- AWS Secrets Manager
- etc.
```

---

## 📋 Security Checklist

### ✅ Before Deploying to Production:

- [ ] `.env.local` is in `.gitignore`
- [ ] No API keys in source code
- [ ] No passwords in SQL files
- [ ] Run `05_production_rls.sql` (enable security)
- [ ] Change default passwords in `02_seed.sql`
- [ ] Use strong passwords for staff accounts
- [ ] Enable 2FA on Supabase account
- [ ] Set up proper RLS policies
- [ ] Test security thoroughly

---

## 🚨 If You Accidentally Exposed Secrets

### Immediate Actions:

1. **Rotate API Keys**
   ```
   - Go to Supabase Dashboard
   - Settings → API
   - Reset anon key and service_role key
   ```

2. **Change Passwords**
   ```sql
   -- Update staff passwords
   UPDATE users 
   SET password_hash = 'new_hashed_password'
   WHERE email = 'admin@tabun.com';
   ```

3. **Review Access Logs**
   ```
   - Check Supabase logs for suspicious activity
   - Monitor for unauthorized access
   ```

4. **Update All Deployed Apps**
   ```
   - Update environment variables everywhere
   - Redeploy with new credentials
   ```

---

## 💡 Best Practices

### ✅ DO:
- Use environment variables for secrets
- Add `.env.local` to `.gitignore`
- Use placeholder values in sample files
- Rotate keys regularly
- Enable RLS in production
- Use strong passwords
- Monitor access logs

### ❌ DON'T:
- Commit `.env` files
- Hardcode API keys in code
- Share Supabase credentials
- Use same passwords everywhere
- Disable RLS in production
- Expose database URL publicly
- Use default/weak passwords

---

## 📊 Privacy Summary

| Item | Private? | Action |
|------|----------|--------|
| SQL structure files | ✅ Public | Safe to share |
| Sample menu data | ✅ Public | Safe to share |
| React source code | ✅ Public | Safe to share |
| Supabase URL | ❌ Private | Keep in .env.local |
| Supabase keys | ❌ Private | Keep in .env.local |
| Staff passwords | ❌ Private | Hash & keep secure |
| Payment keys | ❌ Private | Environment variables |
| Database password | ❌ Private | Supabase manages this |

---

## 🎯 Quick Answer to Your Question

**"Are all these SQL files private?"**

**Answer:** 
- ✅ SQL files themselves → **Public/Safe**
- ✅ Database structure → **Public/Safe**
- ✅ Sample data → **Public/Safe**
- ❌ `.env.local` file → **PRIVATE! Never share!**
- ❌ Real API keys → **PRIVATE! Keep secure!**
- ❌ Production passwords → **PRIVATE! Keep secure!**

**The SQL files are safe to share. Just never share your `.env.local` file or Supabase credentials!**

---

## 🔗 Resources

- [Supabase Security Best Practices](https://supabase.com/docs/guides/platform/security)
- [Environment Variables Guide](https://vitejs.dev/guide/env-and-mode.html)
- [.gitignore Templates](https://github.com/github/gitignore)

---

**Remember:** When in doubt, don't share it! Better safe than sorry. 🔒
