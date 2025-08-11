-- Session Management & Organization Multi-Seat Implementation
-- Phase 1: Database Schema Changes
-- Created: 2025-08-11

-- 1. Create Organizations Table
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  subscription_status TEXT DEFAULT 'enterprise',
  stripe_customer_id TEXT,
  subscription_id TEXT,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  billing_email TEXT,
  plan_expires_at TIMESTAMP WITH TIME ZONE,
  seat_limit INTEGER DEFAULT 10, -- Up to 10 seats, custom pricing beyond
  admin_user_id UUID REFERENCES profiles(id) -- Organization admin
);

-- Create index for organization lookups
CREATE INDEX IF NOT EXISTS idx_organizations_admin_user_id ON organizations(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_organizations_stripe_customer_id ON organizations(stripe_customer_id);

-- 2. Update Profiles Table
-- Add new columns for subscription tiers, organizations, and upload tracking
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id),
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'starter', 
ADD COLUMN IF NOT EXISTS uploads_this_month INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS uploads_reset_date DATE DEFAULT CURRENT_DATE;

-- Update existing role column to new 3-tier system (preserve existing admins)
-- Only update users who aren't already admin or super_admin
UPDATE profiles 
SET role = 'user' 
WHERE role IS NULL OR role NOT IN ('admin', 'super_admin');

-- Add constraints for subscription tiers
ALTER TABLE profiles
ADD CONSTRAINT check_subscription_tier 
CHECK (subscription_tier IN ('starter', 'professional', 'enterprise'));

-- Create indexes for profiles
CREATE INDEX IF NOT EXISTS idx_profiles_organization_id ON profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_tier ON profiles(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_profiles_uploads_reset_date ON profiles(uploads_reset_date);

-- 3. Create Active Sessions Table
CREATE TABLE IF NOT EXISTS active_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_heartbeat TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_agent TEXT,
  ip_address TEXT,
  browser_info JSONB
);

-- Create indexes for session management
CREATE INDEX IF NOT EXISTS idx_active_sessions_user_id ON active_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_active_sessions_last_heartbeat ON active_sessions(last_heartbeat);
CREATE INDEX IF NOT EXISTS idx_active_sessions_session_id ON active_sessions(session_id);

-- 4. Create Organization Invitations Table
CREATE TABLE IF NOT EXISTS organization_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  invited_by UUID REFERENCES profiles(id),
  role TEXT DEFAULT 'member',
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '7 days',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  used_at TIMESTAMP WITH TIME ZONE NULL
);

-- Create indexes for invitations
CREATE INDEX IF NOT EXISTS idx_organization_invitations_organization_id ON organization_invitations(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_invitations_email ON organization_invitations(email);
CREATE INDEX IF NOT EXISTS idx_organization_invitations_token ON organization_invitations(token);
CREATE INDEX IF NOT EXISTS idx_organization_invitations_expires_at ON organization_invitations(expires_at);

-- 5. Enable Row Level Security
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_invitations ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS Policies

-- Organizations: Members can view their organization
CREATE POLICY "org_members_can_view" ON organizations
  FOR SELECT USING (
    id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

-- Organizations: Admins can update their organization
CREATE POLICY "org_admins_can_update" ON organizations
  FOR UPDATE USING (
    admin_user_id = auth.uid()
  );

-- Active Sessions: Users can manage their own sessions
CREATE POLICY "users_manage_own_sessions" ON active_sessions
  FOR ALL USING (user_id = auth.uid());

-- Organization Invitations: Organization members can view invitations
CREATE POLICY "org_members_view_invitations" ON organization_invitations
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

-- Organization Invitations: Organization admins can insert invitations
CREATE POLICY "org_admins_create_invitations" ON organization_invitations
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT id FROM organizations WHERE admin_user_id = auth.uid()
    )
  );

-- 7. Update existing Profiles RLS policy to include organization members
DROP POLICY IF EXISTS profiles_select_policy ON profiles;
CREATE POLICY "profiles_select_policy" ON profiles
  FOR SELECT USING (
    id = auth.uid() OR 
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- 8. Create helper functions

-- Function to reset monthly uploads (UTC-based)
CREATE OR REPLACE FUNCTION reset_monthly_uploads()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Reset based on UTC midnight on the first of each month
  -- This ensures consistent behavior across all time zones
  UPDATE profiles 
  SET uploads_this_month = 0,
      uploads_reset_date = DATE_TRUNC('month', CURRENT_DATE AT TIME ZONE 'UTC')::DATE
  WHERE uploads_reset_date < DATE_TRUNC('month', CURRENT_DATE AT TIME ZONE 'UTC')::DATE;
END;
$$;

-- Function to clean up stale sessions (no heartbeat for 5+ minutes)
CREATE OR REPLACE FUNCTION cleanup_stale_sessions()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM active_sessions 
  WHERE last_heartbeat < NOW() - INTERVAL '5 minutes';
END;
$$;

-- 9. Schedule cron jobs (if pg_cron extension is available)
-- Note: These will only work if pg_cron extension is enabled
DO $$
BEGIN
  -- Try to schedule the jobs, ignore if pg_cron is not available
  BEGIN
    -- Reset uploads daily at UTC midnight (only actually resets on first of month)
    PERFORM cron.schedule('reset-uploads', '0 0 * * *', 'SELECT reset_monthly_uploads();', 'UTC');
    
    -- Clean up stale sessions every 5 minutes
    PERFORM cron.schedule('cleanup-sessions', '*/5 * * * *', 'SELECT cleanup_stale_sessions();');
  EXCEPTION
    WHEN undefined_table THEN
      RAISE NOTICE 'pg_cron extension not available. Cron jobs not scheduled.';
  END;
END;
$$;

-- 10. Create updated trigger for new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user_trial()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.profiles (
    id, 
    plan_expires_at, 
    subscription_status, 
    current_period_start,
    current_period_end,
    subscription_tier,
    uploads_this_month,
    uploads_reset_date,
    updated_at
  )
  VALUES (
    NEW.id,
    NOW() + interval '7 days',
    'trial',
    NOW(),  -- Trial starts now
    NOW() + interval '7 days',  -- Trial ends in 7 days
    'starter',  -- Default to starter tier
    0,  -- Start with 0 uploads
    CURRENT_DATE,  -- Reset date is today
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    plan_expires_at = EXCLUDED.plan_expires_at,
    subscription_status = EXCLUDED.subscription_status,
    current_period_start = EXCLUDED.current_period_start,
    current_period_end = EXCLUDED.current_period_end,
    subscription_tier = EXCLUDED.subscription_tier,
    uploads_this_month = EXCLUDED.uploads_this_month,
    uploads_reset_date = EXCLUDED.uploads_reset_date,
    updated_at = NOW();
  RETURN NEW;
END;
$function$;

-- 11. Add helpful comments
COMMENT ON TABLE organizations IS 'Enterprise organizations with multi-seat billing';
COMMENT ON TABLE active_sessions IS 'Track active user sessions for session management';
COMMENT ON TABLE organization_invitations IS 'Organization member invitations with expiry';
COMMENT ON COLUMN profiles.subscription_tier IS 'User subscription tier: starter, professional, enterprise';
COMMENT ON COLUMN profiles.uploads_this_month IS 'Number of uploads used this month';
COMMENT ON COLUMN profiles.uploads_reset_date IS 'Date when uploads counter was last reset (UTC)';