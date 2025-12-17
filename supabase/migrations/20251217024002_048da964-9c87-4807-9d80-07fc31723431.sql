-- 1) Create confidence_level enum
CREATE TYPE public.confidence_level AS ENUM ('low', 'medium', 'high');

-- 2) Create time_of_day enum for sun_checks
CREATE TYPE public.time_of_day AS ENUM ('morning', 'midday', 'afternoon');

-- 3) Create app_settings table (single-row config)
CREATE TABLE public.app_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  enable_confidence_level boolean NOT NULL DEFAULT false,
  enable_crowd_sun_feedback boolean NOT NULL DEFAULT false,
  enable_seasonal_adjustment boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Insert default row
INSERT INTO public.app_settings (id) VALUES ('00000000-0000-0000-0000-000000000001');

-- Enable RLS
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read settings
CREATE POLICY "Anyone can view app settings"
ON public.app_settings FOR SELECT
USING (true);

-- Only admins can update settings
CREATE POLICY "Admins can update app settings"
ON public.app_settings FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- 4) Add confidence_level to patios
ALTER TABLE public.patios 
ADD COLUMN confidence_level public.confidence_level DEFAULT NULL;

-- 5) Add crowd feedback rollup columns to patios
ALTER TABLE public.patios 
ADD COLUMN sunny_votes integer NOT NULL DEFAULT 0,
ADD COLUMN not_sunny_votes integer NOT NULL DEFAULT 0,
ADD COLUMN last_sun_check_at timestamp with time zone DEFAULT NULL;

-- 6) Add seasonal adjustment columns to patios
ALTER TABLE public.patios 
ADD COLUMN sun_score_tuned integer DEFAULT NULL,
ADD COLUMN seasonal_adjustment_notes text DEFAULT NULL;

-- 7) Create sun_checks table
CREATE TABLE public.sun_checks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patio_id uuid NOT NULL REFERENCES public.patios(id) ON DELETE CASCADE,
  user_id uuid DEFAULT NULL,
  visited_at timestamp with time zone NOT NULL DEFAULT now(),
  was_sunny boolean NOT NULL,
  time_of_day public.time_of_day NOT NULL,
  notes text DEFAULT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  device_fingerprint text DEFAULT NULL
);

-- Enable RLS on sun_checks
ALTER TABLE public.sun_checks ENABLE ROW LEVEL SECURITY;

-- Anyone can view sun_checks
CREATE POLICY "Anyone can view sun checks"
ON public.sun_checks FOR SELECT
USING (true);

-- Anyone can insert sun_checks (with anti-spam handled in app)
CREATE POLICY "Anyone can add sun checks"
ON public.sun_checks FOR INSERT
WITH CHECK (true);

-- Admins can manage sun_checks
CREATE POLICY "Admins can manage sun checks"
ON public.sun_checks FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- 8) Create trigger to update rollups on sun_checks insert
CREATE OR REPLACE FUNCTION public.update_patio_sun_check_rollups()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  IF NEW.was_sunny THEN
    UPDATE public.patios 
    SET sunny_votes = sunny_votes + 1, last_sun_check_at = NEW.created_at
    WHERE id = NEW.patio_id;
  ELSE
    UPDATE public.patios 
    SET not_sunny_votes = not_sunny_votes + 1, last_sun_check_at = NEW.created_at
    WHERE id = NEW.patio_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_sun_check_insert
AFTER INSERT ON public.sun_checks
FOR EACH ROW
EXECUTE FUNCTION public.update_patio_sun_check_rollups();

-- 9) Create function to check anti-spam (2 hour window)
CREATE OR REPLACE FUNCTION public.can_submit_sun_check(
  p_patio_id uuid,
  p_user_id uuid DEFAULT NULL,
  p_device_fingerprint text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  recent_count integer;
BEGIN
  SELECT COUNT(*) INTO recent_count
  FROM public.sun_checks
  WHERE patio_id = p_patio_id
    AND created_at > (now() - interval '2 hours')
    AND (
      (p_user_id IS NOT NULL AND user_id = p_user_id)
      OR (p_device_fingerprint IS NOT NULL AND device_fingerprint = p_device_fingerprint)
    );
  
  RETURN recent_count = 0;
END;
$$;