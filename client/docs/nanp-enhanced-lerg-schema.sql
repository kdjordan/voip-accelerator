-- Enhanced LERG Schema for Single Source of Truth
-- This schema consolidates all NANP geographic data into one authoritative table

-- Drop existing table if needed (for development only)
-- DROP TABLE IF EXISTS enhanced_lerg;

-- Create the enhanced LERG table with complete geographic context
CREATE TABLE enhanced_lerg (
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
    source VARCHAR(20) DEFAULT 'lerg' CHECK (source IN ('lerg', 'manual', 'import', 'seed')),
    confidence_score DECIMAL(3,2) DEFAULT 1.00, -- 0.00 to 1.00
    
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
CREATE INDEX idx_enhanced_lerg_country ON enhanced_lerg(country_code);
CREATE INDEX idx_enhanced_lerg_state ON enhanced_lerg(state_province_code);
CREATE INDEX idx_enhanced_lerg_category ON enhanced_lerg(category);
CREATE INDEX idx_enhanced_lerg_active ON enhanced_lerg(is_active) WHERE is_active = true;

-- Create update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_enhanced_lerg_updated_at 
    BEFORE UPDATE ON enhanced_lerg 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Sample data for testing (a few examples)
/*
INSERT INTO enhanced_lerg (npa, country_code, country_name, state_province_code, state_province_name, region, category) VALUES
-- US Examples
('212', 'US', 'United States', 'NY', 'New York', 'Northeast', 'us-domestic'),
('213', 'US', 'United States', 'CA', 'California', 'West', 'us-domestic'),
('305', 'US', 'United States', 'FL', 'Florida', 'South', 'us-domestic'),

-- Canadian Examples (including the missing 438!)
('416', 'CA', 'Canada', 'ON', 'Ontario', 'Central', 'canadian'),
('438', 'CA', 'Canada', 'QC', 'Quebec', 'Central', 'canadian'),
('450', 'CA', 'Canada', 'QC', 'Quebec', 'Central', 'canadian'),
('604', 'CA', 'Canada', 'BC', 'British Columbia', 'Western', 'canadian'),

-- Caribbean Examples
('242', 'BS', 'Bahamas', 'BS', 'Bahamas', 'Caribbean', 'caribbean'),
('246', 'BB', 'Barbados', 'BB', 'Barbados', 'Caribbean', 'caribbean'),
('876', 'JM', 'Jamaica', 'JM', 'Jamaica', 'Caribbean', 'caribbean'),

-- Pacific Examples
('671', 'GU', 'Guam', 'GU', 'Guam', 'Pacific', 'pacific'),
('670', 'MP', 'Northern Mariana Islands', 'MP', 'Northern Mariana Islands', 'Pacific', 'pacific'),
('684', 'AS', 'American Samoa', 'AS', 'American Samoa', 'Pacific', 'pacific');
*/

-- Helpful views for common queries
CREATE OR REPLACE VIEW enhanced_lerg_stats AS
SELECT 
    category,
    COUNT(*) as npa_count,
    COUNT(DISTINCT country_code) as country_count,
    COUNT(DISTINCT state_province_code) as state_province_count
FROM enhanced_lerg
WHERE is_active = true
GROUP BY category;

CREATE OR REPLACE VIEW enhanced_lerg_by_country AS
SELECT 
    country_code,
    country_name,
    COUNT(*) as npa_count,
    STRING_AGG(DISTINCT category, ', ') as categories
FROM enhanced_lerg
WHERE is_active = true
GROUP BY country_code, country_name
ORDER BY country_name;

-- Function to get complete NPA info
CREATE OR REPLACE FUNCTION get_npa_info(p_npa VARCHAR(3))
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
    FROM enhanced_lerg el
    WHERE el.npa = p_npa AND el.is_active = true;
END;
$$ LANGUAGE plpgsql;