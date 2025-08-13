-- Create active_sessions table for session management
CREATE TABLE IF NOT EXISTS public.active_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_heartbeat TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_agent TEXT,
  ip_address TEXT,
  browser_info JSONB,
  is_active BOOLEAN DEFAULT true,
  CONSTRAINT unique_active_session UNIQUE (session_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_active_sessions_user_id ON public.active_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_active_sessions_heartbeat ON public.active_sessions(last_heartbeat);
CREATE INDEX IF NOT EXISTS idx_active_sessions_session_id ON public.active_sessions(session_id);

-- Enable RLS
ALTER TABLE public.active_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only see their own sessions
CREATE POLICY "Users can view own sessions" ON public.active_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own sessions (heartbeat)
CREATE POLICY "Users can update own sessions" ON public.active_sessions
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can insert their own sessions
CREATE POLICY "Users can insert own sessions" ON public.active_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own sessions
CREATE POLICY "Users can delete own sessions" ON public.active_sessions
  FOR DELETE
  USING (auth.uid() = user_id);

-- Function to clean up stale sessions (older than 30 minutes)
CREATE OR REPLACE FUNCTION clean_stale_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM public.active_sessions
  WHERE last_heartbeat < NOW() - INTERVAL '30 minutes';
END;
$$ LANGUAGE plpgsql;

-- Optional: Create a scheduled job to clean up stale sessions
-- This would need to be set up via pg_cron or external scheduler