-- Drop existing table
DROP TABLE IF EXISTS lerg_codes;

-- Recreate with new structure
CREATE TABLE lerg_codes (
    npanxx CHAR(6) GENERATED ALWAYS AS (npa || nxx) STORED,
    npa CHAR(3) NOT NULL,
    nxx CHAR(3) NOT NULL,
    state CHAR(2) NOT NULL,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    -- Make npanxx the primary key
    CONSTRAINT pk_lerg_codes_npanxx PRIMARY KEY (npanxx)
);

-- Add any additional indexes we need
CREATE INDEX IF NOT EXISTS idx_lerg_state ON lerg_codes(state); 