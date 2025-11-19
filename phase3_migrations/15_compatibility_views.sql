-- ============================================================================
-- COMPATIBILITY VIEW: audit_logs → audit_trail
-- ============================================================================
-- This view provides backward compatibility for any legacy code that references
-- the old 'audit_logs' table name. The canonical table is 'audit_trail'.
-- Created: 2025-11-18
-- ============================================================================

CREATE OR REPLACE VIEW public.audit_logs AS 
SELECT * FROM public.audit_trail;

-- Grant same permissions as audit_trail
GRANT SELECT ON public.audit_logs TO authenticated;
GRANT SELECT ON public.audit_logs TO anon;

COMMENT ON VIEW public.audit_logs IS 'Compatibility view for legacy audit_logs references. Use audit_trail table directly for new code.';
