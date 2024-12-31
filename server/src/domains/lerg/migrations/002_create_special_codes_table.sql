CREATE TABLE IF NOT EXISTS special_area_codes (
  id SERIAL PRIMARY KEY,
  npa CHARACTER(3) NOT NULL,
  country VARCHAR(100) NOT NULL,
  province_or_territory VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_npa UNIQUE (npa)
);

CREATE INDEX IF NOT EXISTS idx_special_area_codes_npa ON special_area_codes(npa); 