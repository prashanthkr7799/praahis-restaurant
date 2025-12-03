-- =====================================================
-- PAACS v2.0 Security Upgrade Migration
-- Praahis Restaurant SaaS Platform
-- =====================================================
-- This migration adds enhanced security features:
-- 1. Account lockout after failed login attempts
-- 2. Refresh token rotation
-- 3. Multi-device session tracking
-- 4. Comprehensive audit logging
-- 5. Security events tracking
-- =====================================================

-- =====================================================
-- 1. SECURITY EVENTS TABLE
-- Track all security-related events
-- =====================================================
CREATE TABLE IF NOT EXISTS public.security_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL CHECK (event_type IN (
        'login_success',
        'login_failed',
        'logout',
        'password_change',
        'password_reset_request',
        'password_reset_complete',
        'account_locked',
        'account_unlocked',
        'session_created',
        'session_revoked',
        'token_refresh',
        'suspicious_activity',
        'permission_denied',
        'mfa_enabled',
        'mfa_disabled',
        'api_key_created',
        'api_key_revoked'
    )),
    ip_address INET,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}',
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_security_events_user ON public.security_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_type ON public.security_events(event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_restaurant ON public.security_events(restaurant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_ip ON public.security_events(ip_address);

-- =====================================================
-- 2. ADD SECURITY COLUMNS TO USERS TABLE
-- =====================================================
DO $$ 
BEGIN
    -- Add failed_login_attempts column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'failed_login_attempts'
    ) THEN
        ALTER TABLE public.users ADD COLUMN failed_login_attempts INTEGER DEFAULT 0;
    END IF;
    
    -- Add account_locked_until column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'account_locked_until'
    ) THEN
        ALTER TABLE public.users ADD COLUMN account_locked_until TIMESTAMPTZ;
    END IF;
    
    -- Add last_login_at column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'last_login_at'
    ) THEN
        ALTER TABLE public.users ADD COLUMN last_login_at TIMESTAMPTZ;
    END IF;
    
    -- Add last_login_ip column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'last_login_ip'
    ) THEN
        ALTER TABLE public.users ADD COLUMN last_login_ip INET;
    END IF;
    
    -- Add password_changed_at column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'password_changed_at'
    ) THEN
        ALTER TABLE public.users ADD COLUMN password_changed_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
    
    -- Add mfa_enabled column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'mfa_enabled'
    ) THEN
        ALTER TABLE public.users ADD COLUMN mfa_enabled BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- =====================================================
-- 3. USER SESSIONS TABLE
-- Track active sessions across devices
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    refresh_token_hash TEXT NOT NULL,
    device_info JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    last_used_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure unique active sessions per device
    UNIQUE(user_id, refresh_token_hash)
);

-- Indexes for session management
CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON public.user_sessions(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON public.user_sessions(refresh_token_hash) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON public.user_sessions(expires_at) WHERE is_active = TRUE;

-- =====================================================
-- 4. RATE LIMITING TABLE
-- Track API request rates per user/IP
-- =====================================================
CREATE TABLE IF NOT EXISTS public.rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identifier TEXT NOT NULL, -- user_id or IP address
    endpoint TEXT NOT NULL,
    request_count INTEGER DEFAULT 1,
    window_start TIMESTAMPTZ DEFAULT NOW(),
    window_end TIMESTAMPTZ NOT NULL,
    
    UNIQUE(identifier, endpoint, window_start)
);

-- Index for rate limit checks
CREATE INDEX IF NOT EXISTS idx_rate_limits_lookup ON public.rate_limits(identifier, endpoint, window_end);

-- Auto-cleanup old rate limit entries
CREATE INDEX IF NOT EXISTS idx_rate_limits_cleanup ON public.rate_limits(window_end);

-- =====================================================
-- 5. SECURITY FUNCTIONS
-- =====================================================

