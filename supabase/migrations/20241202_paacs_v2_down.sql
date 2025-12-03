-- =====================================================
-- PAACS v2.0 Security Upgrade - ROLLBACK Migration
-- =====================================================
-- Use this to revert PAACS v2.0 changes if needed
-- =====================================================

-- Drop functions
DROP FUNCTION IF EXISTS public.cleanup_security_events();
DROP FUNCTION IF EXISTS public.cleanup_rate_limits();
DROP FUNCTION IF EXISTS public.cleanup_expired_sessions();
DROP FUNCTION IF EXISTS public.check_rate_limit(TEXT, TEXT, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS public.revoke_all_user_sessions(UUID);
DROP FUNCTION IF EXISTS public.revoke_user_session(UUID, UUID);
DROP FUNCTION IF EXISTS public.create_user_session(UUID, TEXT, JSONB, INET, TEXT, INTEGER);
DROP FUNCTION IF EXISTS public.record_successful_login(UUID, INET, TEXT);
DROP FUNCTION IF EXISTS public.record_failed_login(UUID, INET, TEXT);
DROP FUNCTION IF EXISTS public.is_account_locked(UUID);

-- Drop policies
DROP POLICY IF EXISTS "System manages rate limits" ON public.rate_limits;
DROP POLICY IF EXISTS "Users can update own sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Users can view own sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "System can insert security events" ON public.security_events;
DROP POLICY IF EXISTS "Users can view own security events" ON public.security_events;

-- Drop tables
DROP TABLE IF EXISTS public.rate_limits;
DROP TABLE IF EXISTS public.user_sessions;
DROP TABLE IF EXISTS public.security_events;

-- Remove columns from users table (optional - comment out if you want to keep data)
-- ALTER TABLE public.users DROP COLUMN IF EXISTS failed_login_attempts;
-- ALTER TABLE public.users DROP COLUMN IF EXISTS account_locked_until;
-- ALTER TABLE public.users DROP COLUMN IF EXISTS last_login_at;
-- ALTER TABLE public.users DROP COLUMN IF EXISTS last_login_ip;
-- ALTER TABLE public.users DROP COLUMN IF EXISTS password_changed_at;
-- ALTER TABLE public.users DROP COLUMN IF EXISTS mfa_enabled;

-- =====================================================
-- ROLLBACK COMPLETE
-- =====================================================
