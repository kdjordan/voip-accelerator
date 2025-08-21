-- Migration: Fix Remaining Security Issues
-- Date: 2025-08-20
-- Description: Fixes search_path for remaining functions that actually exist
-- Author: VoIP Accelerator Security Fix Part 2

-- =====================================================
-- Check and get existing function definitions first
-- =====================================================

-- Note: We need to preserve the exact function signatures and logic
-- while only adding the SET search_path parameter

-- =====================================================
-- 1. Fix public.update_updated_at_column if it exists
-- =====================================================

DO $$
BEGIN
  -- Check if function exists in public schema
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'update_updated_at_column'
  ) THEN
    -- Recreate with search_path
    CREATE OR REPLACE FUNCTION public.update_updated_at_column()
    RETURNS trigger
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path TO 'public'
    AS $function$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $function$;
  END IF;
END $$;

-- =====================================================
-- 2. Fix public.reset_monthly_uploads functions (there are 2)
-- =====================================================

-- First, let's handle the function that takes parameters
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'reset_monthly_uploads'
    AND p.pronargs > 0
  ) THEN
    CREATE OR REPLACE FUNCTION public.reset_monthly_uploads(p_user_id UUID)
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path TO 'public'
    AS $function$
    BEGIN
      UPDATE profiles 
      SET 
        uploads_this_month = 0,
        uploads_reset_date = CURRENT_DATE
      WHERE id = p_user_id;
    END;
    $function$;
  END IF;
END $$;

-- Handle the function without parameters if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'reset_monthly_uploads'
    AND p.pronargs = 0
  ) THEN
    CREATE OR REPLACE FUNCTION public.reset_monthly_uploads()
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path TO 'public'
    AS $function$
    BEGIN
      -- Reset all users' monthly uploads at the start of a new month
      UPDATE profiles 
      SET 
        uploads_this_month = 0,
        uploads_reset_date = CURRENT_DATE
      WHERE uploads_reset_date < DATE_TRUNC('month', CURRENT_DATE);
    END;
    $function$;
  END IF;
END $$;

-- =====================================================
-- 3. Fix public.cleanup_stale_sessions
-- =====================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'cleanup_stale_sessions'
  ) THEN
    CREATE OR REPLACE FUNCTION public.cleanup_stale_sessions()
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path TO 'public'
    AS $function$
    BEGIN
      -- Delete sessions older than 30 days
      DELETE FROM active_sessions 
      WHERE last_activity < NOW() - INTERVAL '30 days';
    END;
    $function$;
  END IF;
END $$;

-- =====================================================
-- 4. Fix public.get_npa_info
-- =====================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'get_npa_info'
  ) THEN
    CREATE OR REPLACE FUNCTION public.get_npa_info(p_npa TEXT)
    RETURNS TABLE(
      npa TEXT,
      state TEXT,
      country TEXT
    )
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path TO 'public'
    AS $function$
    BEGIN
      RETURN QUERY
      SELECT l.npa, l.state, l.country
      FROM lerg_codes l
      WHERE l.npa = p_npa;
    END;
    $function$;
  END IF;
END $$;

-- =====================================================
-- 5. Fix public.sync_email_to_profiles
-- =====================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'sync_email_to_profiles'
  ) THEN
    CREATE OR REPLACE FUNCTION public.sync_email_to_profiles()
    RETURNS trigger
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path TO 'public'
    AS $function$
    BEGIN
      UPDATE profiles 
      SET email = NEW.email
      WHERE id = NEW.id;
      RETURN NEW;
    END;
    $function$;
  END IF;
END $$;

-- =====================================================
-- 6. Fix public.handle_new_user (already has search_path in previous migration)
-- But let's ensure it's set correctly
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, role, plan_expires_at, user_agent, signup_method, subscription_status)
  VALUES (
    new.id,
    'user', -- Default role
    '2025-05-23 23:59:59 UTC', -- Fixed plan expiration date for new users
    new.raw_user_meta_data ->> 'user_agent', -- Extract user_agent
    COALESCE(new.raw_app_meta_data ->> 'provider', 'email'), -- Extract provider or default to 'email'
    'trial' -- Set subscription_status to 'trial' for new users
  );
  RETURN new;
END;
$function$;

-- =====================================================
-- 7. Fix stripe.get_user_tier
-- =====================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'stripe' AND p.proname = 'get_user_tier'
  ) THEN
    CREATE OR REPLACE FUNCTION stripe.get_user_tier(p_user_id UUID)
    RETURNS TEXT
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path TO 'public', 'stripe'
    AS $function$
    DECLARE
      v_tier TEXT;
    BEGIN
      SELECT subscription_tier INTO v_tier
      FROM public.profiles
      WHERE id = p_user_id;
      
      RETURN COALESCE(v_tier, 'optimizer');
    END;
    $function$;
  END IF;
END $$;

-- =====================================================
-- 8. Fix stripe.is_subscription_active
-- =====================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'stripe' AND p.proname = 'is_subscription_active'
  ) THEN
    CREATE OR REPLACE FUNCTION stripe.is_subscription_active(p_user_id UUID)
    RETURNS BOOLEAN
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path TO 'public', 'stripe'
    AS $function$
    DECLARE
      v_status TEXT;
      v_expires_at TIMESTAMPTZ;
    BEGIN
      SELECT subscription_status, plan_expires_at 
      INTO v_status, v_expires_at
      FROM public.profiles
      WHERE id = p_user_id;
      
      -- Check if subscription is active
      IF v_status IN ('active', 'trialing', 'trial') THEN
        -- Check if not expired
        IF v_expires_at IS NULL OR v_expires_at > NOW() THEN
          RETURN true;
        END IF;
      END IF;
      
      RETURN false;
    END;
    $function$;
  END IF;
END $$;

-- =====================================================
-- 9. Comments for documentation
-- =====================================================

COMMENT ON FUNCTION public.update_updated_at_column IS 'Automatically updates the updated_at column on row modification with proper search_path';
COMMENT ON FUNCTION public.reset_monthly_uploads IS 'Resets monthly upload counters with proper search_path';
COMMENT ON FUNCTION public.cleanup_stale_sessions IS 'Cleans up old session records with proper search_path';
COMMENT ON FUNCTION public.get_npa_info IS 'Retrieves NPA/area code information with proper search_path';
COMMENT ON FUNCTION public.sync_email_to_profiles IS 'Syncs email changes to profiles table with proper search_path';
COMMENT ON FUNCTION stripe.get_user_tier IS 'Gets user subscription tier with proper search_path';
COMMENT ON FUNCTION stripe.is_subscription_active IS 'Checks if user subscription is active with proper search_path';