-- Migration: Fix Remaining Security Issues (Corrected)
-- Date: 2025-08-20
-- Description: Fixes search_path for remaining functions preserving exact signatures
-- Author: VoIP Accelerator Security Fix Part 2 - Corrected

-- =====================================================
-- 1. Fix public.update_updated_at_column
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$function$;

-- =====================================================
-- 2. Fix storage.update_updated_at_column
-- =====================================================

CREATE OR REPLACE FUNCTION storage.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'storage'
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW; 
END;
$function$;

-- =====================================================
-- 3. Fix public.reset_monthly_uploads() - no parameters
-- =====================================================

CREATE OR REPLACE FUNCTION public.reset_monthly_uploads()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Reset based on UTC midnight on the first of each month
  -- This ensures consistent behavior across all time zones
  UPDATE profiles 
  SET uploads_this_month = 0,
      uploads_reset_date = DATE_TRUNC('month', CURRENT_DATE AT TIME ZONE 'UTC')::DATE
  WHERE uploads_reset_date < DATE_TRUNC('month', CURRENT_DATE AT TIME ZONE 'UTC')::DATE;
END;
$function$;

-- =====================================================
-- 4. Fix public.reset_monthly_uploads(p_user_id uuid) - with parameters
-- =====================================================

CREATE OR REPLACE FUNCTION public.reset_monthly_uploads(p_user_id uuid)
RETURNS TABLE(success boolean, message text, uploads_reset integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_uploads_count INTEGER;
BEGIN
  -- Get current monthly uploads before reset
  SELECT uploads_this_month INTO v_uploads_count
  FROM profiles
  WHERE id = p_user_id;
  
  -- Reset monthly counter and update reset date
  UPDATE profiles
  SET 
    uploads_this_month = 0,
    uploads_reset_date = CURRENT_DATE
  WHERE id = p_user_id;
  
  RETURN QUERY SELECT 
    true,
    FORMAT('Monthly uploads reset. Previous month: %s uploads', COALESCE(v_uploads_count, 0))::TEXT,
    COALESCE(v_uploads_count, 0);
END;
$function$;

-- =====================================================
-- 5. Fix public.cleanup_stale_sessions
-- =====================================================

CREATE OR REPLACE FUNCTION public.cleanup_stale_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  DELETE FROM active_sessions 
  WHERE last_heartbeat < NOW() - INTERVAL '5 minutes';
END;
$function$;

-- =====================================================
-- 6. Fix public.get_npa_info - preserve exact signature
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_npa_info(p_npa character varying)
RETURNS TABLE(npa character varying, display_location text, full_location text, category character varying, confidence_score numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        el.npa,
        el.state_province_name || ', ' || el.country_name AS display_location,
        el.state_province_name || ', ' || el.country_name || 
            ' (' || el.state_province_code || ', ' || el.country_code || ')' AS full_location,
        el.category,
        el.confidence_score
    FROM public.enhanced_lerg el
    WHERE el.npa = p_npa AND el.is_active = true;
END;
$function$;

-- =====================================================
-- 7. Fix public.sync_email_to_profiles
-- =====================================================

CREATE OR REPLACE FUNCTION public.sync_email_to_profiles()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.profiles
  SET email = NEW.email
  WHERE id = NEW.id;
  RETURN NEW;
END;
$function$;

-- =====================================================
-- 8. Fix public.handle_new_user - preserve exact logic
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, created_at, updated_at)
  VALUES (NEW.id, NEW.email, NOW(), NOW());
  RETURN NEW;
END;
$function$;

-- =====================================================
-- 9. Fix stripe.get_user_tier - preserve exact signature
-- =====================================================

CREATE OR REPLACE FUNCTION stripe.get_user_tier(user_email text)
RETURNS text
LANGUAGE sql
STABLE
SET search_path TO 'stripe'
AS $function$
  SELECT tier FROM stripe.user_subscriptions WHERE email = user_email LIMIT 1;
$function$;

-- =====================================================
-- 10. Fix stripe.is_subscription_active - preserve exact signature
-- =====================================================

CREATE OR REPLACE FUNCTION stripe.is_subscription_active(user_email text)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path TO 'stripe'
AS $function$
  SELECT 
    CASE 
      WHEN subscription_status IN ('active', 'trialing') THEN true
      ELSE false
    END
  FROM stripe.user_subscriptions 
  WHERE email = user_email 
  LIMIT 1;
$function$;

-- =====================================================
-- 11. Comments for documentation
-- =====================================================

COMMENT ON FUNCTION public.update_updated_at_column IS 'Automatically updates the updated_at column on row modification with proper search_path';
COMMENT ON FUNCTION storage.update_updated_at_column IS 'Automatically updates the updated_at column on row modification with proper search_path';
COMMENT ON FUNCTION public.reset_monthly_uploads IS 'Resets monthly upload counters with proper search_path';
COMMENT ON FUNCTION public.cleanup_stale_sessions IS 'Cleans up old session records with proper search_path';
COMMENT ON FUNCTION public.get_npa_info IS 'Retrieves NPA/area code information with proper search_path';
COMMENT ON FUNCTION public.sync_email_to_profiles IS 'Syncs email changes to profiles table with proper search_path';
COMMENT ON FUNCTION stripe.get_user_tier IS 'Gets user subscription tier with proper search_path';
COMMENT ON FUNCTION stripe.is_subscription_active IS 'Checks if user subscription is active with proper search_path';