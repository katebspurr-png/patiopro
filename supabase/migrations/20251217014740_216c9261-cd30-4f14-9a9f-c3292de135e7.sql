-- Fix 1: favorites_with_check - Add explicit WITH CHECK for INSERT
DROP POLICY IF EXISTS "Users can manage own favorites" ON favorites;

CREATE POLICY "Users can view own favorites"
ON favorites FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own favorites"
ON favorites FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own favorites"
ON favorites FOR DELETE
USING (user_id = auth.uid());

-- Fix 2: sun_reports_notes_validation - Add constraint and validation trigger
ALTER TABLE sun_reports 
ADD CONSTRAINT sun_reports_notes_length_check 
CHECK (notes IS NULL OR length(notes) <= 500);

-- Add similar constraints to other text fields for consistency
ALTER TABLE patio_submissions 
ADD CONSTRAINT patio_submissions_notes_length_check 
CHECK (notes IS NULL OR length(notes) <= 1000);

ALTER TABLE profiles 
ADD CONSTRAINT profiles_display_name_length_check 
CHECK (display_name IS NULL OR length(display_name) <= 100);