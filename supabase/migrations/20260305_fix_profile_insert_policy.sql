-- Fix missing INSERT policy for profiles table
-- This allows users to insert their own profile if it doesn't exist

-- Add INSERT policy for profiles
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Also ensure the upsert works by adding a combined policy for convenience
-- This handles cases where the client does an upsert operation
