import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

interface NPALocationInfo {
  npa: string;
  country_code: string;
  country_name: string;
  state_province_code: string;
  state_province_name: string;
  region: string | null;
  category: 'us-domestic' | 'canadian' | 'caribbean' | 'pacific';
  display_location: string;      // "New York, United States"
  full_location: string;         // "New York, United States (NY, US)"
  confidence_score: number;
  source: string;
  is_active: boolean;
}

interface NPALocationResponse {
  found: boolean;
  npa: string;
  location?: NPALocationInfo;
  error?: string;
}

// NPA validation
const npaRegex = /^[0-9]{3}$/;

serve(async (req: Request) => {
  // Get the origin from the request headers
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);
  
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  console.log("[get-npa-location] Function invoked");

  try {
    // Get NPA from query parameters or request body
    const url = new URL(req.url);
    let npa = url.searchParams.get("npa");
    
    // If not in query params, try to get from request body
    if (!npa && req.method === "POST") {
      try {
        const body = await req.json();
        npa = body.npa;
      } catch {
        // If body parsing fails, that's ok - we'll handle missing NPA below
      }
    }

    if (!npa) {
      return new Response(
        JSON.stringify({
          error: "NPA is required",
          details: "Provide NPA as query parameter (?npa=212) or in request body {\"npa\": \"212\"}"
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Validate NPA format
    if (!npaRegex.test(npa)) {
      return new Response(
        JSON.stringify({
          error: "Invalid NPA format",
          details: "NPA must be exactly 3 digits"
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`[get-npa-location] Looking up location for NPA ${npa}`);

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Query the enhanced_lerg table for this specific NPA
    const { data: npaData, error: lergError } = await supabaseClient
      .from("enhanced_lerg")
      .select(`
        npa,
        country_code,
        country_name,
        state_province_code,
        state_province_name,
        region,
        category,
        confidence_score,
        source,
        is_active
      `)
      .eq("npa", npa)
      .eq("is_active", true)
      .single();

    if (lergError) {
      if (lergError.code === 'PGRST116') {
        // NPA not found
        console.log(`[get-npa-location] NPA ${npa} not found in enhanced LERG data`);
        
        const response: NPALocationResponse = {
          found: false,
          npa: npa,
          error: `NPA '${npa}' not found in NANP database`
        };

        return new Response(JSON.stringify(response), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      console.error(`[get-npa-location] Database error looking up NPA ${npa}:`, lergError);
      throw lergError;
    }

    // Build the location information
    const locationInfo: NPALocationInfo = {
      npa: npaData.npa,
      country_code: npaData.country_code,
      country_name: npaData.country_name,
      state_province_code: npaData.state_province_code,
      state_province_name: npaData.state_province_name,
      region: npaData.region,
      category: npaData.category,
      display_location: `${npaData.state_province_name}, ${npaData.country_name}`,
      full_location: `${npaData.state_province_name}, ${npaData.country_name} (${npaData.state_province_code}, ${npaData.country_code})`,
      confidence_score: npaData.confidence_score,
      source: npaData.source,
      is_active: npaData.is_active
    };

    const response: NPALocationResponse = {
      found: true,
      npa: npa,
      location: locationInfo
    };

    console.log(`[get-npa-location] Found location for NPA ${npa}: ${locationInfo.display_location}`);

    return new Response(JSON.stringify(response), {
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error) {
    console.error("[get-npa-location] Error looking up NPA location:", error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error occurred",
        details: "Failed to retrieve NPA location information"
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

/* 
To deploy:
supabase functions deploy get-npa-location --no-verify-jwt

This function provides instant NPA location lookup:

Usage examples:
- GET /get-npa-location?npa=212
- POST /get-npa-location with body {"npa": "212"}

Response for found NPA:
{
  "found": true,
  "npa": "212",
  "location": {
    "npa": "212",
    "country_code": "US",
    "country_name": "United States",
    "state_province_code": "NY",
    "state_province_name": "New York",
    "region": "Northeast",
    "category": "us-domestic",
    "display_location": "New York, United States",
    "full_location": "New York, United States (NY, US)",
    "confidence_score": 1.00,
    "source": "seed",
    "is_active": true
  }
}

Response for missing NPA:
{
  "found": false,
  "npa": "999",
  "error": "NPA '999' not found in NANP database"
}
*/