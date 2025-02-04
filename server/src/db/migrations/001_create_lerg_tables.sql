DROP TABLE IF EXISTS lerg_codes;

CREATE TABLE lerg_codes (
    npa character(3) NOT NULL,
    nxx character(3) NOT NULL,
    npanxx character(6) GENERATED ALWAYS AS (npa || nxx) STORED PRIMARY KEY,
    state character(2) NOT NULL,
    last_updated timestamp with time zone DEFAULT CURRENT_TIMESTAMP
); 