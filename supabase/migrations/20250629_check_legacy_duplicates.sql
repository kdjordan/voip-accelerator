-- Check for duplicate NPAs in legacy LERG table
-- This might explain why legacy shows 438 NPAs

-- Check if lerg_codes table has duplicates
SELECT 
  'Checking for duplicate NPAs in legacy lerg_codes table...' as status;

WITH duplicate_check AS (
  SELECT 
    npa,
    COUNT(*) as occurrences,
    STRING_AGG(DISTINCT state, ', ' ORDER BY state) as states,
    STRING_AGG(DISTINCT country, ', ' ORDER BY country) as countries
  FROM public.lerg_codes
  GROUP BY npa
  HAVING COUNT(*) > 1
)
SELECT 
  npa,
  occurrences,
  states,
  countries
FROM duplicate_check
ORDER BY occurrences DESC, npa;

-- Get total row count vs distinct NPA count
SELECT 
  COUNT(*) as total_rows,
  COUNT(DISTINCT npa) as distinct_npas,
  COUNT(*) - COUNT(DISTINCT npa) as duplicate_rows
FROM public.lerg_codes;

-- Show NPAs with multiple entries
SELECT 
  'NPAs with multiple state/country combinations:' as description;

SELECT 
  npa,
  state,
  country,
  COUNT(*) as count
FROM public.lerg_codes
WHERE npa IN (
  SELECT npa 
  FROM public.lerg_codes 
  GROUP BY npa 
  HAVING COUNT(*) > 1
)
GROUP BY npa, state, country
ORDER BY npa, country, state;

-- Check if the table might be using lerg_codes vs lerg (different table names)
SELECT 
  'Checking table names in the public schema:' as status;

SELECT 
  table_name,
  (xpath('/row/count/text()', xml_count))[1]::text::int AS row_count
FROM (
  SELECT 
    table_name,
    query_to_xml(format('SELECT COUNT(*) FROM %I.%I', table_schema, table_name), false, true, '') AS xml_count
  FROM information_schema.tables
  WHERE table_schema = 'public' 
    AND table_name IN ('lerg', 'lerg_codes', 'enhanced_lerg', 'lerg_backup')
) AS counts
ORDER BY table_name;