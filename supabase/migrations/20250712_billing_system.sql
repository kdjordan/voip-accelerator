-- Add billing fields to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS stripe_customer_id text UNIQUE,
ADD COLUMN IF NOT EXISTS stripe_subscription_id text,
ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'trial',
ADD COLUMN IF NOT EXISTS plan_expires_at timestamptz,
ADD COLUMN IF NOT EXISTS trial_started_at timestamptz DEFAULT now();

-- Create usage_metrics table for tracking comparisons and adjustments
CREATE TABLE IF NOT EXISTS usage_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  metric_type text NOT NULL CHECK (metric_type IN ('comparison', 'adjustment')),
  source text NOT NULL CHECK (source IN ('us', 'az')),
  created_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}',
  CONSTRAINT usage_metrics_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create index for fast queries
CREATE INDEX idx_usage_metrics_user_created ON usage_metrics(user_id, created_at DESC);
CREATE INDEX idx_usage_metrics_type_source ON usage_metrics(metric_type, source);

-- Create a view for aggregated usage statistics
CREATE OR REPLACE VIEW user_usage_stats AS
SELECT 
  user_id,
  COUNT(*) FILTER (WHERE metric_type = 'comparison') as total_comparisons,
  COUNT(*) FILTER (WHERE metric_type = 'adjustment') as total_adjustments,
  COUNT(*) FILTER (WHERE metric_type = 'comparison' AND source = 'us') as us_comparisons,
  COUNT(*) FILTER (WHERE metric_type = 'comparison' AND source = 'az') as az_comparisons,
  COUNT(*) FILTER (WHERE metric_type = 'adjustment' AND source = 'us') as us_adjustments,
  COUNT(*) FILTER (WHERE metric_type = 'adjustment' AND source = 'az') as az_adjustments,
  COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) as actions_today,
  COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as actions_this_week,
  COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as actions_this_month
FROM usage_metrics
GROUP BY user_id;

-- Enable RLS on usage_metrics
ALTER TABLE usage_metrics ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own metrics
CREATE POLICY "Users can view own metrics" ON usage_metrics
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own metrics
CREATE POLICY "Users can insert own metrics" ON usage_metrics
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Service role can manage all metrics
CREATE POLICY "Service role full access" ON usage_metrics
  FOR ALL USING (auth.role() = 'service_role');

-- Grant access to authenticated users
GRANT SELECT ON user_usage_stats TO authenticated;
GRANT INSERT ON usage_metrics TO authenticated;

-- Create function to check subscription status
CREATE OR REPLACE FUNCTION check_subscription_active(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  profile RECORD;
BEGIN
  SELECT subscription_status, plan_expires_at, trial_started_at
  INTO profile
  FROM profiles
  WHERE id = user_id;
  
  -- Check if user has active subscription
  IF profile.subscription_status IN ('monthly', 'annual') THEN
    RETURN true;
  END IF;
  
  -- Check if user is in trial period (7 days)
  IF profile.subscription_status = 'trial' AND 
     profile.trial_started_at IS NOT NULL AND
     profile.trial_started_at + INTERVAL '7 days' > now() THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to track usage metrics
CREATE OR REPLACE FUNCTION track_usage_metric(
  p_user_id UUID,
  p_metric_type text,
  p_source text,
  p_metadata jsonb DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  metric_id UUID;
BEGIN
  INSERT INTO usage_metrics (user_id, metric_type, source, metadata)
  VALUES (p_user_id, p_metric_type, p_source, p_metadata)
  RETURNING id INTO metric_id;
  
  RETURN metric_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION check_subscription_active TO authenticated;
GRANT EXECUTE ON FUNCTION track_usage_metric TO authenticated;