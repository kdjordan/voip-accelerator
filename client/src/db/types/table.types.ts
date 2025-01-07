import type { BaseEntity } from './entity.types';
import type { AZStandardizedData } from '@/domains/az/types/az-types';
import type { USStandardizedData } from '@/domains/us/types/us-types';
import type { LERGRecord } from '@/domains/lerg/types';

export interface AZTable extends BaseEntity, AZStandardizedData {}
export interface USTable extends BaseEntity, USStandardizedData {}
export interface LERGTable extends BaseEntity, LERGRecord {}
export interface CacheTable extends BaseEntity {
  key: string;
  value: unknown;
  expiresAt: Date;
}

export interface DatabaseTables {
  az: AZTable;
  us: USTable;
  lerg: LERGTable;
  cache: CacheTable;
}

export type TableNames = keyof DatabaseTables;
