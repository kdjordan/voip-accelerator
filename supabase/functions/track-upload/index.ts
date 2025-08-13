import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UploadRequest {
  uploadType: 'rate_sheet' | 'comparison' | 'rate_deck' | 'bulk_adjustment';
  uploadCount?: number; // For batch uploads, default 1
}

// Upload limits by tier
const UPLOAD_LIMITS = {
  accelerator: 100,
  optimizer: -1,    // Unlimited
  enterprise: -1    // Unlimited
};

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get user
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      throw new Error('Authentication required');
    }

    // Parse request body
    const body: UploadRequest = await req.json();
    const { uploadType, uploadCount = 1 } = body;

    console.log(`📊 Upload tracking - User: ${user.email}, Type: ${uploadType}, Count: ${uploadCount}`);

    // Get user profile
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('subscription_tier, uploads_this_month, uploads_reset_date')
      .eq('id', user.id)
      .single();

    if (profileError) {
      throw new Error(`Failed to get user profile: ${profileError.message}`);
    }

    const { subscription_tier, uploads_this_month, uploads_reset_date } = profile;
    
    // Check if upload reset is needed (monthly reset based on UTC)
    const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const resetDate = uploads_reset_date ? new Date(uploads_reset_date).toISOString().split('T')[0] : currentDate;
    const currentMonth = new Date().getUTCMonth();
    const resetMonth = new Date(resetDate + 'T00:00:00Z').getUTCMonth();
    
    let currentUploads = uploads_this_month;
    
    // Reset uploads if we're in a new month
    if (currentMonth !== resetMonth) {
      console.log(`🔄 Resetting uploads for new month - was ${uploads_this_month}, now 0`);
      
      const { error: resetError } = await supabaseClient
        .from('profiles')
        .update({
          uploads_this_month: 0,
          uploads_reset_date: currentDate
        })
        .eq('id', user.id);

      if (resetError) {
        throw new Error(`Failed to reset upload counter: ${resetError.message}`);
      }
      
      currentUploads = 0;
    }

    // Check upload limits for user's tier
    const limit = UPLOAD_LIMITS[subscription_tier] || UPLOAD_LIMITS.accelerator;
    const newUploadTotal = currentUploads + uploadCount;
    
    if (limit > 0 && newUploadTotal > limit) {
      console.log(`🚫 Upload limit exceeded - Current: ${currentUploads}, Limit: ${limit}, Requested: ${uploadCount}`);
      
      return new Response(
        JSON.stringify({
          success: false,
          limitExceeded: true,
          currentUploads,
          uploadLimit: limit,
          remaining: Math.max(0, limit - currentUploads),
          tier: subscription_tier,
          message: `Upload limit exceeded. You have used ${currentUploads}/${limit} uploads this month.`,
          upgradeRequired: subscription_tier === 'accelerator',
          nextResetDate: getNextResetDate()
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 429, // Too Many Requests
        }
      );
    }

    // Update upload counter
    const { error: updateError } = await supabaseClient
      .from('profiles')
      .update({
        uploads_this_month: newUploadTotal
      })
      .eq('id', user.id);

    if (updateError) {
      throw new Error(`Failed to update upload counter: ${updateError.message}`);
    }

    console.log(`✅ Upload tracked - Type: ${uploadType}, New total: ${newUploadTotal}/${limit > 0 ? limit : '∞'}`);

    // Calculate remaining uploads
    const remaining = limit > 0 ? limit - newUploadTotal : -1; // -1 for unlimited

    return new Response(
      JSON.stringify({
        success: true,
        uploadType,
        uploadCount,
        totalUploads: newUploadTotal,
        uploadLimit: limit,
        remaining,
        tier: subscription_tier,
        isUnlimited: limit === -1,
        nextResetDate: getNextResetDate(),
        message: limit > 0 
          ? `${remaining} uploads remaining this month`
          : 'Unlimited uploads available'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Upload tracking error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});

function getNextResetDate(): string {
  const now = new Date();
  const nextMonth = new Date(now.getUTCFullYear(), now.getUTCMonth() + 1, 1);
  return nextMonth.toISOString().split('T')[0];
}