-- Fix search_path for update_updated_at function
-- This function is used as a trigger and only accesses NEW record, so empty search_path is safe
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;