import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

interface EnhancedLERGRecord {
  npa: string;
  country_code: string;
  country_name: string;
  state_province_code: string;
  state_province_name: string;
  region: string | null;
  category: 'us-domestic' | 'canadian' | 'caribbean' | 'pacific';
  source: 'lerg' | 'manual' | 'import' | 'seed';
  confidence_score: number;
  created_at: string;
  updated_at: string;
  notes: string | null;
  is_active: boolean;
}

interface EnhancedLERGStats {
  total: number;
  us_domestic: number;
  canadian: number;
  caribbean: number;
  pacific: number;
  last_updated: string | null;
  confidence_breakdown: {
    high: number;      // >= 0.9
    medium: number;    // 0.7 - 0.89
    low: number;       // < 0.7
  };
}

serve(async (req) => {
  // Get the origin from the request headers
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  console.log("[get-enhanced-lerg-data] Function invoked");

  try {
    // Create a Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    console.log("[get-enhanced-lerg-data] Supabase client created");

    // Query the enhanced_lerg table
    console.log("[get-enhanced-lerg-data] Querying enhanced_lerg table");
    const { data: enhancedLergData, error: lergError } = await supabaseClient
      .from("enhanced_lerg")
      .select(`
        npa,
        country_code,
        country_name,
        state_province_code,
        state_province_name,
        region,
        category,
        source,
        confidence_score,
        created_at,
        updated_at,
        notes,
        is_active
      `)
      .eq("is_active", true)
      .order("npa");

    if (lergError) {
      console.error("[get-enhanced-lerg-data] Error querying enhanced_lerg:", lergError);
      throw lergError;
    }

    console.log(`[get-enhanced-lerg-data] Retrieved ${enhancedLergData?.length || 0} records`);

    // Calculate enhanced statistics
    console.log("[get-enhanced-lerg-data] Calculating enhanced statistics");
    
    const stats: EnhancedLERGStats = {
      total: enhancedLergData?.length || 0,
      us_domestic: 0,
      canadian: 0,
      caribbean: 0,
      pacific: 0,
      last_updated: null,
      confidence_breakdown: {
        high: 0,
        medium: 0,
        low: 0
      }
    };

    // Calculate category counts and confidence breakdown
    if (enhancedLergData) {
      for (const record of enhancedLergData) {
        // Category counts
        switch (record.category) {
          case 'us-domestic':
            stats.us_domestic++;
            break;
          case 'canadian':
            stats.canadian++;
            break;
          case 'caribbean':
            stats.caribbean++;
            break;
          case 'pacific':
            stats.pacific++;
            break;
        }

        // Confidence breakdown
        if (record.confidence_score >= 0.9) {
          stats.confidence_breakdown.high++;
        } else if (record.confidence_score >= 0.7) {
          stats.confidence_breakdown.medium++;
        } else {
          stats.confidence_breakdown.low++;
        }
      }

      // Get the most recent update timestamp
      const sortedByUpdate = enhancedLergData
        .filter(r => r.updated_at)
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
      
      stats.last_updated = sortedByUpdate[0]?.updated_at || null;
    }

    // Prepare the response
    const result = {
      data: enhancedLergData,
      stats: stats,
      metadata: {
        source: 'enhanced_lerg',
        has_full_geographic_context: true,
        includes_confidence_scoring: true,
        timestamp: new Date().toISOString()
      }
    };

    console.log("[get-enhanced-lerg-data] Successfully compiled enhanced response");
    console.log(`[get-enhanced-lerg-data] Stats: ${stats.total} total, ${stats.us_domestic} US, ${stats.canadian} CA, ${stats.caribbean} Caribbean, ${stats.pacific} Pacific`);

    return new Response(JSON.stringify(result), {
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error) {
    console.error("[get-enhanced-lerg-data] Error fetching enhanced LERG data:", error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error occurred",
        details: "Failed to fetch enhanced LERG data with full geographic context"
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  }
});