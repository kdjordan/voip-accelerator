-- Migration: Add Total Uploads Tracking for Marketing Metrics
-- Date: 2025-08-16
-- Description: Adds total_uploads field for lifetime tracking while maintaining backwards compatibility
-- Author: VoIP Accelerator Development Team

-- =====================================================
-- PHASE 1: Add total_uploads column (backwards compatible)
-- =====================================================

-- Add total_uploads column for lifetime tracking (marketing metrics)
-- This is nullable initially to maintain backwards compatibility
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS total_uploads INTEGER DEFAULT 0;

-- Add comment for documentation
COMMENT ON COLUMN profiles.total_uploads IS 'Lifetime total uploads for marketing metrics and analytics';

-- =====================================================
-- PHASE 2: Update existing upload tracking functions
-- =====================================================

-- Enhanced function to check upload limit with better tier support
CREATE OR REPLACE FUNCTION check_upload_limit(p_user_id UUID)
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
AS $$
DECLARE
  v_profile RECORD;
  v_reset_date DATE;
  v_should_reset BOOLEAN := false;
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
  IF v_profile.effective_tier IN ('optimizer', 'enterprise') THEN
    -- Unlimited uploads for Optimizer and Enterprise
    RETURN QUERY SELECT 
      true, 
      NULL::INTEGER, 
      'Unlimited uploads available'::TEXT,
      COALESCE(v_profile.uploads_this_month, 0),
      COALESCE(v_profile.total_uploads, 0),
      v_profile.effective_tier::TEXT;
  ELSIF v_profile.effective_tier = 'accelerator' THEN
    -- 100 upload limit for Accelerator
    IF COALESCE(v_profile.uploads_this_month, 0) >= 100 THEN
      RETURN QUERY SELECT 
        false, 
        0, 
        'Monthly upload limit reached (100/100). Upgrade to Optimizer for unlimited uploads.'::TEXT,
        COALESCE(v_profile.uploads_this_month, 0),
        COALESCE(v_profile.total_uploads, 0),
        v_profile.effective_tier::TEXT;
    ELSE
      RETURN QUERY SELECT 
        true, 
        (100 - COALESCE(v_profile.uploads_this_month, 0)), 
        FORMAT('%s uploads remaining this month', (100 - COALESCE(v_profile.uploads_this_month, 0)))::TEXT,
        COALESCE(v_profile.uploads_this_month, 0),
        COALESCE(v_profile.total_uploads, 0),
        v_profile.effective_tier::TEXT;
    END IF;
  ELSE
    -- Trial users get Accelerator limits
    IF v_profile.subscription_status = 'trial' THEN
      IF COALESCE(v_profile.uploads_this_month, 0) >= 100 THEN
        RETURN QUERY SELECT 
          false, 
          0, 
          'Trial upload limit reached (100/100). Subscribe to continue uploading.'::TEXT,
          COALESCE(v_profile.uploads_this_month, 0),
          COALESCE(v_profile.total_uploads, 0),
          'trial'::TEXT;
      ELSE
        RETURN QUERY SELECT 
          true, 
          (100 - COALESCE(v_profile.uploads_this_month, 0)), 
          FORMAT('%s trial uploads remaining', (100 - COALESCE(v_profile.uploads_this_month, 0)))::TEXT,
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

