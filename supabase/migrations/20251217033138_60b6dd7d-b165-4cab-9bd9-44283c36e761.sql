-- Add 'all_day' to sun_profile_type enum
ALTER TYPE sun_profile_type ADD VALUE IF NOT EXISTS 'all_day';

-- Create the recalculate_sun_outputs function with the specified heuristic
CREATE OR REPLACE FUNCTION public.recalculate_sun_outputs(
  p_patio_id uuid DEFAULT NULL,
  p_time_of_day text DEFAULT 'midday'
)
RETURNS TABLE(patio_id uuid, sun_score integer, sun_score_reason text, best_time_to_visit text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  rec RECORD;
  base_score integer;
  shade_adj integer;
  orientation_adj integer;
  notes_adj integer;
  final_score integer;
  reason text;
  best_time text;
  sun_notes_lower text;
  time_of_day text;
BEGIN
  -- Normalize time_of_day input
  time_of_day := COALESCE(LOWER(p_time_of_day), 'midday');
  IF time_of_day NOT IN ('morning', 'midday', 'afternoon', 'evening') THEN
    time_of_day := 'midday';
  END IF;

  FOR rec IN 
    SELECT p.id, p.sun_profile, p.sun_orientation, p.shade_context, p.sun_notes
    FROM patios p
    WHERE (p_patio_id IS NULL OR p.id = p_patio_id)
  LOOP
    -- 1) Base from sun_profile
    CASE rec.sun_profile::text
      WHEN 'all_day' THEN base_score := 85;
      WHEN 'afternoon' THEN base_score := 75;
      WHEN 'morning' THEN base_score := 70;
      WHEN 'midday' THEN base_score := 80; -- Keep midday support for backwards compat
      WHEN 'mixed' THEN base_score := 60;
      ELSE base_score := 55; -- unknown
    END CASE;

    -- 2) Shade adjustment
    CASE rec.shade_context::text
      WHEN 'open' THEN shade_adj := 10;
      WHEN 'partial' THEN shade_adj := 0;
      WHEN 'enclosed' THEN shade_adj := -12;
      ELSE shade_adj := 0; -- unknown
    END CASE;

    -- 3) Orientation × time_of_day nudges
    orientation_adj := 0;
    IF time_of_day = 'morning' THEN
      CASE rec.sun_orientation::text
        WHEN 'east' THEN orientation_adj := 8;
        WHEN 'south' THEN orientation_adj := 4;
        WHEN 'west' THEN orientation_adj := -4;
        WHEN 'north' THEN orientation_adj := -6;
        ELSE orientation_adj := 0;
      END CASE;
    ELSIF time_of_day = 'midday' THEN
      CASE rec.sun_orientation::text
        WHEN 'south' THEN orientation_adj := 6;
        WHEN 'east' THEN orientation_adj := 2;
        WHEN 'west' THEN orientation_adj := 2;
        WHEN 'north' THEN orientation_adj := -6;
        ELSE orientation_adj := 0;
      END CASE;
    ELSIF time_of_day = 'afternoon' THEN
      CASE rec.sun_orientation::text
        WHEN 'west' THEN orientation_adj := 8;
        WHEN 'south' THEN orientation_adj := 4;
        WHEN 'east' THEN orientation_adj := -4;
        WHEN 'north' THEN orientation_adj := -6;
        ELSE orientation_adj := 0;
      END CASE;
    ELSIF time_of_day = 'evening' THEN
      CASE rec.sun_orientation::text
        WHEN 'west' THEN orientation_adj := 6;
        WHEN 'south' THEN orientation_adj := 2;
        WHEN 'east' THEN orientation_adj := -6;
        WHEN 'north' THEN orientation_adj := -6;
        ELSE orientation_adj := 0;
      END CASE;
    END IF;

    -- 4) Sun notes nudges (keyword match, case-insensitive)
    notes_adj := 0;
    sun_notes_lower := LOWER(COALESCE(rec.sun_notes, ''));
    
    IF sun_notes_lower ~ '(street canyon|tall buildings|high rises|shaded by buildings)' THEN
      notes_adj := notes_adj - 8;
    END IF;
    IF sun_notes_lower ~ 'courtyard' THEN
      notes_adj := notes_adj - 4;
    END IF;
    IF sun_notes_lower ~ '(waterfront|open sky|rooftop)' THEN
      notes_adj := notes_adj + 4;
    END IF;
    IF sun_notes_lower ~ '(tree cover|lots of trees)' THEN
      notes_adj := notes_adj - 4;
    END IF;

    -- 5) Clamp final score to 0-100
    final_score := GREATEST(0, LEAST(100, base_score + shade_adj + orientation_adj + notes_adj));

    -- Generate sun_score_reason (2-5 words)
    IF rec.sun_profile::text = 'all_day' AND rec.shade_context::text = 'open' THEN
      reason := 'All-day sun';
    ELSIF sun_notes_lower ~ '(street canyon|tall buildings|high rises|shaded by buildings)' 
          AND NOT (rec.sun_profile::text = 'all_day' AND rec.shade_context::text = 'open') THEN
      reason := 'Urban shade risk';
    ELSIF rec.shade_context::text = 'enclosed' THEN
      reason := 'Often shaded';
    ELSIF rec.sun_profile::text IN ('afternoon', 'midday') THEN
      reason := 'Afternoon bias';
    ELSIF rec.sun_profile::text = 'morning' THEN
      reason := 'Morning bias';
    ELSIF rec.sun_profile::text = 'mixed' THEN
      reason := 'Mixed sun & shade';
    ELSE
      reason := 'Sun varies';
    END IF;

    -- Generate best_time_to_visit (one sentence)
    CASE rec.sun_profile::text
      WHEN 'all_day' THEN 
        best_time := 'Usually sunny all day — anytime works on a clear day.';
      WHEN 'morning' THEN 
        best_time := 'Best in the morning, especially on bright days.';
      WHEN 'afternoon', 'midday' THEN 
        best_time := 'Best from early afternoon onward on sunny days.';
      WHEN 'mixed' THEN 
        best_time := 'Try midday or early afternoon for your best odds.';
      ELSE 
        best_time := 'Try midday on a clear day and adjust based on shade.';
    END CASE;
    
    -- Add clause for enclosed shade_context
    IF rec.shade_context::text = 'enclosed' THEN
      best_time := RTRIM(best_time, '.') || ', great when it''s bright out.';
    END IF;

    -- Update the patio record
    UPDATE patios 
    SET 
      sun_score = final_score,
      sun_score_reason = reason,
      best_time_to_visit = best_time,
      updated_at = now()
    WHERE id = rec.id;

    -- Return the computed values
    patio_id := rec.id;
    sun_score := final_score;
    sun_score_reason := reason;
    best_time_to_visit := best_time;
    RETURN NEXT;
  END LOOP;
