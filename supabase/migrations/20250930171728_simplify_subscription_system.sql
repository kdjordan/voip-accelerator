-- =====================================================
-- VoIP Accelerator: Subscription System Simplification
-- Date: 2025-09-30
--
-- Purpose: Migrate from 3-tier system (Optimizer/Accelerator/Enterprise)
--          to single Accelerator Plan with monthly/annual billing
--
-- Changes:
--   - Remove subscription_tier, replace with billing_period
--   - Remove upload limit tracking (uploads_this_month, uploads_reset_date)
--   - Add total_uploads counter for admin analytics
--   - Remove organization support (organizations, organization_invitations tables)
--   - Simplify role system (remove super_admin, keep user/admin)
--   - Drop upload tracking tables and functions
-- =====================================================

BEGIN;

-- =====================================================
-- STEP 1: BACKUP CURRENT DATA (for rollback if needed)
-- =====================================================
COMMENT ON TABLE profiles IS 'Migration 20250930171728: Subscription simplification in progress';

-- =====================================================
-- STEP 2: ADD NEW COLUMNS TO PROFILES
-- =====================================================

-- Add billing_period column (monthly | annual | null)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS billing_period TEXT CHECK (billing_period IN ('monthly', 'annual'));

-- Add total_uploads counter for analytics (default 0)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS total_uploads INTEGER DEFAULT 0 NOT NULL;

-- =====================================================
-- STEP 3: MIGRATE EXISTING DATA
-- =====================================================

-- Migrate subscription_tier to billing_period
-- All paid users default to 'monthly', trials remain null
UPDATE profiles
SET billing_period = CASE
  WHEN subscription_tier IN ('optimizer', 'accelerator', 'enterprise')
    AND subscription_status = 'active' THEN 'monthly'
  ELSE NULL
END;

-- Migrate uploads_this_month to total_uploads (preserve existing upload counts)
UPDATE profiles
SET total_uploads = COALESCE(uploads_this_month, 0)
WHERE uploads_this_month IS NOT NULL;

-- Migrate super_admin to admin
UPDATE profiles
SET role = 'admin'
WHERE role = 'super_admin';

-- =====================================================
-- STEP 4: DROP OLD COLUMNS FROM PROFILES
-- =====================================================

-- Drop tier-related columns
ALTER TABLE profiles DROP COLUMN IF EXISTS subscription_tier;
ALTER TABLE profiles DROP COLUMN IF EXISTS selected_tier;
ALTER TABLE profiles DROP COLUMN IF EXISTS trial_tier;

-- Drop monthly upload tracking columns
ALTER TABLE profiles DROP COLUMN IF EXISTS uploads_this_month;
ALTER TABLE profiles DROP COLUMN IF EXISTS uploads_reset_date;

-- Drop organization support
ALTER TABLE profiles DROP COLUMN IF EXISTS organization_id;

-- =====================================================
-- STEP 5: UPDATE ROLE CONSTRAINT
-- =====================================================

-- Drop old role constraint if it exists
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Add new role constraint (user | admin only)
ALTER TABLE profiles
ADD CONSTRAINT profiles_role_check
CHECK (role IN ('user', 'admin'));

-- =====================================================
-- STEP 6: DROP ORGANIZATION RLS POLICIES AND TABLES
-- =====================================================

-- Drop RLS policies that depend on organization_id
DROP POLICY IF EXISTS org_members_can_view ON organizations;
DROP POLICY IF EXISTS org_members_can_update ON organizations;
DROP POLICY IF EXISTS org_members_view_invitations ON organization_invitations;
DROP POLICY IF EXISTS org_admins_create_invitations ON organization_invitations;
DROP POLICY IF EXISTS org_members_manage_invitations ON organization_invitations;
DROP POLICY IF EXISTS org_admin_full_access ON organization_invitations;

-- Now drop the tables
DROP TABLE IF EXISTS organization_invitations CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;

-- =====================================================
-- STEP 7: DROP UPLOAD HISTORY TABLE
-- =====================================================

DROP TABLE IF EXISTS upload_history CASCADE;

-- =====================================================
-- STEP 8: DROP/SIMPLIFY DATABASE FUNCTIONS
-- =====================================================

-- Drop upload limit checking function
DROP FUNCTION IF EXISTS check_upload_limit(UUID) CASCADE;

