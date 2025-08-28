-- Admin Role Setup Script
-- This script sets up the distinction between super_admin and admin (enterprise) roles

-- 1. First, ensure the role column exists and has proper constraints
-- (This should already exist based on our analysis)
ALTER TABLE profiles 
ALTER COLUMN role TYPE text;

-- 2. Add a CHECK constraint to ensure only valid roles are used
ALTER TABLE profiles
DROP CONSTRAINT IF EXISTS valid_user_role;

ALTER TABLE profiles
ADD CONSTRAINT valid_user_role 
CHECK (role IN ('user', 'admin', 'super_admin'));

-- 3. Example: Grant super_admin role to specific user (replace with actual user ID)
-- UPDATE profiles 
-- SET role = 'super_admin' 
-- WHERE email = 'your-super-admin@example.com';

-- 4. Example: Grant enterprise admin role to users with Enterprise subscription
-- This would typically be done automatically when a user upgrades to Enterprise plan
-- UPDATE profiles 
-- SET role = 'admin' 
-- WHERE id = 'user-id-here' 
-- AND subscription_tier = 'enterprise';

-- 5. Create a function to automatically set admin role for enterprise subscribers
CREATE OR REPLACE FUNCTION update_enterprise_admin_role()
RETURNS TRIGGER AS $$
BEGIN
  -- When subscription_tier is set to 'enterprise', update role to 'admin'
  IF NEW.subscription_tier = 'enterprise' AND (OLD.subscription_tier IS NULL OR OLD.subscription_tier != 'enterprise') THEN
    NEW.role = 'admin';
  -- When subscription_tier is changed from 'enterprise' to something else, revert to 'user'
  ELSIF OLD.subscription_tier = 'enterprise' AND NEW.subscription_tier != 'enterprise' AND NEW.role = 'admin' THEN
    NEW.role = 'user';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Create trigger to automatically update role based on subscription tier
DROP TRIGGER IF EXISTS trigger_update_enterprise_admin ON profiles;

CREATE TRIGGER trigger_update_enterprise_admin
BEFORE UPDATE OF subscription_tier ON profiles
FOR EACH ROW
EXECUTE FUNCTION update_enterprise_admin_role();

-- 7. Add RLS policies for admin access (optional, if using Row Level Security)
-- Example policy for super_admin access to all data
-- CREATE POLICY "Super admins can view all data" ON profiles
-- FOR ALL 
-- USING (auth.uid() IN (
--   SELECT id FROM profiles WHERE role = 'super_admin'
-- ));

-- Note: To set up your first super_admin, run:
-- UPDATE profiles SET role = 'super_admin' WHERE email = 'your-email@example.com';