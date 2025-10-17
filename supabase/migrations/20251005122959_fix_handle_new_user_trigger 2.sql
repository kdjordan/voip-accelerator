-- =====================================================
-- Fix handle_new_user trigger for simplified subscription system
-- Date: 2025-10-05
--
-- Purpose: Update handle_new_user() trigger function to work with
--          the simplified subscription system (billing_period instead of subscription_tier)
--
-- Changes:
--   - Remove subscription_tier references
--   - Add billing_period handling
--   - Simplify logic: all signups start as trial
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Simplified system: all signups start as trial
  -- billing_period is null for trials, set to 'monthly' or 'annual' when user subscribes via Stripe
  INSERT INTO public.profiles (
    id,
    role,
    plan_expires_at,
    billing_period,
    subscription_status
  )
  VALUES (
    new.id,
    'user', -- Default role
    NOW() + INTERVAL '7 days', -- 7-day trial period
    NULL, -- Trial users have no billing period yet
    'trial' -- All new signups start as trial
  );

  RETURN new;
END;
$$;

-- Add comment for documentation
COMMENT ON FUNCTION public.handle_new_user() IS
'Creates user profile on signup. All users start with 7-day trial (billing_period = null, subscription_status = trial). Stripe webhook updates billing_period and subscription_status after payment.';
