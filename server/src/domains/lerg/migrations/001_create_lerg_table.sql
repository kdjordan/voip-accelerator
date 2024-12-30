CREATE TABLE IF NOT EXISTS lerg_codes (
  id SERIAL PRIMARY KEY,
  npa VARCHAR(3) NOT NULL,
  nxx VARCHAR(3) NOT NULL,
  npanxx VARCHAR(6) NOT NULL,
  lata VARCHAR(5),
  ocn VARCHAR(4),
  company VARCHAR(255),
  state VARCHAR(2) NOT NULL,
  rate_center VARCHAR(255),
  switch_clli VARCHAR(11),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(npa, nxx)
);

CREATE INDEX IF NOT EXISTS idx_lerg_npanxx ON lerg_codes(npanxx); 