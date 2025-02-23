// Replace enum with const map for better type safety
export const DBName = {
    AZ: 'az_rate_deck_db',
    US: 'us_rate_deck_db',
    LERG: 'lerg_db',
    RATE_SHEET: 'rate_sheet_db',
};
// Add shared report types
export const ReportTypes = {
    FILES: 'files',
    CODE: 'code',
    PRICING: 'pricing',
};
export const DBSchemas = {
    [DBName.AZ]: '++id, destName, dialCode, rate',
    [DBName.US]: '++id, npa, nxx, npanxx, interRate, intraRate, indetermRate, *npanxxIdx',
    [DBName.RATE_SHEET]: '++id, destinationName, code, rate, effectiveDate, minDuration, increments',
    [DBName.LERG]: 'npa, *state, *country',
};
// Type guard to check if a DBNameType is supported for schemas
export function isSchemaSupported(dbName) {
    return dbName === DBName.AZ || dbName === DBName.US || dbName === DBName.RATE_SHEET || dbName === DBName.LERG;
}
