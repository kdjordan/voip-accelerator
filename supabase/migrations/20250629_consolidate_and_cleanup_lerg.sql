-- Migration: Consolidate LERG Tables and Clean Up Database
-- Description: Migrate all data to enhanced_lerg and remove redundant tables
-- Author: VoIP Accelerator Team
-- Date: 2025-06-29
-- IMPORTANT: This migration consolidates all LERG data and removes legacy tables

BEGIN;

-- Step 1: First, let's see what we're dealing with
DO $$
DECLARE
    legacy_count INTEGER;
    enhanced_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO legacy_count FROM public.lerg_codes;
    SELECT COUNT(*) INTO enhanced_count FROM public.enhanced_lerg;
    
    RAISE NOTICE '=== PRE-CONSOLIDATION REPORT ===';
    RAISE NOTICE 'Legacy lerg_codes count: %', legacy_count;
    RAISE NOTICE 'Enhanced lerg count: %', enhanced_count;
    RAISE NOTICE 'Tables to be removed: enhanced_lerg_by_country, enhanced_lerg_stats, lerg_codes';
END $$;

-- Step 2: Migrate ALL data from lerg_codes to enhanced_lerg (if not already there)
INSERT INTO public.enhanced_lerg (
    npa, 
    country_code, 
    country_name,
    state_province_code, 
    state_province_name,
    region,
    category,
    source,
    confidence_score,
    notes
)
SELECT DISTINCT
    lc.npa,
    lc.country,
    -- Country name mapping
    CASE lc.country
        WHEN 'US' THEN 'United States'
        WHEN 'CA' THEN 'Canada'
        WHEN 'BS' THEN 'Bahamas'
        WHEN 'BB' THEN 'Barbados'
        WHEN 'JM' THEN 'Jamaica'
        WHEN 'TT' THEN 'Trinidad and Tobago'
        WHEN 'DO' THEN 'Dominican Republic'
        WHEN 'PR' THEN 'Puerto Rico'
        WHEN 'VI' THEN 'U.S. Virgin Islands'
        WHEN 'GU' THEN 'Guam'
        WHEN 'AS' THEN 'American Samoa'
        WHEN 'MP' THEN 'Northern Mariana Islands'
        WHEN 'AG' THEN 'Antigua and Barbuda'
        WHEN 'AI' THEN 'Anguilla'
        WHEN 'BM' THEN 'Bermuda'
        WHEN 'DM' THEN 'Dominica'
        WHEN 'GD' THEN 'Grenada'
        WHEN 'KN' THEN 'Saint Kitts and Nevis'
        WHEN 'KY' THEN 'Cayman Islands'
        WHEN 'LC' THEN 'Saint Lucia'
        WHEN 'MS' THEN 'Montserrat'
        WHEN 'SX' THEN 'Sint Maarten'
        WHEN 'TC' THEN 'Turks and Caicos Islands'
        WHEN 'VC' THEN 'Saint Vincent and the Grenadines'
        WHEN 'VG' THEN 'British Virgin Islands'
        ELSE lc.country
    END,
    COALESCE(lc.state, 'XX'),
    -- State/Province name mapping
    CASE 
        WHEN lc.country = 'US' AND lc.state IS NOT NULL THEN
            CASE lc.state
                -- All 50 US states + DC
                WHEN 'AL' THEN 'Alabama'
                WHEN 'AK' THEN 'Alaska'
                WHEN 'AZ' THEN 'Arizona'
                WHEN 'AR' THEN 'Arkansas'
                WHEN 'CA' THEN 'California'
                WHEN 'CO' THEN 'Colorado'
                WHEN 'CT' THEN 'Connecticut'
                WHEN 'DE' THEN 'Delaware'
                WHEN 'FL' THEN 'Florida'
                WHEN 'GA' THEN 'Georgia'
                WHEN 'HI' THEN 'Hawaii'
                WHEN 'ID' THEN 'Idaho'
                WHEN 'IL' THEN 'Illinois'
                WHEN 'IN' THEN 'Indiana'
                WHEN 'IA' THEN 'Iowa'
                WHEN 'KS' THEN 'Kansas'
                WHEN 'KY' THEN 'Kentucky'
                WHEN 'LA' THEN 'Louisiana'
                WHEN 'ME' THEN 'Maine'
                WHEN 'MD' THEN 'Maryland'
                WHEN 'MA' THEN 'Massachusetts'
                WHEN 'MI' THEN 'Michigan'
                WHEN 'MN' THEN 'Minnesota'
                WHEN 'MS' THEN 'Mississippi'
                WHEN 'MO' THEN 'Missouri'
                WHEN 'MT' THEN 'Montana'
                WHEN 'NE' THEN 'Nebraska'
                WHEN 'NV' THEN 'Nevada'
                WHEN 'NH' THEN 'New Hampshire'
                WHEN 'NJ' THEN 'New Jersey'
                WHEN 'NM' THEN 'New Mexico'
                WHEN 'NY' THEN 'New York'
                WHEN 'NC' THEN 'North Carolina'
                WHEN 'ND' THEN 'North Dakota'
                WHEN 'OH' THEN 'Ohio'
                WHEN 'OK' THEN 'Oklahoma'
                WHEN 'OR' THEN 'Oregon'
                WHEN 'PA' THEN 'Pennsylvania'
                WHEN 'RI' THEN 'Rhode Island'
                WHEN 'SC' THEN 'South Carolina'
                WHEN 'SD' THEN 'South Dakota'
                WHEN 'TN' THEN 'Tennessee'
                WHEN 'TX' THEN 'Texas'
                WHEN 'UT' THEN 'Utah'
                WHEN 'VT' THEN 'Vermont'
                WHEN 'VA' THEN 'Virginia'
                WHEN 'WA' THEN 'Washington'
                WHEN 'WV' THEN 'West Virginia'
                WHEN 'WI' THEN 'Wisconsin'
                WHEN 'WY' THEN 'Wyoming'
                WHEN 'DC' THEN 'District of Columbia'
                ELSE lc.state
            END
        WHEN lc.country = 'CA' AND lc.state IS NOT NULL THEN
            CASE lc.state
                WHEN 'AB' THEN 'Alberta'
                WHEN 'BC' THEN 'British Columbia'
                WHEN 'MB' THEN 'Manitoba'
                WHEN 'NB' THEN 'New Brunswick'
                WHEN 'NL' THEN 'Newfoundland and Labrador'
                WHEN 'NT' THEN 'Northwest Territories'
                WHEN 'NS' THEN 'Nova Scotia'
                WHEN 'NU' THEN 'Nunavut'
                WHEN 'ON' THEN 'Ontario'
                WHEN 'PE' THEN 'Prince Edward Island'
                WHEN 'QC' THEN 'Quebec'
                WHEN 'SK' THEN 'Saskatchewan'
                WHEN 'YT' THEN 'Yukon'
                ELSE lc.state
            END
        ELSE COALESCE(lc.state, 'Unknown')
    END,
    -- Region mapping
    CASE 
        WHEN lc.country IN ('US', 'CA') THEN 'North America'
        WHEN lc.country IN ('GU', 'AS', 'MP') THEN 'Pacific'
        ELSE 'Caribbean'
    END,
    -- Category mapping
    CASE lc.country
        WHEN 'US' THEN 'us-domestic'
        WHEN 'CA' THEN 'canadian'
        WHEN 'GU' THEN 'pacific'
        WHEN 'AS' THEN 'pacific'
        WHEN 'MP' THEN 'pacific'
        ELSE 'caribbean'
    END,
    'consolidated',
    1.00,
    'Consolidated from legacy lerg_codes table'
