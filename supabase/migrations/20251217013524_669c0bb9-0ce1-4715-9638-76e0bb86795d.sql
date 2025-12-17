-- Fix patio_submissions INSERT policy to prevent user impersonation
-- Allow anonymous submissions (NULL) or authenticated users with their own ID

DROP POLICY IF EXISTS "Anyone can submit patios" ON patio_submissions;

CREATE POLICY "Anyone can submit patios" 
ON patio_submissions FOR INSERT 
WITH CHECK (
  submitted_by_user_id IS NULL OR 
  submitted_by_user_id = auth.uid()
);