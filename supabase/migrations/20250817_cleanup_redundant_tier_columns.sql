-- Migration: Remove redundant tier columns
-- Date: 2025-08-17
-- Description: With the new business model where all trials are Optimizer tier only,
-- the selected_tier and trial_tier columns are redundant. We only need subscription_tier
-- and subscription_status to track user's plan state.

-- Step 1: Migrate any existing data to subscription_tier if needed
UPDATE profiles
SET subscription_tier = COALESCE(subscription_tier, selected_tier, trial_tier)
WHERE subscription_tier IS NULL 
  AND (selected_tier IS NOT NULL OR trial_tier IS NOT NULL);

-- Step 2: Drop the redundant columns
ALTER TABLE profiles 
DROP COLUMN IF EXISTS selected_tier,
DROP COLUMN IF EXISTS trial_tier;

-- Step 3: Add comment to explain the simplified model
COMMENT ON COLUMN profiles.subscription_tier IS 'The user''s current subscription tier (optimizer, accelerator, or enterprise)';
COMMENT ON COLUMN profiles.subscription_status IS 'The user''s subscription status (trial, active, cancelled, etc)';

-- Step 4: Update any existing trial users to have optimizer tier
UPDATE profiles
SET subscription_tier = 'optimizer'
WHERE subscription_status = 'trial' 
  AND subscription_tier IS NULL;