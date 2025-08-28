import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

interface LERGRecord {
  npa: string;
  state: string;
  country: string;
}

interface UploadRequest {
  records: LERGRecord[];
}

Deno.serve(async (req: Request) => {
  // Get the origin from the request headers
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  console.log("[upload-lerg] Function invoked");

  try {
    // Verify authentication first
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create Supabase client with service role key for database operations
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Validate JWT token to ensure authenticated user
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } =
      await supabaseClient.auth.getUser(token);

    if (userError || !userData.user) {
      console.error("[upload-lerg] Auth error:", userError);
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const user = userData.user;
    console.log(`[upload-lerg] Authenticated user: ${user.id}`);

    // Parse request body
    const { records } = (await req.json()) as UploadRequest;

    if (!records || !Array.isArray(records)) {
      throw new Error("Invalid request: records array is required");
    }

    console.log(
      `[upload-lerg] Processing ${records.length} records for user ${user.id}`
    );

    // Remove duplicates first based on NPA
    const seenNPAs = new Set<string>();
    const uniqueRecords = records.filter((record, i) => {
      if (seenNPAs.has(record.npa)) {
        console.log(
          `[upload-lerg] Skipping duplicate NPA: ${record.npa} at row ${i + 1}`
        );
        return false;
      }
      seenNPAs.add(record.npa);
      return true;
    });

    console.log(
      `[upload-lerg] Removed ${
        records.length - uniqueRecords.length
      } duplicates, processing ${uniqueRecords.length} unique NPAs`
    );

    // Validate and transform records for enhanced_lerg table
    const validRecords = [];
    const skippedRows = [];

    for (let i = 0; i < uniqueRecords.length; i++) {
      const record = uniqueRecords[i];

      // Validate required fields
      if (!record.npa || !record.state || !record.country) {
        skippedRows.push(i + 1);
        console.log(
          `[upload-lerg] Skipping row ${i + 1}: missing required fields - npa=${
            record.npa
          }, state=${record.state}, country=${record.country}`
        );
        continue;
      }

      // Map country and state codes to full names and categories
      const countryInfo = getCountryInfo(record.country);
      const stateInfo = getStateInfo(record.state, record.country);
      const category = categorizeNPA(record.npa, record.country, record.state);

      validRecords.push({
        npa: record.npa.trim(),
        country_code: record.country.trim().toUpperCase(),
        country_name: countryInfo.name,
        state_province_code: record.state.trim().toUpperCase(),
        state_province_name: stateInfo.name,
        region: stateInfo.region,
        category: category,
        source: "import",
        confidence_score: 0.95, // High confidence for uploaded data
        is_active: true,
        notes: `Uploaded from LERG file on ${new Date().toISOString()}`,
      });
    }

    console.log(
      `[upload-lerg] Validated ${validRecords.length} records, skipped ${skippedRows.length}`
    );

    if (validRecords.length === 0) {
      throw new Error("No valid records found in the upload");
    }

    // Insert records in batches to avoid timeout
    const BATCH_SIZE = 100;
    let insertedCount = 0;

    for (let i = 0; i < validRecords.length; i += BATCH_SIZE) {
      const batch = validRecords.slice(i, i + BATCH_SIZE);

      const { data, error } = await supabaseClient
        .from("enhanced_lerg")
        .upsert(batch, {
          onConflict: "npa",
          ignoreDuplicates: false,
        })
        .select();

      if (error) {
        console.error(
          `[upload-lerg] Error inserting batch ${i / BATCH_SIZE + 1}:`,
          error
        );
        throw error;
      }

      insertedCount += data?.length || 0;
      console.log(
        `[upload-lerg] Inserted batch ${
          i / BATCH_SIZE + 1
        }, total: ${insertedCount}`
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully uploaded ${insertedCount} LERG records`,
        recordsProcessed: records.length,
        recordsInserted: insertedCount,
        recordsSkipped: skippedRows.length,
        skippedRows: skippedRows.slice(0, 10), // Return first 10 skipped rows for debugging
        timestamp: new Date().toISOString(),
      }),
      {
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error) {
    console.error("[upload-lerg] Error uploading LERG data:", error);

    return new Response(
      JSON.stringify({
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
        details: "Failed to upload LERG data",
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

// Helper function to get country information
function getCountryInfo(countryCode: string): { name: string } {
  const countries: Record<string, string> = {
    US: "United States",
    CA: "Canada",
    BS: "Bahamas",
    BB: "Barbados",
    JM: "Jamaica",
    TT: "Trinidad and Tobago",
    GU: "Guam",
    AS: "American Samoa",
    MP: "Northern Mariana Islands",
    VI: "Virgin Islands",
    PR: "Puerto Rico",
    DO: "Dominican Republic",
    KN: "Saint Kitts and Nevis",
    LC: "Saint Lucia",
    VC: "Saint Vincent and the Grenadines",
    GD: "Grenada",
    AG: "Antigua and Barbuda",
    DM: "Dominica",
    KY: "Cayman Islands",
    BM: "Bermuda",
    TC: "Turks and Caicos Islands",
    VG: "British Virgin Islands",
    AI: "Anguilla",
    MS: "Montserrat",
    SX: "Sint Maarten",
  };

  return { name: countries[countryCode] || countryCode };
}

// Helper function to get state/province information
function getStateInfo(
  stateCode: string,
  countryCode: string
): { name: string; region: string | null } {
  if (countryCode === "US") {
    const usStates: Record<string, string> = {
      AL: "Alabama",
      AK: "Alaska",
      AZ: "Arizona",
      AR: "Arkansas",
      CA: "California",
      CO: "Colorado",
      CT: "Connecticut",
      DE: "Delaware",
      FL: "Florida",
      GA: "Georgia",
      HI: "Hawaii",
      ID: "Idaho",
      IL: "Illinois",
      IN: "Indiana",
      IA: "Iowa",
      KS: "Kansas",
      KY: "Kentucky",
      LA: "Louisiana",
      ME: "Maine",
      MD: "Maryland",
      MA: "Massachusetts",
      MI: "Michigan",
      MN: "Minnesota",
      MS: "Mississippi",
      MO: "Missouri",
      MT: "Montana",
      NE: "Nebraska",
      NV: "Nevada",
      NH: "New Hampshire",
      NJ: "New Jersey",
      NM: "New Mexico",
      NY: "New York",
      NC: "North Carolina",
      ND: "North Dakota",
      OH: "Ohio",
      OK: "Oklahoma",
      OR: "Oregon",
      PA: "Pennsylvania",
      RI: "Rhode Island",
      SC: "South Carolina",
      SD: "South Dakota",
      TN: "Tennessee",
      TX: "Texas",
      UT: "Utah",
      VT: "Vermont",
      VA: "Virginia",
      WA: "Washington",
      WV: "West Virginia",
      WI: "Wisconsin",
      WY: "Wyoming",
      DC: "District of Columbia",
      VI: "VI",
    };
    return { name: usStates[stateCode] || stateCode, region: "US" };
  }

  if (countryCode === "CA") {
    const provinces: Record<string, string> = {
      AB: "Alberta",
      BC: "British Columbia",
      MB: "Manitoba",
      NB: "New Brunswick",
      NL: "Newfoundland and Labrador",
      NS: "Nova Scotia",
      NT: "Northwest Territories",
      NU: "Nunavut",
      ON: "Ontario",
      PE: "Prince Edward Island",
      QC: "Quebec",
      SK: "Saskatchewan",
      YT: "Yukon",
    };
    return { name: provinces[stateCode] || stateCode, region: "CA" };
  }

  // For Caribbean/Pacific territories, use the country code as region
  return { name: stateCode, region: countryCode };
}

// Helper function to categorize NPA
function categorizeNPA(
  npa: string,
  countryCode: string,
  stateCode: string
): string {
  // Check Pacific territories first (they have US as secondary country code)
  if (["GU", "AS", "MP"].includes(countryCode)) {
    return "pacific";
  } else if (countryCode === "US") {
    return "us-domestic";
  } else if (countryCode === "CA") {
    return "canadian";
  } else {
    return "caribbean";
  }
}
