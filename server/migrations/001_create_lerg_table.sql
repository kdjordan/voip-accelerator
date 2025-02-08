DROP TABLE IF EXISTS lerg_codes;
CREATE TABLE IF NOT EXISTS lerg_codes (
  id SERIAL PRIMARY KEY,
  npa CHAR(3) NOT NULL,
  state CHAR(2) NOT NULL,
  country CHAR(2) NOT NULL,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT lerg_codes_npa_unique UNIQUE (npa)
);

CREATE INDEX IF NOT EXISTS idx_lerg_country ON lerg_codes(country);
CREATE INDEX IF NOT EXISTS idx_lerg_state ON lerg_codes(state); 