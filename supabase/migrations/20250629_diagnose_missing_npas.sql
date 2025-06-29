-- Diagnostic query to find missing NPAs between legacy and enhanced LERG systems
-- This query helps identify the 66 NPAs that appear in legacy LERG but not in enhanced LERG

-- First, let's count NPAs in both tables
DO $$
DECLARE
  legacy_count INTEGER;
  enhanced_count INTEGER;
  legacy_only_count INTEGER;
  enhanced_only_count INTEGER;
BEGIN
  -- Count legacy LERG NPAs
  SELECT COUNT(DISTINCT npa) INTO legacy_count FROM public.lerg_codes;
  
  -- Count enhanced LERG NPAs (active only)
  SELECT COUNT(DISTINCT npa) INTO enhanced_count FROM public.enhanced_lerg WHERE is_active = true;
  
  -- Count NPAs only in legacy
  SELECT COUNT(*) INTO legacy_only_count FROM (
    SELECT DISTINCT npa FROM public.lerg_codes
    EXCEPT
    SELECT DISTINCT npa FROM public.enhanced_lerg WHERE is_active = true
  ) AS legacy_only;
  
  -- Count NPAs only in enhanced
  SELECT COUNT(*) INTO enhanced_only_count FROM (
    SELECT DISTINCT npa FROM public.enhanced_lerg WHERE is_active = true
    EXCEPT
    SELECT DISTINCT npa FROM public.lerg_codes
  ) AS enhanced_only;
  
  RAISE NOTICE '==================================================';
  RAISE NOTICE 'NANP Data Discrepancy Analysis';
  RAISE NOTICE '==================================================';
  RAISE NOTICE 'Legacy LERG total NPAs: %', legacy_count;
  RAISE NOTICE 'Enhanced LERG total NPAs: %', enhanced_count;
  RAISE NOTICE 'Difference: % NPAs', legacy_count - enhanced_count;
  RAISE NOTICE '--------------------------------------------------';
  RAISE NOTICE 'NPAs only in Legacy: %', legacy_only_count;
  RAISE NOTICE 'NPAs only in Enhanced: %', enhanced_only_count;
  RAISE NOTICE '==================================================';
END $$;

-- Show NPAs that exist in legacy but not in enhanced
RAISE NOTICE 'NPAs in Legacy LERG but NOT in Enhanced LERG:';
RAISE NOTICE '----------------------------------------------';

WITH legacy_only AS (
  SELECT DISTINCT l.npa, l.state, l.country
  FROM public.lerg_codes l
  WHERE NOT EXISTS (
    SELECT 1 FROM public.enhanced_lerg e 
    WHERE e.npa = l.npa AND e.is_active = true
  )
  ORDER BY l.npa
)
SELECT 
  npa,
  state,
  country,
  CASE 
    WHEN country = 'US' THEN 'United States'
    WHEN country = 'CA' THEN 'Canada'
    ELSE country
  END as country_name
FROM legacy_only;

-- Show summary by country
RAISE NOTICE '';
RAISE NOTICE 'Summary of missing NPAs by country:';
RAISE NOTICE '-----------------------------------';

WITH legacy_only AS (
  SELECT DISTINCT l.npa, l.state, l.country
  FROM public.lerg_codes l
  WHERE NOT EXISTS (
    SELECT 1 FROM public.enhanced_lerg e 
    WHERE e.npa = l.npa AND e.is_active = true
  )
)
SELECT 
  country,
  COUNT(*) as missing_count,
  STRING_AGG(npa, ', ' ORDER BY npa) as missing_npas
FROM legacy_only
GROUP BY country
ORDER BY missing_count DESC;

