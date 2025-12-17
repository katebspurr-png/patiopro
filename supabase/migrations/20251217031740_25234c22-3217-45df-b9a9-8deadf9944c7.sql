-- Create enum types for sun orientation and shade context
CREATE TYPE public.sun_orientation_type AS ENUM ('east', 'south', 'west', 'north', 'unknown');
CREATE TYPE public.shade_context_type AS ENUM ('open', 'partial', 'enclosed', 'unknown');

-- Add new columns to patios table
ALTER TABLE public.patios 
ADD COLUMN sun_orientation public.sun_orientation_type DEFAULT 'unknown',
ADD COLUMN shade_context public.shade_context_type DEFAULT 'unknown',
ADD COLUMN obstruction_context text DEFAULT '',
ADD COLUMN sun_confidence_notes text DEFAULT '';