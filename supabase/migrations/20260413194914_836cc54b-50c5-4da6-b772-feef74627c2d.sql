CREATE TYPE public.price_range_type AS ENUM ('low', 'medium', 'high', 'unknown');

ALTER TABLE public.patios
ADD COLUMN price_range public.price_range_type NOT NULL DEFAULT 'unknown';