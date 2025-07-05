-- Fix Pacific region NPA categorization
-- NPAs 670, 671, 684 should be 'pacific' not 'us-domestic'

UPDATE enhanced_lerg 
SET 
  category = 'pacific',
  updated_at = NOW(),
  notes = COALESCE(notes, '') || ' - Updated to Pacific category via admin fix'
WHERE npa IN ('670', '671', '684') 
  AND category = 'us-domestic';

-- Verify the updates
SELECT npa, country_code, state_province_code, category, country_name 
FROM enhanced_lerg 
WHERE npa IN ('670', '671', '684')
ORDER BY npa;