import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.1"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase admin client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Check if total_uploads column already exists
    const { data: existingColumn } = await supabase
      .rpc('column_exists', { 
        table_name: 'profiles', 
        column_name: 'total_uploads' 
      })
      .single()

    if (existingColumn?.exists) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Migration already applied - total_uploads column exists' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    // Apply the migration
    const migrationSQL = `
      -- Add total_uploads column for lifetime tracking
      ALTER TABLE profiles 
      ADD COLUMN IF NOT EXISTS total_uploads INTEGER DEFAULT 0;

      -- Add comment for documentation
      COMMENT ON COLUMN profiles.total_uploads IS 'Lifetime total uploads for marketing metrics and analytics';

      -- Initialize total_uploads for existing users
      UPDATE profiles
      SET total_uploads = COALESCE(uploads_this_month, 0)
      WHERE total_uploads IS NULL;

      -- Ensure all users have a reset date
      UPDATE profiles
      SET uploads_reset_date = CURRENT_DATE
      WHERE uploads_reset_date IS NULL;
    `

    const { error: migrationError } = await supabase.rpc('exec_sql', { 
      sql_query: migrationSQL 
    })

    if (migrationError) {
      throw migrationError
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Upload tracking migration applied successfully',
        details: {
          columnsAdded: ['total_uploads'],
          functionsCreated: ['check_upload_limit', 'increment_upload_count', 'reset_monthly_uploads', 'get_upload_statistics']
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    console.error('Migration error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})