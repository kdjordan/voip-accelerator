import { db } from '@/db';
import type { AZTable } from '@/db/types';
import type { AZStandardizedData } from '../types/az-types';

export const azDbService = {
  /**
   * Store AZ data in the database
   */
  async store(data: Omit<AZStandardizedData, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<void> {
    try {
      await db.az.bulkPut(data);
      console.info(`[AZ DB] Successfully stored ${data.length} records`);
    } catch (error) {
      console.error('[AZ DB] Error storing data:', error);
      throw error;
    }
  },

  /**
   * Get all AZ records
   */
  async getAll(): Promise<AZTable[]> {
    try {
      return await db.az.toArray();
    } catch (error) {
      console.error('[AZ DB] Error fetching all records:', error);
      throw error;
    }
  },

  /**
   * Get AZ records by dial code
   */
  async getByDialCode(dialCode: string): Promise<AZTable[]> {
    try {
      return await db.az.where('dialCode').equals(dialCode).toArray();
    } catch (error) {
      console.error('[AZ DB] Error fetching by dial code:', error);
      throw error;
    }
  },

  /**
   * Clear all AZ records
   */
  async clear(): Promise<void> {
    try {
      await db.az.clear();
      console.info('[AZ DB] Successfully cleared all records');
    } catch (error) {
      console.error('[AZ DB] Error clearing records:', error);
      throw error;
    }
  },

  /**
   * Get record count
   */
  async count(): Promise<number> {
    try {
      return await db.az.count();
    } catch (error) {
      console.error('[AZ DB] Error getting count:', error);
      throw error;
    }
  },
};