END;
$$;

-- Replace the trigger function to use the new calculation
CREATE OR REPLACE FUNCTION public.calculate_sun_fields()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO ''
AS $$
DECLARE
  allowed_tags text[] := ARRAY['waterfront','dog_friendly','heated','beer_garden','rooftop','brunch','sheltered','courtyard','patio_bar'];
  normalized_tags text[] := '{}';
  tag text;
BEGIN
  -- Normalize sun_profile if null or empty
  IF NEW.sun_profile IS NULL THEN
    NEW.sun_profile := 'unknown';
  END IF;
  
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
$$;

-- Create a separate trigger to run sun score calculation after insert/update
CREATE OR REPLACE FUNCTION public.trigger_recalculate_sun_outputs()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only recalculate if relevant sun fields changed
  IF TG_OP = 'INSERT' OR 
     OLD.sun_profile IS DISTINCT FROM NEW.sun_profile OR
     OLD.sun_orientation IS DISTINCT FROM NEW.sun_orientation OR
     OLD.shade_context IS DISTINCT FROM NEW.shade_context OR
     OLD.sun_notes IS DISTINCT FROM NEW.sun_notes THEN
    PERFORM recalculate_sun_outputs(NEW.id, 'midday');
  END IF;
  RETURN NEW;
END;
$$;

-- Drop existing trigger if exists and create new one
DROP TRIGGER IF EXISTS trigger_sun_score_calculation ON patios;
CREATE TRIGGER trigger_sun_score_calculation
AFTER INSERT OR UPDATE ON patios
FOR EACH ROW
EXECUTE FUNCTION trigger_recalculate_sun_outputs();

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.recalculate_sun_outputs(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.recalculate_sun_outputs(uuid, text) TO anon;