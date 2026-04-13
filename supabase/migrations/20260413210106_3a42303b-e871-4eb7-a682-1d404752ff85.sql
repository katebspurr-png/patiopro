
CREATE TABLE public.happy_hours (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  venue_name TEXT NOT NULL,
  neighborhood TEXT,
  days TEXT,
  time_range TEXT,
  details TEXT,
  address TEXT,
  phone TEXT,
  website TEXT,
  instagram TEXT,
  patio_id UUID REFERENCES public.patios(id) ON DELETE SET NULL,
  needs_verification BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.happy_hours ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active happy hours"
ON public.happy_hours FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage happy hours"
ON public.happy_hours FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_happy_hours_patio_id ON public.happy_hours(patio_id);
CREATE INDEX idx_happy_hours_neighborhood ON public.happy_hours(neighborhood);
