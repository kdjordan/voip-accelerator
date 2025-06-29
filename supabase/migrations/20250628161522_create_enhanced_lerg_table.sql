-- Migration: Create Enhanced LERG Table for Single Source of Truth
-- Description: Consolidates all NANP geographic data (US states, Canadian provinces, 
--              Caribbean/Pacific territories) into one authoritative table
-- Author: VoIP Accelerator Team
-- Date: 2025-06-28

BEGIN;

-- Create the enhanced LERG table with complete geographic context
CREATE TABLE IF NOT EXISTS public.enhanced_lerg (
    -- Primary identification
    npa VARCHAR(3) PRIMARY KEY,
    
    -- Country information
    country_code VARCHAR(2) NOT NULL,
    country_name VARCHAR(100) NOT NULL,
    
    -- State/Province information  
    state_province_code VARCHAR(2) NOT NULL,
    state_province_name VARCHAR(100) NOT NULL,
    
    -- Regional grouping
    region VARCHAR(50), -- e.g., 'Northeast', 'Atlantic', 'Caribbean'
    
    -- NANP categorization for billing protection
    category VARCHAR(20) NOT NULL CHECK (category IN ('us-domestic', 'canadian', 'caribbean', 'pacific')),
    
    -- Audit fields
    source VARCHAR(20) DEFAULT 'lerg' CHECK (source IN ('lerg', 'manual', 'import', 'seed', 'consolidated')),
    confidence_score DECIMAL(3,2) DEFAULT 1.00 CHECK (confidence_score >= 0 AND confidence_score <= 1),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Optional metadata
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    
    -- Constraints
    CONSTRAINT valid_npa CHECK (npa ~ '^[0-9]{3}$'),
    CONSTRAINT valid_country_code CHECK (country_code ~ '^[A-Z]{2}$'),
    CONSTRAINT valid_state_code CHECK (state_province_code ~ '^[A-Z]{2}$')
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_enhanced_lerg_country ON public.enhanced_lerg(country_code);
CREATE INDEX IF NOT EXISTS idx_enhanced_lerg_state ON public.enhanced_lerg(state_province_code);
CREATE INDEX IF NOT EXISTS idx_enhanced_lerg_category ON public.enhanced_lerg(category);
CREATE INDEX IF NOT EXISTS idx_enhanced_lerg_active ON public.enhanced_lerg(is_active) WHERE is_active = true;

-- Create update trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_enhanced_lerg_updated_at ON public.enhanced_lerg;
CREATE TRIGGER update_enhanced_lerg_updated_at 
    BEFORE UPDATE ON public.enhanced_lerg 
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create helpful views for common queries
CREATE OR REPLACE VIEW public.enhanced_lerg_stats AS
SELECT 
    category,
    COUNT(*) as npa_count,
    COUNT(DISTINCT country_code) as country_count,
    COUNT(DISTINCT state_province_code) as state_province_count
FROM public.enhanced_lerg
WHERE is_active = true
GROUP BY category;

CREATE OR REPLACE VIEW public.enhanced_lerg_by_country AS
SELECT 
    country_code,
    country_name,
    COUNT(*) as npa_count,
    STRING_AGG(DISTINCT category, ', ') as categories
FROM public.enhanced_lerg
WHERE is_active = true
GROUP BY country_code, country_name
ORDER BY country_name;

-- Function to get complete NPA info
CREATE OR REPLACE FUNCTION public.get_npa_info(p_npa VARCHAR(3))
RETURNS TABLE (
    npa VARCHAR(3),
    display_location TEXT,
    full_location TEXT,
    category VARCHAR(20),
    confidence_score DECIMAL(3,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        el.npa,
        el.state_province_name || ', ' || el.country_name AS display_location,
        el.state_province_name || ', ' || el.country_name || 
            ' (' || el.state_province_code || ', ' || el.country_code || ')' AS full_location,
        el.category,
        el.confidence_score
    FROM public.enhanced_lerg el
    WHERE el.npa = p_npa AND el.is_active = true;
END;
$$ LANGUAGE plpgsql;

-- Grant appropriate permissions
GRANT SELECT ON public.enhanced_lerg TO authenticated;
GRANT SELECT ON public.enhanced_lerg_stats TO authenticated;
GRANT SELECT ON public.enhanced_lerg_by_country TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_npa_info(VARCHAR) TO authenticated;

-- For admin users, grant full access
GRANT ALL ON public.enhanced_lerg TO service_role;

-- Add RLS (Row Level Security) policies if needed
ALTER TABLE public.enhanced_lerg ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to read
CREATE OR REPLACE POLICY "Allow authenticated read access" ON public.enhanced_lerg
    FOR SELECT
    TO authenticated
    USING (is_active = true);

-- Policy for service role to have full access
CREATE OR REPLACE POLICY "Allow service role full access" ON public.enhanced_lerg
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Add comment to table
COMMENT ON TABLE public.enhanced_lerg IS 'Enhanced LERG table serving as single source of truth for all NANP geographic data';
COMMENT ON COLUMN public.enhanced_lerg.npa IS 'North American Numbering Plan area code (3 digits)';
COMMENT ON COLUMN public.enhanced_lerg.category IS 'Billing category: us-domestic, canadian, caribbean, or pacific';
COMMENT ON COLUMN public.enhanced_lerg.confidence_score IS 'Data quality indicator: 1.00 = verified, lower = inferred or uncertain';

COMMIT;

-- Verification queries (run these after migration)
/*
-- Check table was created
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'enhanced_lerg'
);

-- Check indexes
SELECT indexname FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename = 'enhanced_lerg';

-- Check constraints
SELECT conname, contype 
FROM pg_constraint 
WHERE conrelid = 'public.enhanced_lerg'::regclass;
*/