FROM public.lerg_codes lc
WHERE lc.npa NOT IN (
    SELECT npa FROM public.enhanced_lerg
)
ORDER BY lc.npa;

-- Step 3: Update any edge functions that reference lerg_codes
-- NOTE: You'll need to update these edge functions after this migration:
-- - get-lerg-data: Change FROM "lerg_codes" to FROM "enhanced_lerg"
-- - Any other functions using lerg_codes table

-- Step 4: Drop the redundant tables/views
DROP VIEW IF EXISTS public.enhanced_lerg_by_country CASCADE;
DROP VIEW IF EXISTS public.enhanced_lerg_stats CASCADE;

-- Step 5: Create a backup of lerg_codes before dropping (optional - comment out if not needed)
-- CREATE TABLE public.lerg_codes_backup_20250629 AS SELECT * FROM public.lerg_codes;

-- Step 6: Drop the legacy table
DROP TABLE IF EXISTS public.lerg_codes CASCADE;

-- Step 7: Final report
DO $$
DECLARE
    final_count INTEGER;
    profile_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO final_count FROM public.enhanced_lerg;
    SELECT COUNT(*) INTO profile_count FROM public.profiles;
    
    RAISE NOTICE '';
    RAISE NOTICE '=== CONSOLIDATION COMPLETE ===';
    RAISE NOTICE 'Enhanced LERG records: %', final_count;
    RAISE NOTICE 'User profiles: %', profile_count;
    RAISE NOTICE '';
    RAISE NOTICE 'Database now contains only:';
    RAISE NOTICE '- enhanced_lerg (NANP/LERG data)';
    RAISE NOTICE '- profiles (user authentication)';
    RAISE NOTICE '';
    RAISE NOTICE 'IMPORTANT: Update these edge functions to use enhanced_lerg:';
    RAISE NOTICE '- get-lerg-data';
    RAISE NOTICE '- Any other functions referencing lerg_codes';
END $$;

COMMIT;

-- Post-migration checklist:
-- [ ] Update get-lerg-data edge function to use enhanced_lerg
-- [ ] Update any client code referencing lerg_codes
-- [ ] Test NANP management in admin dashboard
-- [ ] Verify all NPAs are accessible