import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient, Session } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Log the key for debugging in production
console.log('[DEBUG] VITE_SUPABASE_ANON_KEY from import.meta.env:', supabaseAnonKey);
console.log('[DEBUG] VITE_SUPABASE_URL from import.meta.env:', supabaseUrl);

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Check your .env file.');
}

/**
 * Initialize the Supabase client with environment variables
 */
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
  },
});

/**
 * Get the current user session if available
 */
export async function getSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

/**
 * Check if the current user has the superadmin role
 */
export async function isSuperAdmin(): Promise<boolean> {
  const session = await getSession();

  if (!session) return false;

  const { user } = session;
  return user?.user_metadata?.role === 'superadmin';
}

/**
 * Handle Supabase error responses in a standardized way
 */
export function handleSupabaseError(error: Error | null): string {
  if (!error) return '';

  // Log error for debugging
  console.error('Supabase error:', error);

  // Return user-friendly message
  return error.message || 'An unexpected error occurred';
}
