export interface USExportFilters {
  states: string[];
  excludeStates: boolean;
  npanxxSearch: string;
  metroAreas: string[];
  countries: string[];
  excludeCountries: boolean;
  rateTypes?: string[];
}

export interface USExportFormatOptions {
  npanxxFormat: 'combined' | 'split';
  includeCountryCode: boolean;
  includeStateColumn: boolean;
  includeCountryColumn: boolean;
  selectedCountries: string[];
  excludeCountries: boolean;
}

export interface USExportPreviewRow {
  [key: string]: string | number | null;
}