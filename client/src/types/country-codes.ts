export interface CountryMapping {
  name: string;
  region: string;
}

export const COUNTRY_CODES: Record<string, CountryMapping> = {
  'AG': { name: 'Antigua and Barbuda', region: 'Caribbean' },
  'AI': { name: 'Anguilla', region: 'Caribbean' },
  'BB': { name: 'Barbados', region: 'Caribbean' },
  'BM': { name: 'Bermuda', region: 'Caribbean' },
  'CA': { name: 'Canada', region: 'North America' },
  'GD': { name: 'Grenada', region: 'Caribbean' },
  'KY': { name: 'Cayman Islands', region: 'Caribbean' },
  'MS': { name: 'Montserrat', region: 'Caribbean' },
  'TC': { name: 'Turks and Caicos Islands', region: 'Caribbean' },
  'US': { name: 'United States', region: 'North America' },
  'VG': { name: 'British Virgin Islands', region: 'Caribbean' }
} as const;

export function getCountryName(code: string): string {
  return COUNTRY_CODES[code]?.name ?? code;
}

export function getCountryRegion(code: string): string {
  return COUNTRY_CODES[code]?.region ?? 'Unknown';
} 