-- Now let's insert the missing NPAs into enhanced_lerg
RAISE NOTICE '';
RAISE NOTICE 'Inserting missing NPAs into enhanced_lerg...';

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
  l.npa,
  l.country as country_code,
  CASE l.country
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
    ELSE l.country
  END as country_name,
  l.state as state_province_code,
  CASE
    -- US States
    WHEN l.country = 'US' AND l.state = 'AL' THEN 'Alabama'
    WHEN l.country = 'US' AND l.state = 'AK' THEN 'Alaska'
    WHEN l.country = 'US' AND l.state = 'AZ' THEN 'Arizona'
    WHEN l.country = 'US' AND l.state = 'AR' THEN 'Arkansas'
    WHEN l.country = 'US' AND l.state = 'CA' THEN 'California'
    WHEN l.country = 'US' AND l.state = 'CO' THEN 'Colorado'
    WHEN l.country = 'US' AND l.state = 'CT' THEN 'Connecticut'
    WHEN l.country = 'US' AND l.state = 'DE' THEN 'Delaware'
    WHEN l.country = 'US' AND l.state = 'DC' THEN 'District of Columbia'
    WHEN l.country = 'US' AND l.state = 'FL' THEN 'Florida'
    WHEN l.country = 'US' AND l.state = 'GA' THEN 'Georgia'
    WHEN l.country = 'US' AND l.state = 'HI' THEN 'Hawaii'
    WHEN l.country = 'US' AND l.state = 'ID' THEN 'Idaho'
    WHEN l.country = 'US' AND l.state = 'IL' THEN 'Illinois'
    WHEN l.country = 'US' AND l.state = 'IN' THEN 'Indiana'
    WHEN l.country = 'US' AND l.state = 'IA' THEN 'Iowa'
    WHEN l.country = 'US' AND l.state = 'KS' THEN 'Kansas'
    WHEN l.country = 'US' AND l.state = 'KY' THEN 'Kentucky'
    WHEN l.country = 'US' AND l.state = 'LA' THEN 'Louisiana'
    WHEN l.country = 'US' AND l.state = 'ME' THEN 'Maine'
    WHEN l.country = 'US' AND l.state = 'MD' THEN 'Maryland'
    WHEN l.country = 'US' AND l.state = 'MA' THEN 'Massachusetts'
    WHEN l.country = 'US' AND l.state = 'MI' THEN 'Michigan'
    WHEN l.country = 'US' AND l.state = 'MN' THEN 'Minnesota'
    WHEN l.country = 'US' AND l.state = 'MS' THEN 'Mississippi'
    WHEN l.country = 'US' AND l.state = 'MO' THEN 'Missouri'
    WHEN l.country = 'US' AND l.state = 'MT' THEN 'Montana'
    WHEN l.country = 'US' AND l.state = 'NE' THEN 'Nebraska'
    WHEN l.country = 'US' AND l.state = 'NV' THEN 'Nevada'
    WHEN l.country = 'US' AND l.state = 'NH' THEN 'New Hampshire'
    WHEN l.country = 'US' AND l.state = 'NJ' THEN 'New Jersey'
    WHEN l.country = 'US' AND l.state = 'NM' THEN 'New Mexico'
    WHEN l.country = 'US' AND l.state = 'NY' THEN 'New York'
    WHEN l.country = 'US' AND l.state = 'NC' THEN 'North Carolina'
    WHEN l.country = 'US' AND l.state = 'ND' THEN 'North Dakota'
    WHEN l.country = 'US' AND l.state = 'OH' THEN 'Ohio'
    WHEN l.country = 'US' AND l.state = 'OK' THEN 'Oklahoma'
    WHEN l.country = 'US' AND l.state = 'OR' THEN 'Oregon'
    WHEN l.country = 'US' AND l.state = 'PA' THEN 'Pennsylvania'
    WHEN l.country = 'US' AND l.state = 'RI' THEN 'Rhode Island'
    WHEN l.country = 'US' AND l.state = 'SC' THEN 'South Carolina'
    WHEN l.country = 'US' AND l.state = 'SD' THEN 'South Dakota'
    WHEN l.country = 'US' AND l.state = 'TN' THEN 'Tennessee'
    WHEN l.country = 'US' AND l.state = 'TX' THEN 'Texas'
    WHEN l.country = 'US' AND l.state = 'UT' THEN 'Utah'
    WHEN l.country = 'US' AND l.state = 'VT' THEN 'Vermont'
    WHEN l.country = 'US' AND l.state = 'VA' THEN 'Virginia'
    WHEN l.country = 'US' AND l.state = 'WA' THEN 'Washington'
    WHEN l.country = 'US' AND l.state = 'WV' THEN 'West Virginia'
    WHEN l.country = 'US' AND l.state = 'WI' THEN 'Wisconsin'
    WHEN l.country = 'US' AND l.state = 'WY' THEN 'Wyoming'
    -- Canadian Provinces
    WHEN l.country = 'CA' AND l.state = 'AB' THEN 'Alberta'
    WHEN l.country = 'CA' AND l.state = 'BC' THEN 'British Columbia'
    WHEN l.country = 'CA' AND l.state = 'MB' THEN 'Manitoba'
    WHEN l.country = 'CA' AND l.state = 'NB' THEN 'New Brunswick'
    WHEN l.country = 'CA' AND l.state = 'NL' THEN 'Newfoundland and Labrador'
    WHEN l.country = 'CA' AND l.state = 'NS' THEN 'Nova Scotia'
    WHEN l.country = 'CA' AND l.state = 'NT' THEN 'Northwest Territories'
    WHEN l.country = 'CA' AND l.state = 'NU' THEN 'Nunavut'
    WHEN l.country = 'CA' AND l.state = 'ON' THEN 'Ontario'
    WHEN l.country = 'CA' AND l.state = 'PE' THEN 'Prince Edward Island'
    WHEN l.country = 'CA' AND l.state = 'QC' THEN 'Quebec'
    WHEN l.country = 'CA' AND l.state = 'SK' THEN 'Saskatchewan'
    WHEN l.country = 'CA' AND l.state = 'YT' THEN 'Yukon'
    ELSE l.state
  END as state_province_name,
  CASE
    -- US Regions
    WHEN l.country = 'US' AND l.state IN ('ME', 'NH', 'VT', 'MA', 'CT', 'RI', 'NY', 'NJ', 'PA', 'MD', 'DE', 'DC') THEN 'Northeast'
    WHEN l.country = 'US' AND l.state IN ('AL', 'AR', 'FL', 'GA', 'KY', 'LA', 'MS', 'NC', 'OK', 'SC', 'TN', 'TX', 'VA', 'WV') THEN 'South'
    WHEN l.country = 'US' AND l.state IN ('IL', 'IN', 'IA', 'KS', 'MI', 'MN', 'MO', 'NE', 'ND', 'OH', 'SD', 'WI') THEN 'Midwest'
    WHEN l.country = 'US' AND l.state IN ('AK', 'AZ', 'CA', 'CO', 'HI', 'ID', 'MT', 'NV', 'NM', 'OR', 'UT', 'WA', 'WY') THEN 'West'
    -- Canadian Regions
    WHEN l.country = 'CA' AND l.state IN ('AB', 'BC') THEN 'Western'
    WHEN l.country = 'CA' AND l.state IN ('MB', 'SK') THEN 'Prairie'
    WHEN l.country = 'CA' AND l.state IN ('ON', 'QC') THEN 'Central'
    WHEN l.country = 'CA' AND l.state IN ('NB', 'NL', 'NS', 'PE') THEN 'Atlantic'
    WHEN l.country = 'CA' AND l.state IN ('NT', 'NU', 'YT') THEN 'Northern'
    -- Others
    WHEN l.country IN ('BS', 'BB', 'JM', 'TT', 'DO', 'PR', 'VI', 'KY', 'VG', 'AI', 'AG', 'GD', 'TC', 'MS', 'SX', 'LC', 'DM', 'VC', 'KN') THEN 'Caribbean'
    WHEN l.country IN ('AS', 'GU', 'MP') THEN 'Pacific'
    ELSE 'Unknown'
  END as region,
  CASE 
    WHEN l.country = 'US' THEN 'us-domestic'
    WHEN l.country = 'CA' THEN 'canadian'
    WHEN l.country IN ('AS', 'GU', 'MP') THEN 'pacific'
    ELSE 'caribbean'
  END as category,
  'legacy-migration' as source,
  0.95 as confidence_score, -- High confidence since it's from the existing LERG
  'Migrated from legacy LERG table during discrepancy resolution' as notes
