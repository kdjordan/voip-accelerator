import { PROVINCE_CODES } from '@/types/province-codes';

export interface StateMapping {
  name: string;
  region: string;
}

export const STATE_CODES: Record<string, StateMapping> = {
  AL: { name: 'Alabama', region: 'South' },
  AK: { name: 'Alaska', region: 'West' },
  AZ: { name: 'Arizona', region: 'West' },
  AR: { name: 'Arkansas', region: 'South' },
  CA: { name: 'California', region: 'West' },
  CO: { name: 'Colorado', region: 'West' },
  CT: { name: 'Connecticut', region: 'Northeast' },
  DE: { name: 'Delaware', region: 'Northeast' },
  FL: { name: 'Florida', region: 'South' },
  GA: { name: 'Georgia', region: 'South' },
  HI: { name: 'Hawaii', region: 'West' },
  ID: { name: 'Idaho', region: 'West' },
  IL: { name: 'Illinois', region: 'Midwest' },
  IN: { name: 'Indiana', region: 'Midwest' },
  IA: { name: 'Iowa', region: 'Midwest' },
  KS: { name: 'Kansas', region: 'Midwest' },
  KY: { name: 'Kentucky', region: 'South' },
  LA: { name: 'Louisiana', region: 'South' },
  ME: { name: 'Maine', region: 'Northeast' },
  MD: { name: 'Maryland', region: 'Northeast' },
  MA: { name: 'Massachusetts', region: 'Northeast' },
  MI: { name: 'Michigan', region: 'Midwest' },
  MN: { name: 'Minnesota', region: 'Midwest' },
  MS: { name: 'Mississippi', region: 'South' },
  MO: { name: 'Missouri', region: 'Midwest' },
  MT: { name: 'Montana', region: 'West' },
  NE: { name: 'Nebraska', region: 'Midwest' },
  NV: { name: 'Nevada', region: 'West' },
  NH: { name: 'New Hampshire', region: 'Northeast' },
  NJ: { name: 'New Jersey', region: 'Northeast' },
  NM: { name: 'New Mexico', region: 'West' },
  NY: { name: 'New York', region: 'Northeast' },
  NC: { name: 'North Carolina', region: 'South' },
  ND: { name: 'North Dakota', region: 'Midwest' },
  OH: { name: 'Ohio', region: 'Midwest' },
  OK: { name: 'Oklahoma', region: 'South' },
  OR: { name: 'Oregon', region: 'West' },
  PA: { name: 'Pennsylvania', region: 'Northeast' },
  RI: { name: 'Rhode Island', region: 'Northeast' },
  SC: { name: 'South Carolina', region: 'South' },
  SD: { name: 'South Dakota', region: 'Midwest' },
  TN: { name: 'Tennessee', region: 'South' },
  TX: { name: 'Texas', region: 'South' },
  UT: { name: 'Utah', region: 'West' },
  VT: { name: 'Vermont', region: 'Northeast' },
  VA: { name: 'Virginia', region: 'South' },
  WA: { name: 'Washington', region: 'West' },
  WV: { name: 'West Virginia', region: 'South' },
  WI: { name: 'Wisconsin', region: 'Midwest' },
  WY: { name: 'Wyoming', region: 'West' },
  DC: { name: 'District of Columbia', region: 'Northeast' },
} as const;

export function getStateName(code: string, country?: string): string {
  if (country === 'CA') {
    return PROVINCE_CODES[code]?.name ?? code;
  }
  return STATE_CODES[code]?.name ?? code;
}

export function getStateRegion(code: string): string {
  return STATE_CODES[code]?.region ?? 'Unknown';
}
