-- Revoke public/anon direct RPC access to recalculate_sun_outputs
-- The function is still callable by triggers (which run as SECURITY DEFINER)
-- but not directly by unauthenticated or regular users

REVOKE EXECUTE ON FUNCTION public.recalculate_sun_outputs(uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.recalculate_sun_outputs(uuid, text) FROM authenticated;

-- Only grant to service_role and postgres (for triggers and admin operations)
GRANT EXECUTE ON FUNCTION public.recalculate_sun_outputs(uuid, text) TO service_role;