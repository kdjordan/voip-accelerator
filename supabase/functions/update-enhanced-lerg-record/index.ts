import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const ENHANCED_LERG_TABLE = "enhanced_lerg";

// Validation patterns
const npaRegex = /^[0-9]{3}$/;
const countryCodeRegex = /^[A-Z]{2}$/;
const stateProvinceCodeRegex = /^[A-Z]{2}$/;

// Valid categories and sources
const validCategories = ['us-domestic', 'canadian', 'caribbean', 'pacific'] as const;
const validSources = ['lerg', 'manual', 'import', 'seed'] as const;
type Category = typeof validCategories[number];
type Source = typeof validSources[number];

interface UpdateEnhancedLergRecordPayload {
  npa: string; // Required - identifies the record to update
  country_code?: string;
  country_name?: string;
  state_province_code?: string;
  state_province_name?: string;
  region?: string;
  category?: Category;
  source?: Source;
  confidence_score?: number;
  notes?: string;
  is_active?: boolean;
}

// Known geographic codes for validation
const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'DC', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 
  'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 
  'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 
  'WV', 'WI', 'WY'
];

const CANADIAN_PROVINCES = ['AB', 'BC', 'MB', 'NB', 'NL', 'NS', 'NT', 'NU', 'ON', 'PE', 'QC', 'SK', 'YT'];

const NANP_COUNTRIES = [
  'US', 'CA', 'AG', 'AI', 'AS', 'BB', 'BM', 'BS', 'DM', 'DO', 'GD', 'GU', 'JM', 'KN', 'KY', 
  'LC', 'MP', 'MS', 'PR', 'SX', 'TC', 'TT', 'VC', 'VG', 'VI'
];

async function validateUpdatePayload(
  payload: UpdateEnhancedLergRecordPayload
): Promise<{ valid: boolean; errors: Record<string, string> }> {
  const errors: Record<string, string> = {};

  // Validate NPA (required for identifying the record)
  if (!payload.npa || !npaRegex.test(payload.npa)) {
    errors.npa = "NPA must be exactly 3 digits.";
  }

  // Validate optional fields only if they are provided
  if (payload.country_code !== undefined) {
    if (!countryCodeRegex.test(payload.country_code)) {
      errors.country_code = "Country code must be exactly 2 uppercase letters.";
    } else if (!NANP_COUNTRIES.includes(payload.country_code)) {
      errors.country_code = `Country code '${payload.country_code}' is not a valid NANP country.`;
    }
  }

  if (payload.country_name !== undefined && payload.country_name.trim().length === 0) {
    errors.country_name = "Country name cannot be empty.";
  }

  if (payload.state_province_code !== undefined) {
    if (!stateProvinceCodeRegex.test(payload.state_province_code)) {
      errors.state_province_code = "State/Province code must be exactly 2 uppercase letters.";
    } else {
      // Validate against country if both are provided
      if (payload.country_code === 'US' && !US_STATES.includes(payload.state_province_code)) {
        errors.state_province_code = `'${payload.state_province_code}' is not a valid US state code.`;
      } else if (payload.country_code === 'CA' && !CANADIAN_PROVINCES.includes(payload.state_province_code)) {
        errors.state_province_code = `'${payload.state_province_code}' is not a valid Canadian province code.`;
      }
    }
  }

  if (payload.state_province_name !== undefined && payload.state_province_name.trim().length === 0) {
    errors.state_province_name = "State/Province name cannot be empty.";
  }

  if (payload.category !== undefined && !validCategories.includes(payload.category)) {
    errors.category = `Category must be one of: ${validCategories.join(', ')}.`;
  }

  if (payload.source !== undefined && !validSources.includes(payload.source)) {
    errors.source = `Source must be one of: ${validSources.join(', ')}.`;
  }

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

  console.log("[update-enhanced-lerg-record] Function invoked");

  try {
    const payload: UpdateEnhancedLergRecordPayload = await req.json();
    console.log(`[update-enhanced-lerg-record] Updating NPA ${payload.npa}`);

    // Validate the payload
    const { valid, errors } = await validateUpdatePayload(payload);
    if (!valid) {
      console.log("[update-enhanced-lerg-record] Validation failed:", errors);
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

    // Check if the record exists first
    console.log(`[update-enhanced-lerg-record] Checking if NPA ${payload.npa} exists`);
    const { data: existingRecord, error: selectError } = await serviceClient
      .from(ENHANCED_LERG_TABLE)
      .select("npa, country_name, state_province_name")
      .eq("npa", payload.npa)
      .single();

    if (selectError) {
      if (selectError.code === 'PGRST116') {
        // Record not found
        return new Response(
          JSON.stringify({ 
            error: `NPA '${payload.npa}' not found in enhanced LERG table.`,
            details: "Cannot update a record that does not exist."
          }),
          {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      console.error("[update-enhanced-lerg-record] Error checking existing record:", selectError);
      throw selectError;
    }

    // Prepare the update object (only include fields that are provided)
    const updateObject: any = {};
    
    if (payload.country_code !== undefined) updateObject.country_code = payload.country_code.toUpperCase();
    if (payload.country_name !== undefined) updateObject.country_name = payload.country_name.trim();
    if (payload.state_province_code !== undefined) updateObject.state_province_code = payload.state_province_code.toUpperCase();
    if (payload.state_province_name !== undefined) updateObject.state_province_name = payload.state_province_name.trim();
    if (payload.region !== undefined) updateObject.region = payload.region.trim() || null;
    if (payload.category !== undefined) updateObject.category = payload.category;
    if (payload.source !== undefined) updateObject.source = payload.source;
    if (payload.confidence_score !== undefined) updateObject.confidence_score = payload.confidence_score;
    if (payload.notes !== undefined) updateObject.notes = payload.notes.trim() || null;
    if (payload.is_active !== undefined) updateObject.is_active = payload.is_active;

    // Add audit trail - update timestamp and source
    updateObject.updated_at = new Date().toISOString();
    if (!updateObject.source) updateObject.source = 'manual'; // Default to manual if not specified

    console.log("[update-enhanced-lerg-record] Updating record in enhanced_lerg table");

    // Perform the update
    const { error: updateError } = await serviceClient
      .from(ENHANCED_LERG_TABLE)
      .update(updateObject)
      .eq("npa", payload.npa);

    if (updateError) {
      console.error("[update-enhanced-lerg-record] Database update error:", updateError);
      return new Response(
        JSON.stringify({ 
          error: `Database error: ${updateError.message}`,
          details: updateError.details || "Failed to update enhanced LERG record"
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`[update-enhanced-lerg-record] Successfully updated NPA ${payload.npa}`);

    // Success response with context
    const updatedFields = Object.keys(updateObject).filter(key => key !== 'updated_at');
    return new Response(
      JSON.stringify({ 
        message: "Enhanced LERG record updated successfully",
        record: {
          npa: payload.npa,
          previous_location: `${existingRecord.state_province_name}, ${existingRecord.country_name}`,
          updated_fields: updatedFields,
          timestamp: updateObject.updated_at
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (err) {
    console.error("[update-enhanced-lerg-record] Unexpected error:", err);
    return new Response(
      JSON.stringify({ 
        error: err instanceof Error ? err.message : "Unknown error occurred",
        details: "Failed to process enhanced LERG record update"
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
supabase functions deploy update-enhanced-lerg-record --no-verify-jwt

This function updates existing records in the enhanced_lerg table:
- Partial updates (only update fields that are provided)
- Full validation of geographic combinations
- Audit trail with timestamps and source tracking
- Proper error handling for non-existent records
- Maintains data integrity and confidence scoring
*/