-- Fix PUBLIC_DATA_EXPOSURE: User emails publicly accessible
-- Replace overly permissive policy with restricted access

DROP POLICY IF EXISTS "Anyone can view profiles" ON profiles;

-- Users can only view their own profile
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (id = auth.uid());

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
ON profiles FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));