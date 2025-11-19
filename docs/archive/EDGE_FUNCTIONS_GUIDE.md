# Edge Functions Deployment Guide

## 📦 What's Included

Three Supabase Edge Functions for automated billing:

1. **monthly-bill-generator** - Generates bills on 1st of month
2. **daily-suspension-check** - Auto-suspends overdue restaurants  
3. **payment-webhook** - Handles payment gateway webhooks

---

## 🚀 Deployment Steps

### Prerequisites
```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref YOUR_PROJECT_REF
```

### 1. Deploy Edge Functions

```bash
# Deploy all three functions
supabase functions deploy monthly-bill-generator
supabase functions deploy daily-suspension-check
supabase functions deploy payment-webhook
```

### 2. Set Environment Variables

```bash
# For payment webhook (if using Razorpay)
supabase secrets set RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_here
```

---

## ⏰ Set Up Automated Scheduling

### Enable pg_cron Extension

Go to **Supabase Dashboard** → **Database** → **Extensions**

Enable: `pg_cron` and `http`

### Schedule Monthly Bill Generation

Run this SQL in your Supabase SQL Editor:

```sql
-- Schedule: Run on 1st of every month at 00:00 UTC
SELECT cron.schedule(
  'monthly-bill-generation',
  '0 0 1 * *',
  $$
  SELECT
    net.http_post(
      url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/monthly-bill-generator',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer YOUR_ANON_KEY'
      )
    ) as request_id;
  $$
);
```

### Schedule Daily Suspension Check

```sql
-- Schedule: Run daily at 02:00 UTC
SELECT cron.schedule(
  'daily-suspension-check',
  '0 2 * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/daily-suspension-check',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer YOUR_ANON_KEY'
      )
    ) as request_id;
  $$
);
```

---

## 🔗 Configure Payment Gateway Webhooks

### For Razorpay

1. Go to **Razorpay Dashboard** → **Settings** → **Webhooks**
2. Click **Add Webhook URL**
3. Enter URL: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/payment-webhook`
4. Select events:
   - `payment.captured`
   - `payment.failed`
5. Copy the **Webhook Secret**
6. Set it as environment variable:
   ```bash
   supabase secrets set RAZORPAY_WEBHOOK_SECRET=whsec_...
   ```

### For Stripe

Similar process:
- Webhook URL: Same as above
- Events: `payment_intent.succeeded`, `charge.failed`

---

## 🧪 Testing

### Test Monthly Bill Generator

```bash
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/monthly-bill-generator \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json"
```

Expected response:
```json
{
  "success": true,
  "message": "Successfully generated 5 bills",
  "bills": [...],
  "summary": {
    "total_bills": 5,
    "total_amount": 150000,
    "generated_at": "2025-11-07T..."
  }
}
```

### Test Daily Suspension Check

```bash
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/daily-suspension-check \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json"
```

Expected response:
```json
{
  "success": true,
  "message": "Checked all restaurants. Suspended 2.",
  "suspended": [...],
  "warnings": [...],
  "summary": {
    "suspended_count": 2,
    "warning_count": 3,
    "checked_at": "2025-11-07T..."
  }
}
```

### Test Payment Webhook

```bash
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/payment-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "event": "payment.captured",
    "payload": {
      "payment": {
        "entity": {
          "id": "pay_test123",
          "amount": 30000,
          "method": "upi",
          "notes": {
            "billing_id": "YOUR_BILLING_UUID"
          }
        }
      }
    }
  }'
```

---

## 📊 Monitoring

### View Cron Job Status

```sql
-- Check scheduled jobs
SELECT * FROM cron.job;

-- Check job run history
SELECT * FROM cron.job_run_details 
ORDER BY start_time DESC 
LIMIT 10;
```

### View Edge Function Logs

Go to **Supabase Dashboard** → **Edge Functions** → Select function → **Logs**

Or use CLI:
```bash
supabase functions logs monthly-bill-generator
```

---

## 🔧 Troubleshooting

### Edge Function Not Triggering

1. Check cron job is active:
   ```sql
   SELECT * FROM cron.job WHERE jobname = 'monthly-bill-generation';
   ```

2. Check for errors:
   ```sql
   SELECT * FROM cron.job_run_details 
   WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'monthly-bill-generation')
   ORDER BY start_time DESC LIMIT 5;
   ```

3. Verify function URL is correct
4. Check API key has correct permissions

### Webhook Not Working

1. Verify webhook secret is set correctly
2. Check Razorpay webhook logs
3. Test with curl command above
4. Verify billing_id is passed in payment metadata

### Bills Not Generating

1. Check if restaurants have tables:
   ```sql
   SELECT r.name, COUNT(t.id) as table_count
   FROM restaurants r
   LEFT JOIN tables t ON t.restaurant_id = r.id
   GROUP BY r.id, r.name;
   ```

2. Manually trigger bill generation:
   ```sql
   SELECT * FROM generate_monthly_bills();
   ```

---

## 🔄 Unscheduling Jobs

```sql
-- Remove monthly bill generation
SELECT cron.unschedule('monthly-bill-generation');

-- Remove daily suspension check
SELECT cron.unschedule('daily-suspension-check');
```

---

## 📝 Notes

- All times are in UTC
- Webhook signatures are verified for security
- Failed payments are logged to audit trail
- Edge Functions run with service role privileges (bypass RLS)
- Cron jobs require the `http` extension

---

## ✅ Checklist

- [ ] Deployed all 3 Edge Functions
- [ ] Enabled `pg_cron` extension
- [ ] Enabled `http` extension  
- [ ] Set up monthly bill generation cron
- [ ] Set up daily suspension check cron
- [ ] Configured Razorpay webhook
- [ ] Set webhook secret environment variable
- [ ] Tested bill generation manually
- [ ] Tested suspension check manually
- [ ] Tested payment webhook
- [ ] Verified audit trail logs
- [ ] Monitored first automatic run

---

**Next Steps**: Once Edge Functions are working, proceed to building the UI components for payment management!
