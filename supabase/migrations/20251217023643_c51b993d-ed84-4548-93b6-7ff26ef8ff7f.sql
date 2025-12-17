-- Add sun_score_base column
ALTER TABLE public.patios
ADD COLUMN IF NOT EXISTS sun_score_base integer;

-- Update trigger to set both sun_score and sun_score_base
CREATE OR REPLACE FUNCTION public.calculate_sun_fields()
RETURNS TRIGGER AS $$
DECLARE
  allowed_tags text[] := ARRAY['waterfront','dog_friendly','heated','beer_garden','rooftop','brunch','sheltered','courtyard','patio_bar'];
  normalized_tags text[] := '{}';
  tag text;
  calculated_score integer;
BEGIN
  -- Normalize sun_profile if null or empty
  IF NEW.sun_profile IS NULL THEN
    NEW.sun_profile := 'unknown';
  END IF;
  
  -- Calculate derived fields based on sun_profile
  CASE NEW.sun_profile::text
    WHEN 'morning' THEN
      calculated_score := 80;
      NEW.sun_score_reason := 'morning bias';
      NEW.best_time_to_visit := '9am–11:30am';
    WHEN 'midday' THEN
      calculated_score := 90;
      NEW.sun_score_reason := 'strong midday sun';
      NEW.best_time_to_visit := '12pm–3pm';
    WHEN 'afternoon' THEN
      calculated_score := 95;
      NEW.sun_score_reason := 'afternoon bias';
      NEW.best_time_to_visit := '2pm–sunset';
    WHEN 'mixed' THEN
      calculated_score := 70;
      NEW.sun_score_reason := 'mixed exposure';
      NEW.best_time_to_visit := '12pm–4pm';
    ELSE
      NEW.sun_profile := 'unknown';
      calculated_score := 50;
      NEW.sun_score_reason := 'sun unknown';
      NEW.best_time_to_visit := 'check recent visits';
  END CASE;
  
  -- Set both sun_score and sun_score_base to keep them in sync
  NEW.sun_score := calculated_score;
  NEW.sun_score_base := calculated_score;
  
  -- Normalize tags: remove spaces and filter to allowlist
  IF NEW.tags IS NOT NULL THEN
    FOREACH tag IN ARRAY NEW.tags
    LOOP
      tag := TRIM(tag);
      IF tag = ANY(allowed_tags) THEN
        normalized_tags := array_append(normalized_tags, tag);
      END IF;
    END LOOP;
    NEW.tags := normalized_tags;
  END IF;
  
  -- Default is_active to true on insert
  IF TG_OP = 'INSERT' AND NEW.is_active IS NULL THEN
    NEW.is_active := true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = '';

-- Create backfill function for admin
CREATE OR REPLACE FUNCTION public.backfill_sun_score_base()
RETURNS integer AS $$
DECLARE
  updated_count integer := 0;
  backfilled_from_score integer;
  backfilled_default integer;
BEGIN
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';