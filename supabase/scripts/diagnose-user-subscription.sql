-- Diagnostic query to check user subscription data
-- Run this in Supabase SQL Editor to see exact values

-- Check auth.users metadata
SELECT 
  id,
  email,
  raw_user_meta_data->>'plan_tier' as meta_plan_tier,
  created_at,
  updated_at
FROM auth.users 
WHERE email = 'k.dean.jordan@gmail.com';

-- Check profiles table data
SELECT 
  id,
  email,
  subscription_status,
  stripe_customer_id,
  subscription_id,
  current_period_start,
  current_period_end,
  plan_expires_at,
  cancel_at,
  canceled_at,
  created_at,
  updated_at,
  -- Calculate days until expiry
  CASE 
    WHEN current_period_end IS NOT NULL THEN 
      EXTRACT(DAY FROM (current_period_end::timestamp - NOW()))::text || ' days'
    WHEN plan_expires_at IS NOT NULL THEN 
      EXTRACT(DAY FROM (plan_expires_at::timestamp - NOW()))::text || ' days'
    ELSE 'No expiry date'
  END as days_until_expiry,
  -- Check if dates are in future
  CASE 
    WHEN current_period_end IS NOT NULL THEN 
      (current_period_end > NOW())::text
    ELSE 'null'
  END as period_end_is_future,
  CASE 
    WHEN plan_expires_at IS NOT NULL THEN 
      (plan_expires_at > NOW())::text
    ELSE 'null'
  END as plan_expires_is_future
FROM profiles 
WHERE email = 'k.dean.jordan@gmail.com';

-- Show timezone info
SHOW timezone;
SELECT NOW() as server_time;