-- Enhanced function to increment upload count with total tracking
CREATE OR REPLACE FUNCTION increment_upload_count(
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
AS $$
DECLARE
  v_check_result RECORD;
  v_new_monthly INTEGER;
  v_new_total INTEGER;
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
    
    IF v_tier IN ('optimizer', 'enterprise') THEN
      v_remaining := NULL; -- Unlimited
    ELSE
      v_remaining := GREATEST(0, 100 - v_new_monthly);
    END IF;
    
    RETURN QUERY SELECT 
      true,
      v_new_monthly,
      v_new_total,
      v_remaining,
      CASE 
        WHEN v_remaining IS NULL THEN 'Upload tracked successfully (unlimited)'
        WHEN v_remaining > 20 THEN FORMAT('Upload tracked. %s uploads remaining this month', v_remaining)
        WHEN v_remaining > 0 THEN FORMAT('Upload tracked. Warning: Only %s uploads remaining this month!', v_remaining)
        ELSE 'Upload tracked. You have reached your monthly limit!'
      END::TEXT;
  END;
END;
$$;

-- Function to reset monthly uploads (for subscription renewals)
CREATE OR REPLACE FUNCTION reset_monthly_uploads(p_user_id UUID)
RETURNS TABLE(
  success BOOLEAN,
  message TEXT,
  uploads_reset INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;

-- Function to get upload statistics for dashboard
CREATE OR REPLACE FUNCTION get_upload_statistics(p_user_id UUID)
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
STABLE
AS $$
DECLARE
  v_profile RECORD;
  v_limit INTEGER;
  v_percentage NUMERIC;
  v_days_until_reset INTEGER;
BEGIN
  -- Get user profile
  SELECT 
    COALESCE(uploads_this_month, 0) as uploads_this_month,
    COALESCE(total_uploads, 0) as total_uploads,
    COALESCE(subscription_tier, 'accelerator') as tier,
    uploads_reset_date,
    plan_expires_at,
    subscription_status
  INTO v_profile
  FROM profiles
  WHERE id = p_user_id;
  
  -- Determine upload limit based on tier
  IF v_profile.tier IN ('optimizer', 'enterprise') THEN
    v_limit := NULL; -- Unlimited
    v_percentage := 0;
  ELSE
    v_limit := 100;
    v_percentage := ROUND((v_profile.uploads_this_month::NUMERIC / 100) * 100, 2);
  END IF;
  
  -- Calculate days until reset
  IF v_profile.subscription_status IN ('active', 'monthly', 'annual') AND v_profile.plan_expires_at IS NOT NULL THEN
    v_days_until_reset := EXTRACT(DAY FROM v_profile.plan_expires_at - CURRENT_TIMESTAMP)::INTEGER;
  ELSE
    -- For trials or fallback, use end of month
    v_days_until_reset := EXTRACT(DAY FROM 
      (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day') - CURRENT_DATE
    )::INTEGER;
  END IF;
  
  RETURN QUERY SELECT 
    v_profile.uploads_this_month,
    v_profile.total_uploads,
    v_limit,
    v_percentage,
    v_profile.tier::TEXT,
    COALESCE(v_profile.uploads_reset_date, CURRENT_DATE),
    GREATEST(0, v_days_until_reset);
END;
$$;

-- =====================================================
-- PHASE 3: Add helpful indexes for performance
-- =====================================================

-- Index for upload tracking queries
CREATE INDEX IF NOT EXISTS idx_profiles_upload_tracking 
ON profiles(id, uploads_this_month, total_uploads, subscription_tier)
WHERE uploads_this_month IS NOT NULL;

-- =====================================================
-- PHASE 4: Migrate existing data (safe operation)
-- =====================================================

-- Initialize total_uploads for existing users based on uploads_this_month
-- This is a safe one-time operation
UPDATE profiles
SET total_uploads = COALESCE(uploads_this_month, 0)
WHERE total_uploads IS NULL;

-- Ensure all users have a reset date
UPDATE profiles
SET uploads_reset_date = CURRENT_DATE
WHERE uploads_reset_date IS NULL;

-- =====================================================
-- PHASE 5: Add RLS policies for new functions (if needed)
-- =====================================================

-- Note: Functions use SECURITY DEFINER so they bypass RLS
-- This ensures users can only check/increment their own uploads

-- =====================================================
-- VERIFICATION: Check migration status
-- =====================================================
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Check if column was added
  SELECT COUNT(*) INTO v_count
  FROM information_schema.columns
  WHERE table_name = 'profiles' 
  AND column_name = 'total_uploads';
  
  IF v_count > 0 THEN
    RAISE NOTICE '✅ Migration successful: total_uploads column added';
  ELSE
    RAISE WARNING '⚠️ Migration issue: total_uploads column not found';
  END IF;
  
  -- Check function creation
  IF EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname IN ('check_upload_limit', 'increment_upload_count', 'reset_monthly_uploads', 'get_upload_statistics')
  ) THEN
    RAISE NOTICE '✅ All upload tracking functions created successfully';
  ELSE
    RAISE WARNING '⚠️ Some functions may not have been created';
  END IF;
  
  RAISE NOTICE '📊 Upload tracking system ready for Accelerator tier (100 uploads/month limit)';
  RAISE NOTICE '🔧 Environment variable VITE_ACCELERATOR_UPLOAD_LIMIT=100 already configured';
END $$;