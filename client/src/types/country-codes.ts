export interface CountryMapping {
  name: string;
  region: string;
}

export const COUNTRY_CODES: Record<string, CountryMapping> = {
  AG: { name: 'Antigua and Barbuda', region: 'Caribbean' },
  AI: { name: 'Anguilla', region: 'Caribbean' },
  AS: { name: 'American Samoa', region: 'Pacific' },
  BB: { name: 'Barbados', region: 'Caribbean' },
  BM: { name: 'Bermuda', region: 'Caribbean' },
  BS: { name: 'Bahamas', region: 'Caribbean' },
  CA: { name: 'Canada', region: 'North America' },
  DM: { name: 'Dominica', region: 'Caribbean' },
  DO: { name: 'Dominican Republic', region: 'Caribbean' },
  GD: { name: 'Grenada', region: 'Caribbean' },
  GU: { name: 'Guam', region: 'Pacific' },
  JM: { name: 'Jamaica', region: 'Caribbean' },
  KN: { name: 'Saint Kitts and Nevis', region: 'Caribbean' },
  KY: { name: 'Cayman Islands', region: 'Caribbean' },
  LC: { name: 'Saint Lucia', region: 'Caribbean' },
  MP: { name: 'Northern Mariana Islands', region: 'Pacific' },
  MS: { name: 'Montserrat', region: 'Caribbean' },
  NN: { name: 'Non-Geographic', region: 'Special' },
  PR: { name: 'Puerto Rico', region: 'Caribbean' },
  TC: { name: 'Turks and Caicos Islands', region: 'Caribbean' },
  TT: { name: 'Trinidad and Tobago', region: 'Caribbean' },
  US: { name: 'United States', region: 'North America' },
  VC: { name: 'Saint Vincent and the Grenadines', region: 'Caribbean' },
  VG: { name: 'British Virgin Islands', region: 'Caribbean' },
  VI: { name: 'U.S. Virgin Islands', region: 'Caribbean' },
} as const;

export function getCountryName(code: string): string {
  return COUNTRY_CODES[code]?.name ?? code;
}

export function getCountryRegion(code: string): string {
  return COUNTRY_CODES[code]?.region ?? 'Unknown';
}