-- Drop monthly upload statistics function
DROP FUNCTION IF EXISTS get_upload_statistics(UUID) CASCADE;

-- Drop monthly reset function
DROP FUNCTION IF EXISTS reset_monthly_uploads(UUID) CASCADE;

-- Simplify increment_upload_count to just increment total_uploads
CREATE OR REPLACE FUNCTION increment_upload_count(p_user_id UUID, p_file_count INTEGER DEFAULT 1)
RETURNS TABLE (
  success BOOLEAN,
  total_uploads INTEGER,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_total INTEGER;
BEGIN
  -- Simple increment, no limit checking
  UPDATE profiles
  SET total_uploads = total_uploads + p_file_count,
      updated_at = NOW()
  WHERE id = p_user_id
  RETURNING total_uploads INTO v_new_total;

  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 0, 'User not found';
    RETURN;
  END IF;

  RETURN QUERY SELECT
    TRUE,
    v_new_total,
    'Upload count incremented successfully';
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION increment_upload_count(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_upload_count(UUID, INTEGER) TO service_role;

COMMENT ON FUNCTION increment_upload_count IS
'Simplified upload tracking: just increments total_uploads counter (no limits)';

-- =====================================================
-- STEP 9: UPDATE RLS POLICIES (if needed)
-- =====================================================

-- Update any RLS policies that reference subscription_tier or super_admin
-- (These would need to be identified based on your specific policies)

-- Example: Update admin policies to remove super_admin references
DO $$
BEGIN
  -- Add any RLS policy updates here if needed
  -- This is a placeholder for policy-specific migrations
  NULL;
END $$;

-- =====================================================
-- STEP 10: CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Index on billing_period for filtering
CREATE INDEX IF NOT EXISTS idx_profiles_billing_period
ON profiles(billing_period)
WHERE billing_period IS NOT NULL;

-- Index on total_uploads for admin analytics
CREATE INDEX IF NOT EXISTS idx_profiles_total_uploads
ON profiles(total_uploads DESC);

-- Index on role for admin queries
CREATE INDEX IF NOT EXISTS idx_profiles_role
ON profiles(role)
WHERE role = 'admin';

-- =====================================================
-- STEP 11: ADD HELPFUL COMMENTS
-- =====================================================

COMMENT ON COLUMN profiles.billing_period IS
'Billing period for Accelerator Plan: monthly ($99) or annual ($999). NULL for trials.';

COMMENT ON COLUMN profiles.total_uploads IS
'Total upload count for admin analytics (no limit enforcement). Incremented on each upload.';

COMMENT ON COLUMN profiles.role IS
'User role: user (regular customer) or admin (owner with full access). super_admin removed.';

-- =====================================================
-- STEP 12: VERIFICATION QUERIES
-- =====================================================

-- Log migration statistics
DO $$
DECLARE
  v_total_users INTEGER;
  v_paid_users INTEGER;
  v_trial_users INTEGER;
  v_monthly_users INTEGER;
  v_annual_users INTEGER;
  v_admin_users INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_total_users FROM profiles;
  SELECT COUNT(*) INTO v_paid_users FROM profiles WHERE subscription_status = 'active';
  SELECT COUNT(*) INTO v_trial_users FROM profiles WHERE subscription_status = 'trial';
  SELECT COUNT(*) INTO v_monthly_users FROM profiles WHERE billing_period = 'monthly';
  SELECT COUNT(*) INTO v_annual_users FROM profiles WHERE billing_period = 'annual';
  SELECT COUNT(*) INTO v_admin_users FROM profiles WHERE role = 'admin';

  RAISE NOTICE '=== MIGRATION STATISTICS ===';
  RAISE NOTICE 'Total users: %', v_total_users;
  RAISE NOTICE 'Paid users: %', v_paid_users;
  RAISE NOTICE 'Trial users: %', v_trial_users;
  RAISE NOTICE 'Monthly billing: %', v_monthly_users;
  RAISE NOTICE 'Annual billing: %', v_annual_users;
  RAISE NOTICE 'Admin users: %', v_admin_users;
  RAISE NOTICE '===========================';
END $$;

COMMIT;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- Next steps:
-- 1. Update Stripe products (create Monthly/Annual plans)
-- 2. Update edge functions (webhooks, checkout, etc.)
-- 3. Update client code (types, stores, components)
-- 4. Test in staging before deploying to production
-- =====================================================
