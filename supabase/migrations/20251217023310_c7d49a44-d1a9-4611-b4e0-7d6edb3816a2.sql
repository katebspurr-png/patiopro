-- Add new sun-derived fields to patios table
ALTER TABLE public.patios
ADD COLUMN IF NOT EXISTS sun_score integer DEFAULT 50,
ADD COLUMN IF NOT EXISTS sun_score_reason text DEFAULT 'sun unknown',
ADD COLUMN IF NOT EXISTS best_time_to_visit text DEFAULT 'check recent visits';

-- Create function to calculate sun fields from sun_profile
CREATE OR REPLACE FUNCTION public.calculate_sun_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- Normalize sun_profile if null or empty
  IF NEW.sun_profile IS NULL THEN
    NEW.sun_profile := 'unknown';
  END IF;
  
  -- Calculate derived fields based on sun_profile
  CASE NEW.sun_profile::text
    WHEN 'morning' THEN
      NEW.sun_score := 80;
      NEW.sun_score_reason := 'morning bias';
      NEW.best_time_to_visit := '9am–11:30am';
    WHEN 'midday' THEN
      NEW.sun_score := 90;
      NEW.sun_score_reason := 'strong midday sun';
      NEW.best_time_to_visit := '12pm–3pm';
    WHEN 'afternoon' THEN
      NEW.sun_score := 95;
      NEW.sun_score_reason := 'afternoon bias';
      NEW.best_time_to_visit := '2pm–sunset';
    WHEN 'mixed' THEN
      NEW.sun_score := 70;
      NEW.sun_score_reason := 'mixed exposure';
      NEW.best_time_to_visit := '12pm–4pm';
    ELSE
      NEW.sun_profile := 'unknown';
      NEW.sun_score := 50;
      NEW.sun_score_reason := 'sun unknown';
      NEW.best_time_to_visit := 'check recent visits';
  END CASE;
  
  -- Normalize tags: remove spaces after commas and filter to allowlist
  IF NEW.tags IS NOT NULL THEN
    DECLARE
      allowed_tags text[] := ARRAY['waterfront','dog_friendly','heated','beer_garden','rooftop','brunch','sheltered','courtyard','patio_bar'];
      normalized_tags text[] := '{}';
      tag text;
    BEGIN
      FOREACH tag IN ARRAY NEW.tags
      LOOP
        tag := TRIM(tag);
        IF tag = ANY(allowed_tags) THEN
          normalized_tags := array_append(normalized_tags, tag);
        END IF;
      END LOOP;
      NEW.tags := normalized_tags;
    END;
  END IF;
  
  -- Default is_active to true on insert
  IF TG_OP = 'INSERT' AND NEW.is_active IS NULL THEN
    NEW.is_active := true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = '';

-- Create trigger for insert/update
DROP TRIGGER IF EXISTS calculate_sun_fields_trigger ON public.patios;
CREATE TRIGGER calculate_sun_fields_trigger
BEFORE INSERT OR UPDATE ON public.patios
FOR EACH ROW
EXECUTE FUNCTION public.calculate_sun_fields();

-- Create admin function to recalculate all patios
CREATE OR REPLACE FUNCTION public.recalculate_all_sun_fields()
RETURNS integer AS $$
DECLARE
  updated_count integer;
BEGIN
  -- Touch all patios to trigger recalculation
  UPDATE public.patios
  SET updated_at = now()
  WHERE true;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Update existing patios to calculate their sun fields
UPDATE public.patios SET updated_at = now();