export interface ProvinceMapping {
  name: string;
  region: string;
}

export const PROVINCE_CODES: Record<string, ProvinceMapping> = {
  AB: { name: 'Alberta', region: 'Western' },
  BC: { name: 'British Columbia', region: 'Western' },
  MB: { name: 'Manitoba', region: 'Prairie' },
  NB: { name: 'New Brunswick', region: 'Atlantic' },
  NL: { name: 'Newfoundland and Labrador', region: 'Atlantic' },
  NS: { name: 'Nova Scotia', region: 'Atlantic' },
  NT: { name: 'Northwest Territories', region: 'Northern' },
  NU: { name: 'Nunavut', region: 'Northern' },
  ON: { name: 'Ontario', region: 'Central' },
  PE: { name: 'Prince Edward Island', region: 'Atlantic' },
  QC: { name: 'Quebec', region: 'Central' },
  SK: { name: 'Saskatchewan', region: 'Prairie' },
  YT: { name: 'Yukon', region: 'Northern' }
} as const;

export function getProvinceName(code: string): string {
  return PROVINCE_CODES[code]?.name ?? code;
}

export function getProvinceRegion(code: string): string {
  return PROVINCE_CODES[code]?.region ?? 'Unknown';
} 