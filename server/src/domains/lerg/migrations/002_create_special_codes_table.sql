DROP TABLE IF EXISTS special_area_codes;

CREATE TABLE IF NOT EXISTS special_area_codes (
  id SERIAL PRIMARY KEY,
  npa CHARACTER(3) NOT NULL,
  country VARCHAR(100) NOT NULL,
  description TEXT,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_npa UNIQUE (npa)
);

CREATE INDEX IF NOT EXISTS idx_special_area_codes_npa ON special_area_codes(npa); 