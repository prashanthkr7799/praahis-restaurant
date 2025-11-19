-- ============================================================================
-- 04_billing_cron_jobs.sql
-- Schedules automated billing / trial expiration / suspension tasks via pg_cron
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Generate Monthly Bills (1st of month at 00:00 UTC)
SELECT cron.schedule('generate-monthly-bills','0 0 1 * *', $$
  SELECT generate_monthly_bills(EXTRACT(MONTH FROM CURRENT_DATE)::INT, EXTRACT(YEAR FROM CURRENT_DATE)::INT);
$$);

-- Expire Trial Subscriptions (daily midnight)
SELECT cron.schedule('expire-trial-subscriptions','0 0 * * *', $$ SELECT expire_trial_subscriptions(); $$);

-- Suspend Overdue Restaurants (daily midnight)
SELECT cron.schedule('suspend-overdue-restaurants','0 0 * * *', $$ SELECT suspend_overdue_subscriptions(); $$);

-- View jobs: SELECT * FROM cron.job;
-- Unschedule example: SELECT cron.unschedule('generate-monthly-bills');

DO $$ BEGIN RAISE NOTICE 'Cron jobs configured: billing generation, trial expiration, suspension'; END $$;
