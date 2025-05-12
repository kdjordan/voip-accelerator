import { createClient } from '@supabase/supabase-js';

// Get Supabase URL and Anon Key from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Log the key for debugging in production
console.log('[DEBUG Service] VITE_SUPABASE_ANON_KEY from import.meta.env:', supabaseAnonKey);
console.log('[DEBUG Service] VITE_SUPABASE_URL from import.meta.env:', supabaseUrl);

// Basic validation
if (!supabaseUrl) {
  throw new Error('Missing environment variable: VITE_SUPABASE_URL');
}
if (!supabaseAnonKey) {
  throw new Error('Missing environment variable: VITE_SUPABASE_ANON_KEY');
}

// Create and export the Supabase client instance
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
