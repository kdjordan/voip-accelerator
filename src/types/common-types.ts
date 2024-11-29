export enum DBName {
    AZ = 'az',
    US = 'us',
    CAN = 'can',
    USCodes = 'USCodes',
  }
  
  export interface ColumnRolesEvent {
    columnRoles: string[];
    startLine: number;
    deckType: DBName.AZ | DBName.US;
    indetermRateType?: IndetermRateType;
  }
  
  export type StandardizedData = AZStandardizedData | USStandardizedData;
  
  export interface FileEmit {
    file: File;
    data: StandardizedData[];
  }
  
  export interface ParsedResults {
    data: string[][];
  }
  
  export const ReportState = {
    FILES: 'files',
    CODE: 'code',
    PRICING: 'pricing',
  } as const;
  
  export type ReportStateType = (typeof ReportState)[keyof typeof ReportState];