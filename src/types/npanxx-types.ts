export interface USStandardizedData {
    npa: number;
    nxx: number;
    interRate: number;
    intraRate: number;
    ijRate: number;
  }
  
  export interface LergData {
    npanxx: number;
    name: string;
    npa: number;
    nxx: number;
  }
  
  export enum IndetermRateType {
    DEFAULT = 'default',
    INTER = 'inter',
    INTRA = 'intra',
  }