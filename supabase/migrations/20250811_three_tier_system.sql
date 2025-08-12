-- Migration: Three-Tier Subscription System
-- Date: 2025-08-11
-- Description: Add support for Accelerator, Optimizer, and Enterprise tiers with session management

-- =====================================================
-- STEP 1: Create Organizations Table (for Enterprise tier)
-- =====================================================
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  subscription_tier TEXT DEFAULT 'enterprise',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  billing_email TEXT,
  plan_expires_at TIMESTAMP WITH TIME ZONE,
  seat_limit INTEGER DEFAULT 5, -- 5 seats standard for Enterprise
  seats_used INTEGER DEFAULT 0,
  admin_user_id UUID REFERENCES profiles(id),
  CONSTRAINT valid_tier CHECK (subscription_tier IN ('accelerator', 'optimizer', 'enterprise'))
);

-- Add indexes for organizations
CREATE INDEX IF NOT EXISTS idx_organizations_admin ON organizations(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_organizations_stripe_customer ON organizations(stripe_customer_id);

-- =====================================================
-- STEP 2: Update Profiles Table for Tier Support
-- =====================================================

-- Add new columns for tier management (all nullable initially for safe migration)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id),
ADD COLUMN IF NOT EXISTS subscription_tier TEXT,
ADD COLUMN IF NOT EXISTS selected_tier TEXT, -- Tier selected during signup
ADD COLUMN IF NOT EXISTS trial_tier TEXT, -- Which tier they're trialing
ADD COLUMN IF NOT EXISTS uploads_this_month INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS uploads_reset_date DATE DEFAULT CURRENT_DATE;

-- Add constraint for valid tiers
ALTER TABLE profiles 
DROP CONSTRAINT IF EXISTS valid_subscription_tier;

ALTER TABLE profiles 
ADD CONSTRAINT valid_subscription_tier 
CHECK (subscription_tier IS NULL OR subscription_tier IN ('accelerator', 'optimizer', 'enterprise'));

-- =====================================================
-- STEP 3: Create Active Sessions Table (for session management)
-- =====================================================
CREATE TABLE IF NOT EXISTS active_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_heartbeat TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_agent TEXT,
  ip_address INET,
  browser_info JSONB,
  is_active BOOLEAN DEFAULT true,
  device_name TEXT GENERATED ALWAYS AS (
    COALESCE(browser_info->>'browser', 'Unknown') || ' on ' || 
    COALESCE(browser_info->>'os', 'Unknown')
  ) STORED
);

-- Add indexes for session management
CREATE INDEX IF NOT EXISTS idx_active_sessions_user_id ON active_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_active_sessions_heartbeat ON active_sessions(last_heartbeat);
CREATE INDEX IF NOT EXISTS idx_active_sessions_token ON active_sessions(session_token);

-- =====================================================
-- STEP 4: Create Organization Invitations Table
-- =====================================================
CREATE TABLE IF NOT EXISTS organization_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  invited_by UUID REFERENCES profiles(id),
  role TEXT DEFAULT 'member',
  token TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '7 days',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT valid_role CHECK (role IN ('member', 'admin'))
);

-- Add indexes for invitations
CREATE INDEX IF NOT EXISTS idx_invitations_org ON organization_invitations(organization_id);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON organization_invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON organization_invitations(email);

-- =====================================================
-- STEP 5: Create Upload Tracking Table (for audit trail)
-- =====================================================
CREATE TABLE IF NOT EXISTS upload_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_size BIGINT,
  upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  file_type TEXT,
  processing_status TEXT DEFAULT 'pending',
  row_count INTEGER,
  metadata JSONB
);

-- Add indexes for upload tracking
CREATE INDEX IF NOT EXISTS idx_uploads_user ON upload_history(user_id);
CREATE INDEX IF NOT EXISTS idx_uploads_date ON upload_history(upload_date);

-- =====================================================
-- STEP 6: Migrate Existing User Data
-- =====================================================

