export const COUNTRY_NAMES: Record<string, string> = {
  'AG': 'Antigua and Barbuda',
  'AI': 'Anguilla',
  'BB': 'Barbados',
  'BM': 'Bermuda',
  'BS': 'Bahamas',
  'CA': 'Canada',
  'DM': 'Dominica',
  'DO': 'Dominican Republic',
  'GD': 'Grenada',
  'JM': 'Jamaica',
  'KN': 'Saint Kitts and Nevis',
  'KY': 'Cayman Islands',
  'LC': 'Saint Lucia',
  'TC': 'Turks and Caicos Islands',
  'TT': 'Trinidad and Tobago',
  'US': 'United States',
  'VC': 'Saint Vincent and the Grenadines',
  'VG': 'British Virgin Islands',
};

export function getCountryName(code: string): string {
  return COUNTRY_NAMES[code] || code;
} 