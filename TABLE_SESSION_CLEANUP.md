# Table Session Auto-Cleanup System

## What was implemented

A 5-minute inactivity timeout system that automatically releases tables when customers become inactive, preventing permanently stuck "occupied" tables.

## Key Features

1. **Auto-release after 5 minutes** - Tables freed automatically if no customer activity
2. **Activity heartbeat** - Customer browser sends signals every 45s to keep session alive
3. **Manager force-release** - Button in manager dashboard to manually release any table
4. **Real-time updates** - All dashboards (manager, waiter, chef) update instantly
5. **Handles edge cases** - Browser close, app switch, network failures, crashes

## What Changed

### Database (`phase3_migrations/08_table_sessions_and_auth.sql`)
- Added `last_activity_at` column to track customer interactions
- Added `update_session_activity()` - Updates timestamp on customer activity
- Added `cleanup_inactive_sessions()` - Finds and releases inactive sessions
- Added `force_release_table_session()` - Manager override function

### Frontend
- **Customer**: `src/pages/customer/TablePage.jsx` - Starts activity tracker
- **Customer**: `src/shared/utils/helpers/sessionActivityTracker.js` - Manages 45s heartbeat
- **Manager**: `src/pages/manager/TablesPage.jsx` - Force-release button + real-time updates
- **API**: `src/shared/utils/api/supabaseClient.js` - New functions for activity tracking

### Backend
- **Edge Function**: `supabase/functions/cleanup-inactive-sessions/` - Runs every 2 minutes via cron

## Setup Required

### 1. Migrations Already Applied ✅
The database changes are in `08_table_sessions_and_auth.sql` which runs automatically.

### 2. Deploy Edge Function
```bash
supabase functions deploy cleanup-inactive-sessions
```

### 3. Setup Cron Job (Choose One)

#### Option A: Supabase pg_cron (Recommended)
Run in Supabase SQL Editor:
```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
  'cleanup-inactive-sessions',
  '*/2 * * * *',
  $$SELECT net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/cleanup-inactive-sessions',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
      'Content-Type', 'application/json'
    )
  );$$
);
```

#### Option B: External Cron (Cron-job.org, etc.)
- URL: `https://YOUR_PROJECT.supabase.co/functions/v1/cleanup-inactive-sessions`
- Method: POST
- Header: `Authorization: Bearer YOUR_ANON_KEY`
- Schedule: Every 2 minutes

## Testing

### Verify Functions Exist
```sql
SELECT proname FROM pg_proc 
WHERE proname IN ('update_session_activity', 'cleanup_inactive_sessions', 'force_release_table_session');
```

### Check Active Sessions
```sql
SELECT t.table_number, 
       EXTRACT(EPOCH FROM (NOW() - ts.last_activity_at))/60 as inactive_mins
FROM table_sessions ts
JOIN tables t ON t.id = ts.table_id
WHERE ts.status = 'active';
```

### Test Manually
1. Scan QR code and open table page
2. Wait 5+ minutes without interaction
3. Verify table becomes available
4. Or use manager force-release button

## How It Works

```
Customer Activity → heartbeat every 45s → last_activity_at updated
                                              ↓
No activity for 5 min → cleanup_inactive_sessions() → session ended
                                              ↓
                                        table freed
```

## Monitoring

```sql
-- Recent auto-releases
SELECT t.table_number, ts.ended_at, 
       EXTRACT(EPOCH FROM (ts.ended_at - ts.last_activity_at))/60 as inactive_mins
FROM table_sessions ts
JOIN tables t ON t.id = ts.table_id
WHERE ts.status = 'completed'
  AND ts.ended_at > NOW() - INTERVAL '1 hour'
ORDER BY ts.ended_at DESC;
```

## Deployment

✅ Code pushed to GitHub  
⏳ Vercel will automatically deploy the frontend changes  
⚠️ Manual: Deploy edge function + setup cron job (see Setup above)

---

**Status**: Frontend deployed automatically ✅  
**Next**: Deploy edge function + setup cron job
