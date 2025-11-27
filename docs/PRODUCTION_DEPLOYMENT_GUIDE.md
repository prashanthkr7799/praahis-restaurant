# Production Deployment Guide - Manager Dashboard

**Last Updated**: November 22, 2025  
**Version**: 1.3.0  
**Status**: Ready for Deployment 🚀

---

## Pre-Deployment Checklist

### ✅ Database Migrations
- [x] All 19 Phase 3 migrations executed successfully
- [x] Schema verified (24 tables)
- [x] Indexes created (90+ indexes)
- [x] RLS policies active (77+ policies)
- [x] Cash reconciliation table created
- [x] Complaints issue_types converted to array

### ✅ Code Changes
- [x] DiscountModal.jsx - Paid order blocking
- [x] complaintService.js - Array validation
- [x] ManagerDashboard.jsx - 4 bonus tabs removed
- [x] All Manager Dashboard features tested locally

### ✅ Documentation
- [x] MIGRATIONS.md updated
- [x] MANAGER_DASHBOARD_FEATURES.md created
- [x] MANAGER_DASHBOARD_FINAL_SUMMARY.md created
- [x] MANAGER_DASHBOARD_QUICK_REFERENCE.md created
- [x] PHASE3_MIGRATIONS_EXECUTION_REPORT.md created

---

## Deployment Steps

### Step 1: Verify Local Build ✅

```bash
# Navigate to project directory
cd /Users/prashanth/Downloads/Praahis

# Install dependencies (if not already installed)
npm install

# Run local build test
npm run build

# Expected output:
# ✓ built in XXXXms
# dist/index.html
# dist/assets/...
```

**Verification**:
- [ ] Build completes without errors
- [ ] No TypeScript errors
- [ ] No ESLint warnings (critical)
- [ ] dist/ folder created with all assets

---

### Step 2: Test Production Build Locally

```bash
# Preview production build
npm run preview

# Expected output:
# Local:   http://localhost:4173/
# Network: use --host to expose
```

**Test Checklist**:
- [ ] App loads without errors
- [ ] Manager Dashboard accessible
- [ ] All 5 tabs render (Overview, Orders, Tables, Kitchen, Staff)
- [ ] No console errors
- [ ] Supabase connection works
- [ ] Real-time updates working

---

### Step 3: Environment Configuration Check

#### Verify `.env` file:
```bash
cat .env
```

**Required Variables**:
```env
VITE_SUPABASE_URL=https://hpcwpkjbmcelptwwxicn.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_RAZORPAY_KEY_ID=rzp_test_...
VITE_ENABLE_RAZORPAY=true
```

**Verify All Values Set**:
- [ ] VITE_SUPABASE_URL present
- [ ] VITE_SUPABASE_ANON_KEY present
- [ ] VITE_RAZORPAY_KEY_ID present
- [ ] No placeholder values

---

### Step 4: Deployment Options

#### **Option A: Vercel Deployment (Recommended)**

```bash
# Install Vercel CLI (if not installed)
npm install -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod

# Follow prompts:
# - Set up and deploy: Y
# - Which scope: [your account]
# - Link to existing project: Y/N
# - Project name: praahis-restaurant
# - Directory: ./
# - Override settings: N
```

**Post-Deployment**:
```bash
# Set environment variables in Vercel
vercel env add VITE_SUPABASE_URL production
vercel env add VITE_SUPABASE_ANON_KEY production
vercel env add VITE_RAZORPAY_KEY_ID production
vercel env add VITE_ENABLE_RAZORPAY production

# Redeploy with env vars
vercel --prod
```

**Vercel Dashboard Setup**:
1. Go to https://vercel.com/dashboard
2. Select your project
3. Settings → Environment Variables
4. Add all VITE_* variables
5. Redeploy from Deployments tab

---

#### **Option B: Netlify Deployment**

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Initialize site
netlify init

# Deploy
netlify deploy --prod