FROM public.lerg_codes l
WHERE NOT EXISTS (
  SELECT 1 FROM public.enhanced_lerg e 
  WHERE e.npa = l.npa AND e.is_active = true
)
ON CONFLICT (npa) DO UPDATE SET
  is_active = true,
  updated_at = CURRENT_TIMESTAMP,
  notes = CONCAT(enhanced_lerg.notes, ' | Reactivated from legacy LERG on ', CURRENT_DATE);

-- Final verification
DO $$
DECLARE
  final_legacy_count INTEGER;
  final_enhanced_count INTEGER;
  newly_added INTEGER;
BEGIN
  -- Count after migration
  SELECT COUNT(DISTINCT npa) INTO final_legacy_count FROM public.lerg_codes;
  SELECT COUNT(DISTINCT npa) INTO final_enhanced_count FROM public.enhanced_lerg WHERE is_active = true;
  
  SELECT COUNT(*) INTO newly_added FROM public.enhanced_lerg 
  WHERE source = 'legacy-migration' 
    AND created_at >= CURRENT_TIMESTAMP - INTERVAL '1 minute';
  
  RAISE NOTICE '';
  RAISE NOTICE '==================================================';
  RAISE NOTICE 'Migration Complete!';
  RAISE NOTICE '==================================================';
  RAISE NOTICE 'Legacy LERG NPAs: %', final_legacy_count;
  RAISE NOTICE 'Enhanced LERG NPAs: %', final_enhanced_count;
  RAISE NOTICE 'Newly added NPAs: %', newly_added;
  RAISE NOTICE 'Remaining difference: %', final_legacy_count - final_enhanced_count;
  RAISE NOTICE '==================================================';
END $$;