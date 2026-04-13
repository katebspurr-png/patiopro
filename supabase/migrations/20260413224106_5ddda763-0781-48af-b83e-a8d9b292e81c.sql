
ALTER TABLE public.patios
ADD COLUMN wind_exposure text NOT NULL DEFAULT 'partial'
CHECK (wind_exposure IN ('exposed', 'partial', 'sheltered'));

ALTER TABLE public.patios
ADD COLUMN wind_shelter_score integer NOT NULL DEFAULT 50
CHECK (wind_shelter_score >= 0 AND wind_shelter_score <= 100);