# Set environment variables
netlify env:set VITE_SUPABASE_URL "https://hpcwpkjbmcelptwwxicn.supabase.co"
netlify env:set VITE_SUPABASE_ANON_KEY "your_anon_key"
netlify env:set VITE_RAZORPAY_KEY_ID "your_razorpay_key"
netlify env:set VITE_ENABLE_RAZORPAY "true"

# Redeploy
netlify deploy --prod
```

---

#### **Option C: Self-Hosted (VPS/Server)**

```bash
# Build production bundle
npm run build

# Copy dist/ folder to server
scp -r dist/* user@your-server:/var/www/praahis/

# Nginx configuration (example)
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/praahis;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}

# Reload Nginx
sudo nginx -t && sudo systemctl reload nginx
```

---

### Step 5: Post-Deployment Verification

#### 5.1 Health Check URLs

Visit these URLs after deployment:

```
https://your-domain.com/
https://your-domain.com/manager
https://your-domain.com/staff
```

**Expected Results**:
- [ ] All pages load
- [ ] No 404 errors
- [ ] Assets load (CSS, JS, images)
- [ ] Supabase connection established

---

#### 5.2 Manager Dashboard Feature Tests

**Test Each Feature**:

1. **✅ Order Management**
   - View order list
   - Apply discount (verify paid order block)
   - Issue refund
   - Cancel order
   - Update order status

2. **✅ Complaint Tracking**
   - Create complaint with multiple issue types
   - View complaint list
   - Check array values displayed correctly

3. **✅ Split Payment**
   - Process split payment order
   - Verify cash + online split recorded

4. **✅ Cash Reconciliation**
   - Access reconciliation page
   - Enter denomination breakdown
   - Submit daily reconciliation

5. **✅ Real-time Updates**
   - Open two browser tabs
   - Update order in one tab
   - Verify update appears in other tab

6. **✅ Table Management**
   - View table status
   - Update table state
   - Generate QR codes

7. **✅ Kitchen Display**
   - View pending orders
   - Mark items as prepared
   - Real-time order updates

8. **✅ Staff Management**
   - Add staff member
   - Update roles
   - View staff list

---

#### 5.3 Browser Console Check

**Open DevTools (F12)**:

```javascript
// Check for errors
console.log('Checking for errors...');

// Verify Supabase connection
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);

// Check authentication
console.log('Auth state:', supabase.auth.getSession());
```

**Expected**:
- [ ] No red errors in console
- [ ] Supabase client initialized
- [ ] No 401/403 authentication errors

---

#### 5.4 Database Connection Test

```bash
# From your local machine
psql "postgresql://postgres:[PASSWORD]@db.hpcwpkjbmcelptwwxicn.supabase.co:5432/postgres" -c "SELECT COUNT(*) FROM orders;"

# Expected: Returns order count
```

---

### Step 6: Rollback Plan (If Needed)

#### Quick Rollback Steps:

**If issues occur**:

1. **Vercel**: Rollback to previous deployment
   ```bash
   # List deployments
   vercel ls
   
   # Promote previous deployment
   vercel promote [previous-deployment-url]
   ```

2. **Netlify**: Rollback to previous version
   - Go to Netlify Dashboard
   - Deployments → Pick previous successful deployment
   - Click "Publish deploy"

3. **Database**: Migrations are idempotent (safe)
   - No rollback needed unless critical bug
   - Use rollback procedures from PHASE3_MIGRATIONS_EXECUTION_REPORT.md

---

## Post-Deployment Monitoring

### 1. Application Performance

**Monitor**:
- Page load times (should be < 3s)
- API response times (should be < 500ms)
- Real-time subscription latency (should be < 1s)

**Tools**:
- Chrome DevTools → Network tab
- Chrome DevTools → Performance tab
- Supabase Dashboard → Logs

---

### 2. Database Performance

**Check Supabase Dashboard**:

1. **Database Health**:
   - Go to https://supabase.com/dashboard/project/hpcwpkjbmcelptwwxicn
   - Settings → Database
   - Monitor CPU, RAM, connections

2. **Query Performance**:
   - Database → Query Performance
   - Check slow queries (> 100ms)
   - Verify indexes being used

3. **Real-time Logs**:
   - Logs → Realtime
   - Monitor subscription activity

---

### 3. Error Tracking

**Setup Error Monitoring** (Optional but Recommended):

```bash
# Install Sentry
npm install @sentry/react @sentry/vite-plugin

# Add to main.jsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "your-sentry-dsn",
  environment: "production",
  tracesSampleRate: 1.0,
});
```

---

### 4. User Feedback Collection

**Monitor**:
- Staff feedback on Manager Dashboard usability
- Order processing times vs. previous system
- Complaint tracking effectiveness
- Cash reconciliation accuracy

---

## Maintenance Schedule

### Daily:
- [ ] Check error logs
- [ ] Monitor order volumes
- [ ] Verify real-time updates working

### Weekly:
- [ ] Review database performance
- [ ] Check for slow queries
- [ ] Analyze complaint trends
- [ ] Review cash reconciliation accuracy

### Monthly:
- [ ] Update dependencies (`npm update`)
- [ ] Review feature usage analytics
- [ ] Plan feature enhancements
- [ ] Database backup verification

---

## Support Contacts

### Technical Issues:

**Supabase Support**:
- Dashboard: https://supabase.com/dashboard
- Docs: https://supabase.com/docs
- Support: support@supabase.com

**Razorpay Support**:
- Dashboard: https://dashboard.razorpay.com
- Docs: https://razorpay.com/docs
- Support: support@razorpay.com

---

## Emergency Procedures

### Critical Bug Found:

1. **Immediate**: Rollback to previous deployment (see Step 6)
2. **Notify**: Alert all restaurant staff
3. **Fix**: Debug locally, test thoroughly
4. **Deploy**: Follow deployment steps again
5. **Verify**: Complete post-deployment tests

### Database Issue:

1. **Check**: Supabase Dashboard → Database Health
2. **Logs**: Review Database Logs for errors
3. **Backup**: Verify recent backups available
4. **Support**: Contact Supabase support if needed

### Authentication Issues:

1. **Check**: Supabase Dashboard → Authentication
2. **Verify**: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY correct
3. **RLS**: Ensure RLS policies not blocking legitimate access
4. **Sessions**: Check table_sessions for expired sessions

---

## Success Metrics

### Key Performance Indicators:

**Week 1 After Deployment**:
- [ ] Zero critical bugs
- [ ] All 15 Manager Dashboard features used
- [ ] Average order processing time < 5 minutes
- [ ] Cash reconciliation completed daily

**Month 1 After Deployment**:
- [ ] 95%+ uptime
- [ ] Staff satisfaction > 4/5
- [ ] Complaint resolution time < 24 hours
- [ ] Payment success rate > 95%

---

## Deployment Sign-off

**Pre-Deployment**:
- [ ] All migrations executed successfully ✅
- [ ] Code changes reviewed and tested
- [ ] Documentation complete
- [ ] Rollback plan prepared

**Deployment**:
- [ ] Production build successful
- [ ] Environment variables set
- [ ] Application deployed
- [ ] Health checks passed

**Post-Deployment**:
- [ ] All 15 features tested in production
- [ ] Real-time updates verified
- [ ] Database connections stable
- [ ] No critical errors in logs

**Approved By**: _________________  
**Date**: _________________  
**Deployment URL**: _________________

---

## Next Phase Planning

### Phase 4 Enhancements (Future):

1. **SMS Notifications**
   - Twilio/AWS SNS integration
   - Customer order ready alerts

2. **Advanced Analytics**
   - Revenue dashboards
   - Popular items analysis
   - Peak hour identification

3. **Multi-Restaurant Management**
   - Chain restaurant support
   - Centralized reporting
   - Cross-restaurant analytics

4. **Mobile Apps**
   - React Native customer app
   - Staff mobile interface
   - Push notifications

---

*End of Deployment Guide*

**Status**: Ready for Production Deployment 🚀

All systems operational. Manager Dashboard features enabled. Database migrations complete.

**Deploy with confidence!** ✅
