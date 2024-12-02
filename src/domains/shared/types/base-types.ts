export interface BaseStandardizedData {
    id?: number;
  }
  
  // Replace enum with const map for better type safety
  export const DBName = {
    AZ: 'az',
    US: 'us',
    CAN: 'can',
    USCodes: 'USCodes'
  } as const;
  
  export type DBNameType = typeof DBName[keyof typeof DBName];
  
  // Add shared report types
  export const ReportTypes = {
    FILES: 'files',
    CODE: 'code',
    PRICING: 'pricing'
  } as const;
  
  export type ReportType = typeof ReportTypes[keyof typeof ReportTypes];