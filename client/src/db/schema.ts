import type { TableNames } from './types';

export const DB_NAME = 'VoipAcceleratorDB';
export const DB_VERSION = 1;

export const SCHEMA_DEFINITION: Record<TableNames, string> = {
  az: '++id, dialCode, destName, createdAt, updatedAt',
  us: '++id, npa, nxx, createdAt, updatedAt',
  lerg: '++id, npanxx, name, createdAt, updatedAt',
  cache: '++id, key, expiresAt, createdAt, updatedAt',
};

export const INDEXES: Partial<Record<TableNames, string[]>> = {
  az: ['dialCode', 'destName'],
  us: ['npa', 'nxx'],
  lerg: ['npanxx'],
  cache: ['key', 'expiresAt'],
};
