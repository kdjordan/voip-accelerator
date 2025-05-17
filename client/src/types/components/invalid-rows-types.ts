export interface InvalidRowEntry {
  rowNumber: number | string;
  name: string; // Corresponds to 'destinationName' in AZ, or 'reason' in US
  identifier: string; // Corresponds to 'prefix' in AZ, or 'npanxx' in US
  problemValue: string | number; // Corresponds to 'invalidRate' in AZ. For US, needs mapping.
}
