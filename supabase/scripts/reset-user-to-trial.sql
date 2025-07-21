-- Reset user k.dean.jordan@gmail.com to trial plan for testing
-- This script resets all subscription-related fields to trial state

UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{plan_tier}',
  '"trial"'::jsonb
)
WHERE email = 'k.dean.jordan@gmail.com';

UPDATE profiles 
SET 
  -- Reset subscription fields
  subscription_status = 'trial',
  subscription_id = NULL,
  stripe_customer_id = NULL,
  
  -- Reset billing period fields
  current_period_start = NULL,
  current_period_end = NULL,
  
  -- Set trial expiry to 14 days from now
  plan_expires_at = (CURRENT_TIMESTAMP + INTERVAL '14 days')::timestamptz,
  
  -- Clear cancellation fields
  cancel_at = NULL,
  canceled_at = NULL,
  
  -- Update timestamp
  updated_at = CURRENT_TIMESTAMP
WHERE email = 'k.dean.jordan@gmail.com';

-- Verify the update
SELECT 
  email,
  subscription_status,
  plan_expires_at,
  current_period_start,
  current_period_end,
  stripe_customer_id,
  subscription_id
FROM profiles 
WHERE email = 'k.dean.jordan@gmail.com';