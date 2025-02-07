DROP TABLE IF EXISTS lerg_codes;
CREATE TABLE IF NOT EXISTS lerg_codes (
  id SERIAL PRIMARY KEY,
  npa CHAR(3) NOT NULL,
  nxx CHAR(3) NOT NULL,
  npanxx CHAR(6) GENERATED ALWAYS AS (npa || nxx) STORED UNIQUE,
  state CHAR(2) NOT NULL,
  country CHAR(2) NOT NULL,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_lerg_npanxx ON lerg_codes(npanxx);
CREATE INDEX IF NOT EXISTS idx_lerg_country ON lerg_codes(country); 