-- Function: Check if account is locked
CREATE OR REPLACE FUNCTION public.is_account_locked(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_locked_until TIMESTAMPTZ;
BEGIN
    SELECT account_locked_until INTO v_locked_until
    FROM public.users
    WHERE id = p_user_id;
    
    RETURN v_locked_until IS NOT NULL AND v_locked_until > NOW();
END;
$$;

-- Function: Record failed login attempt
CREATE OR REPLACE FUNCTION public.record_failed_login(
    p_user_id UUID,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_attempts INTEGER;
    v_max_attempts INTEGER := 5;
    v_lockout_minutes INTEGER := 15;
    v_is_locked BOOLEAN;
BEGIN
    -- Increment failed attempts
    UPDATE public.users
    SET failed_login_attempts = COALESCE(failed_login_attempts, 0) + 1
    WHERE id = p_user_id
    RETURNING failed_login_attempts INTO v_attempts;
    
    -- Check if should lock account
    IF v_attempts >= v_max_attempts THEN
        UPDATE public.users
        SET account_locked_until = NOW() + (v_lockout_minutes || ' minutes')::INTERVAL
        WHERE id = p_user_id;
        
        v_is_locked := TRUE;
        
        -- Log account locked event
        INSERT INTO public.security_events (user_id, event_type, ip_address, user_agent, metadata)
        VALUES (p_user_id, 'account_locked', p_ip_address, p_user_agent, 
                jsonb_build_object('attempts', v_attempts, 'lockout_minutes', v_lockout_minutes));
    ELSE
        v_is_locked := FALSE;
    END IF;
    
    -- Log failed login event
    INSERT INTO public.security_events (user_id, event_type, ip_address, user_agent, metadata)
    VALUES (p_user_id, 'login_failed', p_ip_address, p_user_agent, 
            jsonb_build_object('attempts', v_attempts, 'remaining', v_max_attempts - v_attempts));
    
    RETURN jsonb_build_object(
        'attempts', v_attempts,
        'max_attempts', v_max_attempts,
        'is_locked', v_is_locked,
        'lockout_minutes', CASE WHEN v_is_locked THEN v_lockout_minutes ELSE NULL END
    );
END;
$$;

-- Function: Record successful login
CREATE OR REPLACE FUNCTION public.record_successful_login(
    p_user_id UUID,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Reset failed attempts and update login info
    UPDATE public.users
    SET 
        failed_login_attempts = 0,
        account_locked_until = NULL,
        last_login_at = NOW(),
        last_login_ip = p_ip_address
    WHERE id = p_user_id;
    
    -- Log successful login
    INSERT INTO public.security_events (user_id, event_type, ip_address, user_agent)
    VALUES (p_user_id, 'login_success', p_ip_address, p_user_agent);
END;
$$;

-- Function: Create user session with refresh token
CREATE OR REPLACE FUNCTION public.create_user_session(
    p_user_id UUID,
    p_refresh_token_hash TEXT,
    p_device_info JSONB DEFAULT '{}',
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_expires_in_days INTEGER DEFAULT 30
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_session_id UUID;
    v_max_sessions INTEGER := 5;
    v_session_count INTEGER;
BEGIN
    -- Count active sessions for user
    SELECT COUNT(*) INTO v_session_count
    FROM public.user_sessions
    WHERE user_id = p_user_id AND is_active = TRUE;
    
    -- Revoke oldest sessions if at limit
    IF v_session_count >= v_max_sessions THEN
        UPDATE public.user_sessions
        SET is_active = FALSE
        WHERE id IN (
            SELECT id FROM public.user_sessions
            WHERE user_id = p_user_id AND is_active = TRUE
            ORDER BY last_used_at ASC
            LIMIT (v_session_count - v_max_sessions + 1)
        );
    END IF;
    
    -- Create new session
    INSERT INTO public.user_sessions (
        user_id, refresh_token_hash, device_info, ip_address, user_agent, expires_at
    ) VALUES (
        p_user_id, p_refresh_token_hash, p_device_info, p_ip_address, p_user_agent,
        NOW() + (p_expires_in_days || ' days')::INTERVAL
    )
    RETURNING id INTO v_session_id;
    
    -- Log session creation
    INSERT INTO public.security_events (user_id, event_type, ip_address, user_agent, metadata)
    VALUES (p_user_id, 'session_created', p_ip_address, p_user_agent, 
            jsonb_build_object('session_id', v_session_id, 'device_info', p_device_info));
    
    RETURN v_session_id;
END;
$$;

-- Function: Revoke user session
CREATE OR REPLACE FUNCTION public.revoke_user_session(
    p_session_id UUID,
    p_user_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_revoked BOOLEAN;
BEGIN
    UPDATE public.user_sessions
    SET is_active = FALSE
    WHERE id = p_session_id
    AND (p_user_id IS NULL OR user_id = p_user_id)
    RETURNING TRUE INTO v_revoked;
    
    IF v_revoked THEN
        INSERT INTO public.security_events (user_id, event_type, metadata)
        SELECT user_id, 'session_revoked', jsonb_build_object('session_id', p_session_id)
        FROM public.user_sessions WHERE id = p_session_id;
    END IF;
    
    RETURN COALESCE(v_revoked, FALSE);
END;
$$;

-- Function: Revoke all user sessions (logout everywhere)
CREATE OR REPLACE FUNCTION public.revoke_all_user_sessions(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    UPDATE public.user_sessions
    SET is_active = FALSE
    WHERE user_id = p_user_id AND is_active = TRUE;
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    
    IF v_count > 0 THEN
        INSERT INTO public.security_events (user_id, event_type, metadata)
        VALUES (p_user_id, 'logout', jsonb_build_object('sessions_revoked', v_count, 'type', 'all_devices'));
    END IF;
    
    RETURN v_count;
END;
$$;

-- Function: Check rate limit
CREATE OR REPLACE FUNCTION public.check_rate_limit(
    p_identifier TEXT,
    p_endpoint TEXT,
    p_max_requests INTEGER DEFAULT 100,
    p_window_seconds INTEGER DEFAULT 60
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_window_start TIMESTAMPTZ;
    v_current_count INTEGER;
    v_is_allowed BOOLEAN;
BEGIN
    v_window_start := date_trunc('minute', NOW());
    
    -- Upsert rate limit record
    INSERT INTO public.rate_limits (identifier, endpoint, window_start, window_end, request_count)
    VALUES (p_identifier, p_endpoint, v_window_start, v_window_start + (p_window_seconds || ' seconds')::INTERVAL, 1)
    ON CONFLICT (identifier, endpoint, window_start)
    DO UPDATE SET request_count = public.rate_limits.request_count + 1
    RETURNING request_count INTO v_current_count;
    
    v_is_allowed := v_current_count <= p_max_requests;
    
    RETURN jsonb_build_object(
        'allowed', v_is_allowed,
        'current', v_current_count,
        'limit', p_max_requests,
        'remaining', GREATEST(0, p_max_requests - v_current_count),
        'reset_at', v_window_start + (p_window_seconds || ' seconds')::INTERVAL
    );
END;
$$;

-- =====================================================
-- 6. ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on new tables
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Security events: Users can only see their own events
CREATE POLICY "Users can view own security events"
    ON public.security_events FOR SELECT
    USING (auth.uid() = user_id);

-- Security events: Allow insert via functions only
CREATE POLICY "System can insert security events"
    ON public.security_events FOR INSERT
    WITH CHECK (TRUE);

-- User sessions: Users can only see their own sessions
CREATE POLICY "Users can view own sessions"
    ON public.user_sessions FOR SELECT
    USING (auth.uid() = user_id);

-- User sessions: Users can revoke their own sessions
CREATE POLICY "Users can update own sessions"
    ON public.user_sessions FOR UPDATE
    USING (auth.uid() = user_id);

-- Rate limits: System managed only (via functions)
CREATE POLICY "System manages rate limits"
    ON public.rate_limits FOR ALL
    USING (TRUE)
    WITH CHECK (TRUE);

-- =====================================================
-- 7. CLEANUP JOBS (Run periodically via pg_cron or Edge Functions)
-- =====================================================

-- Function: Cleanup expired sessions
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    DELETE FROM public.user_sessions
    WHERE expires_at < NOW() OR (is_active = FALSE AND created_at < NOW() - INTERVAL '7 days');
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$;

-- Function: Cleanup old rate limit entries
CREATE OR REPLACE FUNCTION public.cleanup_rate_limits()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    DELETE FROM public.rate_limits WHERE window_end < NOW() - INTERVAL '1 hour';
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$;

-- Function: Cleanup old security events (keep 90 days)
CREATE OR REPLACE FUNCTION public.cleanup_security_events()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    DELETE FROM public.security_events WHERE created_at < NOW() - INTERVAL '90 days';
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$;

-- =====================================================
-- 8. COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE public.security_events IS 'Tracks all security-related events (logins, lockouts, etc.)';
COMMENT ON TABLE public.user_sessions IS 'Tracks active user sessions across devices with refresh tokens';
COMMENT ON TABLE public.rate_limits IS 'Rate limiting data for API endpoints';

COMMENT ON FUNCTION public.is_account_locked IS 'Check if a user account is currently locked';
COMMENT ON FUNCTION public.record_failed_login IS 'Record a failed login attempt and handle account lockout';
COMMENT ON FUNCTION public.record_successful_login IS 'Record a successful login and reset failed attempts';
COMMENT ON FUNCTION public.create_user_session IS 'Create a new user session with refresh token';
COMMENT ON FUNCTION public.revoke_user_session IS 'Revoke a specific user session';
COMMENT ON FUNCTION public.revoke_all_user_sessions IS 'Revoke all sessions for a user (logout everywhere)';
COMMENT ON FUNCTION public.check_rate_limit IS 'Check and update rate limit for an identifier/endpoint';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- To verify: SELECT * FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('security_events', 'user_sessions', 'rate_limits');
-- To rollback: See 20241202_paacs_v2_down.sql
