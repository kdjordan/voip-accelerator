CREATE TABLE IF NOT EXISTS special_area_codes (
  id SERIAL PRIMARY KEY,
  npa VARCHAR(3) NOT NULL UNIQUE,
  country VARCHAR(255) NOT NULL,
  province VARCHAR(255),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_special_area_codes_npa ON special_area_codes(npa); 