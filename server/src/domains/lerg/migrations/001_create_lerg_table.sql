CREATE TABLE IF NOT EXISTS lerg_codes (
  id SERIAL PRIMARY KEY,
  npa VARCHAR(3) NOT NULL,
  nxx VARCHAR(3) NOT NULL,
  lata VARCHAR(5),
  ocn VARCHAR(4),
  company VARCHAR(255),
  state VARCHAR(2),
  rate_center VARCHAR(100),
  switch_clli VARCHAR(11),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(npa, nxx)
);

CREATE INDEX idx_lerg_npanxx ON lerg_codes(npa, nxx); 