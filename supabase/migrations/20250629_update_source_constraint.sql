-- Migration: Update Enhanced LERG Source Constraint
-- Description: Add 'consolidated' to allowed source values
-- Author: VoIP Accelerator Team
-- Date: 2025-06-29

BEGIN;

-- Drop the existing check constraint
ALTER TABLE public.enhanced_lerg 
DROP CONSTRAINT IF EXISTS enhanced_lerg_source_check;

-- Add the updated check constraint with 'consolidated' included
ALTER TABLE public.enhanced_lerg 
ADD CONSTRAINT enhanced_lerg_source_check 
CHECK (source IN ('lerg', 'manual', 'import', 'seed', 'consolidated'));

-- Verify the constraint was updated
DO $$
BEGIN
    RAISE NOTICE 'Enhanced LERG source constraint updated to allow: lerg, manual, import, seed, consolidated';
END $$;

COMMIT;