-- Update existing users to appropriate tiers based on current status
UPDATE profiles 
SET subscription_tier = CASE
  -- Keep existing paid users as Optimizer (grandfathered in)
  WHEN subscription_status IN ('monthly', 'annual', 'active') THEN 'optimizer'
  -- Trial users default to Accelerator
  WHEN subscription_status = 'trial' THEN 'accelerator'
  -- Everyone else starts as Accelerator
  ELSE 'accelerator'
END
WHERE subscription_tier IS NULL;

-- Set trial_tier for existing trial users
UPDATE profiles 
SET trial_tier = 'accelerator'
WHERE subscription_status = 'trial' AND trial_tier IS NULL;

-- =====================================================
-- STEP 7: Create Functions for Upload Management
-- =====================================================

-- Function to check and increment upload count
CREATE OR REPLACE FUNCTION check_upload_limit(p_user_id UUID)
RETURNS TABLE(
  allowed BOOLEAN,
  remaining INTEGER,
  message TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_profile RECORD;
  v_current_month DATE;
BEGIN
  -- Get user profile
  SELECT * INTO v_profile FROM profiles WHERE id = p_user_id;
  
  -- Get current month (first day)
  v_current_month := DATE_TRUNC('month', CURRENT_DATE)::DATE;
  
  -- Reset counter if new month
  IF v_profile.uploads_reset_date < v_current_month THEN
    UPDATE profiles 
    SET uploads_this_month = 0, 
        uploads_reset_date = v_current_month
    WHERE id = p_user_id;
    v_profile.uploads_this_month := 0;
  END IF;
  
  -- Check based on tier
  IF v_profile.subscription_tier IN ('optimizer', 'enterprise') THEN
    -- Unlimited uploads
    RETURN QUERY SELECT true, NULL::INTEGER, 'Unlimited uploads available'::TEXT;
  ELSIF v_profile.subscription_tier = 'accelerator' THEN
    -- 100 upload limit
    IF v_profile.uploads_this_month >= 100 THEN
      RETURN QUERY SELECT false, 0, 'Monthly upload limit reached (100/100). Upgrade to Optimizer for unlimited uploads.'::TEXT;
    ELSE
      RETURN QUERY SELECT true, (100 - v_profile.uploads_this_month), 
        FORMAT('%s uploads remaining this month', (100 - v_profile.uploads_this_month))::TEXT;
    END IF;
  ELSE
    -- Default case (shouldn't happen)
    RETURN QUERY SELECT false, 0, 'Invalid subscription tier'::TEXT;
  END IF;
END;
$$;

-- Function to increment upload count
CREATE OR REPLACE FUNCTION increment_upload_count(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles 
  SET uploads_this_month = uploads_this_month + 1
  WHERE id = p_user_id;
END;
$$;

-- =====================================================
-- STEP 8: Create Session Management Functions
-- =====================================================

-- Function to validate session
CREATE OR REPLACE FUNCTION validate_user_session(
  p_user_id UUID,
  p_session_token TEXT
)
RETURNS TABLE(
  allowed BOOLEAN,
  message TEXT,
  existing_session JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_profile RECORD;
  v_existing_session RECORD;
BEGIN
  -- Get user profile
  SELECT * INTO v_profile FROM profiles WHERE id = p_user_id;
  
  -- Enterprise users can have multiple sessions
  IF v_profile.subscription_tier = 'enterprise' OR v_profile.organization_id IS NOT NULL THEN
    RETURN QUERY SELECT true, 'Multiple sessions allowed for Enterprise users'::TEXT, NULL::JSONB;
    RETURN;
  END IF;
  
  -- Check for existing active sessions for non-Enterprise users
  SELECT * INTO v_existing_session 
  FROM active_sessions 
  WHERE user_id = p_user_id 
    AND is_active = true 
    AND session_token != p_session_token
    AND last_heartbeat > NOW() - INTERVAL '5 minutes'
  LIMIT 1;
  
  IF v_existing_session.id IS NOT NULL THEN
    -- Another session is active
    RETURN QUERY SELECT 
      false, 
      'Another session is active. Please log out from other devices or upgrade to Enterprise for multiple sessions.'::TEXT,
      jsonb_build_object(
        'device', v_existing_session.device_name,
        'ip_address', v_existing_session.ip_address::TEXT,
        'last_active', v_existing_session.last_heartbeat
      );
  ELSE
    -- No conflicts
    RETURN QUERY SELECT true, 'Session allowed'::TEXT, NULL::JSONB;
  END IF;
END;
$$;

-- =====================================================
-- STEP 9: Row Level Security (RLS) Policies
-- =====================================================

-- Enable RLS on new tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE upload_history ENABLE ROW LEVEL SECURITY;

-- Organizations policies
CREATE POLICY "Users can view their organization" ON organizations
  FOR SELECT USING (
    admin_user_id = auth.uid() OR
    id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Admins can update their organization" ON organizations
  FOR UPDATE USING (admin_user_id = auth.uid());

-- Sessions policies
CREATE POLICY "Users can view their own sessions" ON active_sessions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own sessions" ON active_sessions
  FOR ALL USING (user_id = auth.uid());

-- Invitations policies
CREATE POLICY "Organization admins can manage invitations" ON organization_invitations
  FOR ALL USING (
    organization_id IN (
      SELECT id FROM organizations WHERE admin_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view invitations sent to them" ON organization_invitations
  FOR SELECT USING (email = (SELECT email FROM profiles WHERE id = auth.uid()));

-- Upload history policies
CREATE POLICY "Users can view their own uploads" ON upload_history
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own uploads" ON upload_history
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- =====================================================
-- STEP 10: Create Triggers for Auto-Updates
-- =====================================================

-- Trigger to update organization seats_used count
CREATE OR REPLACE FUNCTION update_organization_seats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.organization_id IS NOT NULL THEN
    UPDATE organizations 
    SET seats_used = (
      SELECT COUNT(*) FROM profiles WHERE organization_id = NEW.organization_id
    )
    WHERE id = NEW.organization_id;
  END IF;
  
  IF OLD.organization_id IS NOT NULL AND OLD.organization_id != NEW.organization_id THEN
    UPDATE organizations 
    SET seats_used = (
      SELECT COUNT(*) FROM profiles WHERE organization_id = OLD.organization_id
    )
    WHERE id = OLD.organization_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_org_seats
  AFTER INSERT OR UPDATE OR DELETE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_organization_seats();

-- =====================================================
-- STEP 11: Create Indexes for Performance
-- =====================================================

-- Additional indexes for profiles
CREATE INDEX IF NOT EXISTS idx_profiles_org ON profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_profiles_tier ON profiles(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_profiles_uploads_reset ON profiles(uploads_reset_date);

-- =====================================================
-- STEP 12: Add Comments for Documentation
-- =====================================================

COMMENT ON TABLE organizations IS 'Enterprise tier organizations with multi-seat support';
COMMENT ON TABLE active_sessions IS 'Track active user sessions for single-session enforcement';
COMMENT ON TABLE organization_invitations IS 'Pending invitations to join organizations';
COMMENT ON TABLE upload_history IS 'Track file uploads for limit enforcement and analytics';

COMMENT ON COLUMN profiles.subscription_tier IS 'Current tier: accelerator, optimizer, or enterprise';
COMMENT ON COLUMN profiles.selected_tier IS 'Tier selected during signup (before payment)';
COMMENT ON COLUMN profiles.trial_tier IS 'Which tier the user is trialing';
COMMENT ON COLUMN profiles.uploads_this_month IS 'Upload counter for Accelerator tier limit enforcement';

-- =====================================================
-- FINAL: Migration Complete Message
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE 'Three-tier system migration completed successfully!';
  RAISE NOTICE 'Tables created: organizations, active_sessions, organization_invitations, upload_history';
  RAISE NOTICE 'Profiles table updated with tier support';
  RAISE NOTICE 'Functions created for upload and session management';
  RAISE NOTICE 'RLS policies applied to all new tables';
END $$;