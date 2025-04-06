/**
 * Database Migration Utility
 *
 * Provides functions to consolidate duplicate tables and clean up the database structure.
 */

import useDexieDB from '@/composables/useDexieDB';
import { DBName } from '@/types/app-types';

/**
 * Standard table names that should be preserved
 */
const STANDARD_TABLES = {
  US: 'us_codes',
  AZ: 'az_codes',
  LERG: 'lerg',
};

/**
 * Consolidate all US code tables into a single standard table
 * @returns Statistics about the consolidation process
 */
export async function consolidateUSTables() {
  const { consolidateData, cleanupDuplicateTables } = useDexieDB();

  // Step 1: Consolidate all US tables into the standard us_codes table
  console.log('Starting US tables consolidation...');
  const stats = await consolidateData(
    DBName.US,
    STANDARD_TABLES.US,
    undefined, // Auto-detect all tables
    'npanxx' // Use npanxx field for deduplication
  );

  // Step 2: Clean up duplicate tables
  console.log('Cleaning up duplicate US tables...');
  const deletedTables = await cleanupDuplicateTables(
    DBName.US,
    [STANDARD_TABLES.US] // Keep only the standard table
  );

  return {
    ...stats,
    deletedTables,
  };
}

/**
 * Consolidate all AZ code tables into a single standard table
 * @returns Statistics about the consolidation process
 */
export async function consolidateAZTables() {
  const { consolidateData, cleanupDuplicateTables } = useDexieDB();

  // Step 1: Consolidate all AZ tables into the standard az_codes table
  console.log('Starting AZ tables consolidation...');
  const stats = await consolidateData(
    DBName.AZ,
    STANDARD_TABLES.AZ,
    undefined, // Auto-detect all tables
    'dialCode' // Use dialCode field for deduplication
  );

  // Step 2: Clean up duplicate tables
  console.log('Cleaning up duplicate AZ tables...');
  const deletedTables = await cleanupDuplicateTables(
    DBName.AZ,
    [STANDARD_TABLES.AZ] // Keep only the standard table
  );

  return {
    ...stats,
    deletedTables,
  };
}

/**
 * Run a complete database consolidation process for all data types
 * @returns Consolidated statistics for all migrations
 */
export async function runDatabaseConsolidation() {
  console.log('Starting database consolidation process...');

  const usStats = await consolidateUSTables();
  const azStats = await consolidateAZTables();

  return {
    us: usStats,
    az: azStats,
    totalTablesRemoved: usStats.deletedTables.length + azStats.deletedTables.length,
    totalRecordsMigrated: usStats.total + azStats.total,
    totalDuplicatesRemoved: usStats.deduplicated + azStats.deduplicated,
  };
}
