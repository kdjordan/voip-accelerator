import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

interface RequestBody {
  action: 'check' | 'increment' | 'statistics' | 'reset';
  fileCount?: number;
  migrationVersion?: string;
}

interface UploadCheckResult {
  canUpload: boolean;
  remaining: number | null;
  message: string;
  tier: string;
}

interface UploadIncrementResult {
  success: boolean;
  uploadsThisMonth: number;
  totalUploads: number;
  remaining: number | null;
  message: string;
}

interface UploadStatistics {
  uploadsThisMonth: number;
  totalUploads: number;
  tier: string;
  remaining: number | null;
  percentage: number;
  isUnlimited: boolean;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role for bypassing RLS
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Verify the JWT token to get user ID
    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !userData.user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const userId = userData.user.id;

    // Parse request body
    const body: RequestBody = await req.json();
    const { action, fileCount = 1, migrationVersion } = body;

    switch (action) {
      case 'check': {
        const { data, error } = await supabase.rpc('check_upload_limit', {
          user_id: userId,
          file_count: fileCount
        });

        if (error) {
          throw error;
        }

        return new Response(
          JSON.stringify(data as UploadCheckResult),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      case 'increment': {
        const { data, error } = await supabase.rpc('increment_upload_count', {
          user_id: userId,
          file_count: fileCount
        });

        if (error) {
          throw error;
        }

        return new Response(
          JSON.stringify(data as UploadIncrementResult),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      case 'statistics': {
        const { data, error } = await supabase.rpc('get_upload_statistics', {
          user_id: userId
        });

        if (error) {
          throw error;
        }

        return new Response(
          JSON.stringify(data as UploadStatistics),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      case 'reset': {
        const { data, error } = await supabase.rpc('reset_monthly_uploads', {
          user_id: userId,
          migration_version: migrationVersion
        });

        if (error) {
          throw error;
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Monthly uploads reset successfully',
            data
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: `Invalid action: ${action}` }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
    }

  } catch (error) {
    console.error('Edge function error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});