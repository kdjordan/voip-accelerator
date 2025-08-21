-- Migration: Fix Security Issues
-- Date: 2025-08-20
-- Description: Fixes search_path security warnings and auth password protection
-- Author: VoIP Accelerator Security Fix

-- =====================================================
-- 1. Fix handle_new_user_trial function - Add search_path
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user_trial()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, plan_expires_at, subscription_status, updated_at)
  VALUES (
    NEW.id,
    NOW() + interval '7 days',  -- 1 week trial
    'trial',
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET
    plan_expires_at = CASE
                        WHEN public.profiles.plan_expires_at IS NULL OR public.profiles.plan_expires_at < NOW() 
                        THEN NOW() + interval '7 days'
                        ELSE public.profiles.plan_expires_at
                      END,
    subscription_status = CASE
                            WHEN public.profiles.plan_expires_at IS NULL OR public.profiles.plan_expires_at < NOW() 
                            THEN 'trial'
                            ELSE public.profiles.subscription_status
                          END,
    updated_at = NOW()
  ;
  RETURN NEW;
END;
$function$;

-- =====================================================
-- 2. Fix check_upload_limit function - Add search_path
-- =====================================================

CREATE OR REPLACE FUNCTION public.check_upload_limit(p_user_id UUID)
RETURNS TABLE(
  allowed BOOLEAN,
  remaining INTEGER,
  message TEXT,
  uploads_this_month INTEGER,
  total_uploads INTEGER,
  tier TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_profile RECORD;
  v_reset_date DATE;
  v_should_reset BOOLEAN := false;
  v_upload_limit INTEGER := 100; -- Optimizer tier limit
BEGIN
  -- Get user profile with all relevant fields
  SELECT 
    p.*,
    COALESCE(p.subscription_tier, 'accelerator') as effective_tier
  INTO v_profile 
  FROM profiles p 
  WHERE id = p_user_id;
  
  -- Check if we need to reset based on billing cycle
  -- Use plan_expires_at for paid users, or uploads_reset_date for trials
  IF v_profile.subscription_status IN ('active', 'monthly', 'annual') AND v_profile.plan_expires_at IS NOT NULL THEN
    -- For paid users, check if we've passed the billing date
    IF v_profile.plan_expires_at <= CURRENT_TIMESTAMP THEN
      v_should_reset := true;
      v_reset_date := CURRENT_DATE;
    END IF;
  ELSIF v_profile.uploads_reset_date IS NOT NULL THEN
    -- For trial users or fallback, use monthly reset
    IF v_profile.uploads_reset_date < DATE_TRUNC('month', CURRENT_DATE)::DATE THEN
      v_should_reset := true;
      v_reset_date := DATE_TRUNC('month', CURRENT_DATE)::DATE;
    END IF;
  ELSE
    -- First time setup
    v_should_reset := true;
    v_reset_date := CURRENT_DATE;
  END IF;
  
  -- Reset counter if needed
  IF v_should_reset THEN
    UPDATE profiles 
    SET 
      uploads_this_month = 0,
      uploads_reset_date = v_reset_date
    WHERE id = p_user_id;
    v_profile.uploads_this_month := 0;
  END IF;
  
  -- Return results based on tier
  IF v_profile.effective_tier IN ('accelerator', 'enterprise') THEN
    -- Unlimited uploads for Accelerator and Enterprise
    RETURN QUERY SELECT 
      true, 
      NULL::INTEGER, 
      'Unlimited uploads available'::TEXT,
      COALESCE(v_profile.uploads_this_month, 0),
      COALESCE(v_profile.total_uploads, 0),
      v_profile.effective_tier::TEXT;
  ELSIF v_profile.effective_tier = 'optimizer' THEN
    -- 100 upload limit for Optimizer
    IF COALESCE(v_profile.uploads_this_month, 0) >= v_upload_limit THEN
      RETURN QUERY SELECT 
        false, 
        0, 
        FORMAT('Monthly upload limit reached (%s/%s). Consider upgrading to Enterprise for unlimited uploads.', v_upload_limit, v_upload_limit)::TEXT,
        COALESCE(v_profile.uploads_this_month, 0),
        COALESCE(v_profile.total_uploads, 0),
        v_profile.effective_tier::TEXT;
    ELSE
      RETURN QUERY SELECT 
        true, 
        (v_upload_limit - COALESCE(v_profile.uploads_this_month, 0)), 
        FORMAT('%s uploads remaining this month', (v_upload_limit - COALESCE(v_profile.uploads_this_month, 0)))::TEXT,
        COALESCE(v_profile.uploads_this_month, 0),
        COALESCE(v_profile.total_uploads, 0),
        v_profile.effective_tier::TEXT;
    END IF;
  ELSE
    -- Trial users get Optimizer limits (100/month)
    IF v_profile.subscription_status = 'trial' THEN
      IF COALESCE(v_profile.uploads_this_month, 0) >= v_upload_limit THEN
        RETURN QUERY SELECT 
          false, 
          0, 
          FORMAT('Trial upload limit reached (%s/%s). Subscribe to continue uploading.', v_upload_limit, v_upload_limit)::TEXT,
          COALESCE(v_profile.uploads_this_month, 0),
          COALESCE(v_profile.total_uploads, 0),
          'trial'::TEXT;
      ELSE
        RETURN QUERY SELECT 
          true, 
          (v_upload_limit - COALESCE(v_profile.uploads_this_month, 0)), 
          FORMAT('%s trial uploads remaining', (v_upload_limit - COALESCE(v_profile.uploads_this_month, 0)))::TEXT,
          COALESCE(v_profile.uploads_this_month, 0),
          COALESCE(v_profile.total_uploads, 0),
          'trial'::TEXT;
      END IF;
    ELSE
      -- Fallback for edge cases
      RETURN QUERY SELECT 
        false, 
        0, 
        'Please subscribe to upload files'::TEXT,
        COALESCE(v_profile.uploads_this_month, 0),
        COALESCE(v_profile.total_uploads, 0),
        'none'::TEXT;
    END IF;
  END IF;
END;
$$;

-- =====================================================
-- 3. Fix increment_upload_count function - Add search_path
-- =====================================================

CREATE OR REPLACE FUNCTION public.increment_upload_count(
  p_user_id UUID,
  p_file_count INTEGER DEFAULT 1
)
RETURNS TABLE(
  success BOOLEAN,
  uploads_this_month INTEGER,
  total_uploads INTEGER,
  remaining INTEGER,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_check_result RECORD;
  v_new_monthly INTEGER;
  v_new_total INTEGER;
  v_upload_limit INTEGER := 100; -- Optimizer tier limit
BEGIN
  -- First check if upload is allowed
  SELECT * INTO v_check_result 
  FROM check_upload_limit(p_user_id);
  
  IF NOT v_check_result.allowed THEN
    -- Upload not allowed, return current stats
    RETURN QUERY SELECT 
      false,
      v_check_result.uploads_this_month,
      v_check_result.total_uploads,
      v_check_result.remaining,
      v_check_result.message;
    RETURN;
  END IF;
  
  -- Increment both counters atomically
  UPDATE profiles 
  SET 
    uploads_this_month = COALESCE(uploads_this_month, 0) + p_file_count,
    total_uploads = COALESCE(total_uploads, 0) + p_file_count
  WHERE id = p_user_id
  RETURNING 
    uploads_this_month,
    total_uploads
  INTO v_new_monthly, v_new_total;
  
  -- Calculate remaining uploads
  DECLARE
    v_remaining INTEGER;
    v_tier TEXT;
  BEGIN
    SELECT effective_tier INTO v_tier
    FROM (
      SELECT COALESCE(subscription_tier, 'accelerator') as effective_tier
      FROM profiles 
      WHERE id = p_user_id
    ) t;
    
    IF v_tier IN ('accelerator', 'enterprise') THEN
      v_remaining := NULL; -- Unlimited
    ELSIF v_tier = 'optimizer' THEN
      v_remaining := GREATEST(0, v_upload_limit - v_new_monthly);
    ELSE
      -- Trial gets Optimizer limits
      v_remaining := GREATEST(0, v_upload_limit - v_new_monthly);
    END IF;
    
    RETURN QUERY SELECT 
      true,
      v_new_monthly,
      v_new_total,
      v_remaining,
      CASE 
        WHEN v_tier IN ('accelerator', 'enterprise') THEN 'Upload tracked successfully (unlimited plan)'
        WHEN v_remaining IS NOT NULL AND v_remaining > 0 THEN FORMAT('Upload tracked. %s uploads remaining this month.', v_remaining)
        WHEN v_remaining = 0 THEN 'Upload tracked. Monthly limit reached.'
        ELSE 'Upload tracked successfully.'
      END::TEXT;
  END;
END;
$$;

-- =====================================================
-- 4. Fix get_upload_statistics function - Add search_path
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_upload_statistics(p_user_id UUID)
RETURNS TABLE(
  uploads_this_month INTEGER,
  total_uploads INTEGER,
  upload_limit INTEGER,
  percentage_used NUMERIC,
  tier TEXT,
  reset_date DATE,
  days_until_reset INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_profile RECORD;
  v_limit INTEGER;
  v_percentage NUMERIC;
  v_days_until_reset INTEGER;
  v_upload_limit INTEGER := 100; -- Optimizer tier limit
BEGIN
  -- Get user profile
  SELECT 
    p.*,
    COALESCE(p.subscription_tier, 'accelerator') as effective_tier
  INTO v_profile
  FROM profiles p
  WHERE id = p_user_id;
  
  -- Determine limit based on tier
  IF v_profile.effective_tier IN ('accelerator', 'enterprise') THEN
    v_limit := NULL; -- Unlimited
    v_percentage := 0; -- No percentage for unlimited
  ELSIF v_profile.effective_tier = 'optimizer' THEN
    v_limit := v_upload_limit;
    v_percentage := ROUND((COALESCE(v_profile.uploads_this_month, 0)::NUMERIC / v_limit) * 100, 1);
  ELSE
    -- Trial gets Optimizer limits
    v_limit := v_upload_limit;
    v_percentage := ROUND((COALESCE(v_profile.uploads_this_month, 0)::NUMERIC / v_limit) * 100, 1);
  END IF;
  
  -- Calculate days until reset
  IF v_profile.subscription_status IN ('active', 'monthly', 'annual') AND v_profile.plan_expires_at IS NOT NULL THEN
    v_days_until_reset := EXTRACT(DAY FROM v_profile.plan_expires_at - CURRENT_TIMESTAMP)::INTEGER;
  ELSE
    -- For trials or edge cases, use end of month
    v_days_until_reset := EXTRACT(DAY FROM 
      (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day') - CURRENT_DATE
    )::INTEGER;
  END IF;
  
  RETURN QUERY SELECT
    COALESCE(v_profile.uploads_this_month, 0),
    COALESCE(v_profile.total_uploads, 0),
    v_limit,
    v_percentage,
    v_profile.effective_tier::TEXT,
    COALESCE(v_profile.uploads_reset_date, CURRENT_DATE),
    GREATEST(0, v_days_until_reset);
END;
$$;

-- =====================================================
-- 5. Enable Row Level Security for Auth Password Protection
-- =====================================================

-- Enable RLS on auth.users if not already enabled (Supabase should handle this)
-- Note: Direct modifications to auth schema require super admin access

-- Ensure profiles table has proper RLS policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to recreate them properly
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Service role can manage all profiles" ON public.profiles;

-- Create secure RLS policies for profiles
CREATE POLICY "Users can view own profile" 
  ON public.profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Service role bypass for administrative operations
CREATE POLICY "Service role can manage all profiles" 
  ON public.profiles FOR ALL 
  USING (auth.jwt()->>'role' = 'service_role');

-- =====================================================
-- 6. Add security comments for documentation
-- =====================================================

COMMENT ON FUNCTION public.check_upload_limit IS 'Securely checks if user can upload based on tier limits with proper search_path. Optimizer=100/month, Accelerator/Enterprise=unlimited';
COMMENT ON FUNCTION public.increment_upload_count IS 'Securely increments upload counters with tier-aware limits and proper search_path. Optimizer=100/month, Accelerator/Enterprise=unlimited';
COMMENT ON FUNCTION public.get_upload_statistics IS 'Securely returns upload statistics for dashboard with proper search_path. Optimizer=100/month, Accelerator/Enterprise=unlimited';
COMMENT ON FUNCTION public.handle_new_user_trial IS 'Securely handles new user trial setup with proper search_path';

-- =====================================================
-- 7. Verify all functions have proper security settings
-- =====================================================

-- This query can be run to verify all functions have search_path set
-- SELECT 
--   n.nspname as schema_name,
--   p.proname as function_name,
--   CASE 
--     WHEN pg_get_functiondef(p.oid) LIKE '%SET search_path%' THEN 'SECURE'
--     ELSE 'NEEDS FIX'
--   END as security_status
-- FROM pg_proc p
-- JOIN pg_namespace n ON p.pronamespace = n.oid
-- WHERE n.nspname = 'public'
-- AND p.prokind = 'f'
-- ORDER BY security_status, p.proname;