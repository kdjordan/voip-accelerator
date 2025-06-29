import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const ENHANCED_LERG_TABLE = "enhanced_lerg";

// Validation patterns
const npaRegex = /^[0-9]{3}$/;
const countryCodeRegex = /^[A-Z]{2}$/;
const stateProvinceCodeRegex = /^[A-Z]{2}$/;

// Valid categories
const validCategories = ['us-domestic', 'canadian', 'caribbean', 'pacific'] as const;
type Category = typeof validCategories[number];

// Valid sources
const validSources = ['lerg', 'manual', 'import', 'seed'] as const;
type Source = typeof validSources[number];

interface EnhancedLergRecordPayload {
  npa: string;
  country_code: string;
  country_name: string;
  state_province_code: string;
  state_province_name: string;
  region?: string;
  category: Category;
  source?: Source;
  confidence_score?: number;
  notes?: string;
}

// Known US states for validation
const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'DC', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 
  'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 
  'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 
  'WV', 'WI', 'WY'
];

// Known Canadian provinces
const CANADIAN_PROVINCES = ['AB', 'BC', 'MB', 'NB', 'NL', 'NS', 'NT', 'NU', 'ON', 'PE', 'QC', 'SK', 'YT'];

// Known NANP countries
const NANP_COUNTRIES = [
  'US', 'CA', 'AG', 'AI', 'AS', 'BB', 'BM', 'BS', 'DM', 'DO', 'GD', 'GU', 'JM', 'KN', 'KY', 
  'LC', 'MP', 'MS', 'PR', 'SX', 'TC', 'TT', 'VC', 'VG', 'VI'
];

async function validatePayload(
  payload: EnhancedLergRecordPayload
): Promise<{ valid: boolean; errors: Record<string, string> }> {
  const errors: Record<string, string> = {};

  // Validate NPA
  if (!payload.npa || !npaRegex.test(payload.npa)) {
    errors.npa = "NPA must be exactly 3 digits.";
  }

  // Validate country code
  if (!payload.country_code || !countryCodeRegex.test(payload.country_code)) {
    errors.country_code = "Country code must be exactly 2 uppercase letters.";
  } else if (!NANP_COUNTRIES.includes(payload.country_code)) {
    errors.country_code = `Country code '${payload.country_code}' is not a valid NANP country.`;
  }

  // Validate country name
  if (!payload.country_name || payload.country_name.trim().length === 0) {
    errors.country_name = "Country name is required.";
  }

  // Validate state/province code
  if (!payload.state_province_code || !stateProvinceCodeRegex.test(payload.state_province_code)) {
    errors.state_province_code = "State/Province code must be exactly 2 uppercase letters.";
  } else {
    // Validate state/province matches country
    if (payload.country_code === 'US' && !US_STATES.includes(payload.state_province_code)) {
      errors.state_province_code = `'${payload.state_province_code}' is not a valid US state code.`;
    } else if (payload.country_code === 'CA' && !CANADIAN_PROVINCES.includes(payload.state_province_code)) {
      errors.state_province_code = `'${payload.state_province_code}' is not a valid Canadian province code.`;
    }
  }

  // Validate state/province name
  if (!payload.state_province_name || payload.state_province_name.trim().length === 0) {
    errors.state_province_name = "State/Province name is required.";
  }

  // Validate category
  if (!payload.category || !validCategories.includes(payload.category)) {
    errors.category = `Category must be one of: ${validCategories.join(', ')}.`;
  } else {
    // Validate category matches country
    if (payload.country_code === 'US' && payload.category !== 'us-domestic') {
      errors.category = "US NPAs must use 'us-domestic' category.";
    } else if (payload.country_code === 'CA' && payload.category !== 'canadian') {
      errors.category = "Canadian NPAs must use 'canadian' category.";
    } else if (payload.country_code && !['US', 'CA'].includes(payload.country_code)) {
      if (!['caribbean', 'pacific'].includes(payload.category)) {
        errors.category = "Non-US/CA NPAs must use 'caribbean' or 'pacific' category.";
      }
    }
  }

  // Validate source (optional)
  if (payload.source && !validSources.includes(payload.source)) {
    errors.source = `Source must be one of: ${validSources.join(', ')}.`;
  }

  // Validate confidence score (optional)
  if (payload.confidence_score !== undefined) {
    if (typeof payload.confidence_score !== 'number' || 
        payload.confidence_score < 0 || 
        payload.confidence_score > 1) {
      errors.confidence_score = "Confidence score must be a number between 0 and 1.";
    }
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  console.log("[add-enhanced-lerg-record] Function invoked");

  try {
    const payload: EnhancedLergRecordPayload = await req.json();
    console.log(`[add-enhanced-lerg-record] Adding NPA ${payload.npa} for ${payload.country_name}`);

    // Validate the payload
    const { valid, errors } = await validatePayload(payload);
    if (!valid) {
      console.log("[add-enhanced-lerg-record] Validation failed:", errors);
      return new Response(
        JSON.stringify({ 
          error: "Validation failed", 
          details: errors 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const serviceClient = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Prepare the record for insertion
    const recordToInsert = {
      npa: payload.npa,
      country_code: payload.country_code.toUpperCase(),
      country_name: payload.country_name.trim(),
      state_province_code: payload.state_province_code.toUpperCase(),
      state_province_name: payload.state_province_name.trim(),
      region: payload.region?.trim() || null,
      category: payload.category,
      source: payload.source || 'manual',
      confidence_score: payload.confidence_score || 1.00,
      notes: payload.notes?.trim() || null,
      is_active: true
    };

    console.log("[add-enhanced-lerg-record] Inserting record into enhanced_lerg table");

    // Insert the record
    const { error: insertError } = await serviceClient
      .from(ENHANCED_LERG_TABLE)
      .insert(recordToInsert);

    if (insertError) {
      console.error("[add-enhanced-lerg-record] Database insert error:", insertError);
      
      if (insertError.code === "23505") {
        // Handle duplicate NPA error
        return new Response(
          JSON.stringify({ 
            error: `NPA '${payload.npa}' already exists in enhanced LERG table.`,
            details: "Each NPA can only exist once in the system."
          }),
          {
            status: 409,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      // Handle other database errors
      return new Response(
        JSON.stringify({ 
          error: `Database error: ${insertError.message}`,
          details: insertError.details || "Failed to insert enhanced LERG record"
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`[add-enhanced-lerg-record] Successfully added NPA ${payload.npa} for ${payload.country_name}`);

    // Success response with full context
    return new Response(
      JSON.stringify({ 
        message: "Enhanced LERG record added successfully",
        record: {
          npa: payload.npa,
          location: `${payload.state_province_name}, ${payload.country_name}`,
          category: payload.category,
          confidence_score: recordToInsert.confidence_score
        }
      }),
      {
        status: 201,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (err) {
    console.error("[add-enhanced-lerg-record] Unexpected error:", err);
    return new Response(
      JSON.stringify({ 
        error: err instanceof Error ? err.message : "Unknown error occurred",
        details: "Failed to process enhanced LERG record addition"
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

/* 
To deploy:
supabase functions deploy add-enhanced-lerg-record --no-verify-jwt

This function adds records to the enhanced_lerg table with full geographic context:
- Complete validation of country/state combinations
- Category validation (us-domestic, canadian, caribbean, pacific)
- Confidence scoring for data quality
- Full geographic names (not just codes)
- Source tracking for audit purposes
*/