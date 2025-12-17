-- Fix SECURITY DEFINER functions to include admin authorization checks

-- Update recalculate_all_sun_fields to require admin role
CREATE OR REPLACE FUNCTION public.recalculate_all_sun_fields()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  updated_count integer;
BEGIN
  -- Require admin role
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;

  -- Touch all patios to trigger recalculation
  UPDATE public.patios
  SET updated_at = now()
  WHERE true;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$function$;

-- Update backfill_sun_score_base to require admin role
CREATE OR REPLACE FUNCTION public.backfill_sun_score_base()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  updated_count integer := 0;
  backfilled_from_score integer;
  backfilled_default integer;
BEGIN
  -- Require admin role
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;

  -- Backfill from sun_score where sun_score_base is null but sun_score exists
  UPDATE public.patios
  SET sun_score_base = sun_score
  WHERE sun_score_base IS NULL AND sun_score IS NOT NULL;
  GET DIAGNOSTICS backfilled_from_score = ROW_COUNT;
  
  -- Set defaults where both are null
  UPDATE public.patios
  SET 
    sun_score_base = 50,
    sun_score = 50,
    sun_profile = COALESCE(NULLIF(sun_profile::text, ''), 'unknown')::public.sun_profile_type
  WHERE sun_score_base IS NULL AND sun_score IS NULL;
  GET DIAGNOSTICS backfilled_default = ROW_COUNT;
  
  updated_count := backfilled_from_score + backfilled_default;
  RETURN updated_count;
END;
$function$;