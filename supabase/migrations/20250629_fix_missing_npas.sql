-- Migration: Fix Missing NPAs in Enhanced LERG Table
-- Description: Migrate missing NPAs from lerg_codes to enhanced_lerg
-- Issue: Original seeding migration looked for 'lerg' table but actual table is 'lerg_codes'
-- Author: VoIP Accelerator Team  
-- Date: 2025-06-29

BEGIN;

-- Step 1: Report current counts for verification
DO $$
DECLARE
    legacy_count INTEGER;
    enhanced_count INTEGER;
    missing_count INTEGER;
BEGIN
    -- Count legacy NPAs
    SELECT COUNT(*) INTO legacy_count FROM public.lerg_codes;
    
    -- Count enhanced NPAs  
    SELECT COUNT(*) INTO enhanced_count FROM public.enhanced_lerg;
    
    RAISE NOTICE 'Legacy lerg_codes count: %', legacy_count;
    RAISE NOTICE 'Enhanced lerg count: %', enhanced_count;
    RAISE NOTICE 'Difference: %', (legacy_count - enhanced_count);
END $$;

-- Step 2: Migrate missing NPAs from lerg_codes to enhanced_lerg
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
        ELSE lc.country
    END,
    COALESCE(lc.state, 'XX'),
    CASE 
        WHEN lc.country = 'US' AND lc.state IS NOT NULL THEN
            CASE lc.state
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
    CASE lc.country
        WHEN 'US' THEN 'North America'
        WHEN 'CA' THEN 'North America'
        ELSE 'International'
    END,
    CASE lc.country
        WHEN 'US' THEN 'us-domestic'
        WHEN 'CA' THEN 'canadian'
        WHEN 'BS' THEN 'caribbean'
        WHEN 'BB' THEN 'caribbean'
        WHEN 'JM' THEN 'caribbean'
        WHEN 'TT' THEN 'caribbean'
        WHEN 'DO' THEN 'caribbean'
        WHEN 'PR' THEN 'caribbean'
        WHEN 'VI' THEN 'caribbean'
        WHEN 'GU' THEN 'pacific'
        WHEN 'AS' THEN 'pacific'
        WHEN 'MP' THEN 'pacific'
        ELSE 'caribbean'
    END,
    'lerg_migration',
    1.00,
    'Migrated from legacy lerg_codes table'
FROM public.lerg_codes lc
WHERE lc.npa NOT IN (
    SELECT npa FROM public.enhanced_lerg
)
ORDER BY lc.npa;

-- Step 3: Report final counts
DO $$
DECLARE
    legacy_count INTEGER;
    enhanced_count INTEGER;
    migrated_count INTEGER;
BEGIN
    -- Count legacy NPAs
    SELECT COUNT(*) INTO legacy_count FROM public.lerg_codes;
    
    -- Count enhanced NPAs  
    SELECT COUNT(*) INTO enhanced_count FROM public.enhanced_lerg;
    
    -- Count migrated NPAs
    SELECT COUNT(*) INTO migrated_count FROM public.enhanced_lerg WHERE source = 'lerg_migration';
    
    RAISE NOTICE 'POST-MIGRATION REPORT:';
    RAISE NOTICE 'Legacy lerg_codes count: %', legacy_count;
    RAISE NOTICE 'Enhanced lerg count: %', enhanced_count;
    RAISE NOTICE 'Newly migrated NPAs: %', migrated_count;
    RAISE NOTICE 'Data parity achieved: %', CASE WHEN legacy_count = enhanced_count THEN 'YES' ELSE 'NO' END;
END $$;

COMMIT;