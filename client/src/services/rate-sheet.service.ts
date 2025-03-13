import { ChangeCode } from '@/types/domains/rate-sheet-types';
import type { RateSheetRecord, GroupedRateData, RateStatistics, InvalidRow, ChangeCodeType } from '@/types/domains/rate-sheet-types';
import { useRateSheetStore } from '@/stores/rate-sheet-store';
import { DBName } from '@/types/app-types';
import useDexieDB from '@/composables/useDexieDB';
import Papa from 'papaparse';


export class RateSheetService {
  private store = useRateSheetStore();
  private tableName = 'rateSheet';
  private dexieDB = useDexieDB();

  constructor() {
    console.log('Initializing Rate Sheet service');
  }

  private async getDB() {
    try {
      const db = await this.dexieDB.getDB(DBName.RATE_SHEET);
      return db;
    } catch (error) {
      console.error('Failed to get database connection:', error);
      throw error;
    }
  }

  async ensureTableExists() {
    try {
      const db = await this.getDB();
      
      if (!db.hasStore(this.tableName)) {
        console.log(`Creating ${this.tableName} table in database`);
        await db.addStore(this.tableName);
      }
      
      return db;
    } catch (error) {
      console.error(`Error ensuring ${this.tableName} table exists:`, error);
      throw error;
    }
  }

  async processRateSheetData(data: RateSheetRecord[]): Promise<void> {
    try {
      const db = await this.ensureTableExists();
      
      // Perform operations within a single transaction if possible
      await db.table(this.tableName).clear();
      await db.table(this.tableName).bulkPut(data);
      
      console.log('Rate sheet data processed successfully');
    } catch (error) {
      console.error('Failed to process rate sheet data:', error);
      throw error;
    }
  }

  async clearData(): Promise<void> {
    try {
      const db = await this.ensureTableExists();
      await db.table(this.tableName).clear();
      this.store.clearInvalidRows();
      this.store.$reset();
    } catch (error) {
      console.error('Failed to clear rate sheet data:', error);
      throw error;
    }
  }

  async getRateSheetData(): Promise<RateSheetRecord[]> {
    try {
      const db = await this.ensureTableExists();
      return await db.table(this.tableName).toArray();
    } catch (error) {
      console.error('Failed to get rate sheet data:', error);
      throw error;
    }
  }

  async updateEffectiveDates(groupedData: GroupedRateData[]): Promise<void> {
    try {
      console.log("Starting updateEffectiveDates with", groupedData.length, "groups");
      const db = await this.ensureTableExists();
      const records = await this.getRateSheetData();
      
      // Create a map for efficient lookup
      const recordsMap = new Map<string, RateSheetRecord[]>();
      
      // Group records by destination name
      records.forEach(record => {
        const existing = recordsMap.get(record.name) || [];
        existing.push(record);
        recordsMap.set(record.name, existing);
      });
      
      // Prepare batch updates
      const updates: RateSheetRecord[] = [];
      
      // Update effective dates based on grouped data
      for (const group of groupedData) {
        const recordsForDestination = recordsMap.get(group.destinationName) || [];
        console.log(`Processing ${recordsForDestination.length} records for ${group.destinationName} with effective date ${group.effectiveDate}`);
        
        // Apply new effective date to all records for this destination
        recordsForDestination.forEach(record => {
          if (record.effective !== group.effectiveDate) {
            record.effective = group.effectiveDate;
            updates.push(record);
          }
        });
      }
      
      if (updates.length > 0) {
        // Perform batch update
        await db.table(this.tableName).bulkPut(updates);
        console.log(`Updated effective dates for ${updates.length} records`);
      } else {
        console.log('No effective date updates needed');
      }
    } catch (error) {
      console.error('Failed to update effective dates:', error);
      throw error;
    }
  }

  /**
   * Updates effective dates using pre-processed records from the worker
   * @param updatedRecords Records with updated effective dates
   * @returns void
   */
  async updateEffectiveDatesWithRecords(updatedRecords: RateSheetRecord[]): Promise<void> {
    try {
      if (!updatedRecords || updatedRecords.length === 0) {
        console.log('No records to update');
        return;
      }
      
      console.log(`Updating ${updatedRecords.length} records in database`);
      const db = await this.ensureTableExists();
      
      // Perform batch update
      await db.table(this.tableName).bulkPut(updatedRecords);
      console.log(`Updated effective dates for ${updatedRecords.length} records in database`);
    } catch (error) {
      console.error('Failed to update effective dates with records:', error);
      throw error;
    }
  }

  async processFile(
    file: File,
    columnMapping: Record<string, number>,
    startLine: number
  ): Promise<{ fileName: string; records: RateSheetRecord[] }> {
    try {
      // Ensure database and table are ready before starting file processing
      await this.ensureTableExists();
      
      this.store.clearInvalidRows();

      return new Promise((resolve, reject) => {
        Papa.parse(file, {
          header: false,
          skipEmptyLines: true,
          complete: async (results: { data: string[][] }) => {
            try {
              // Skip to user-specified start line
              const dataRows = results.data.slice(startLine - 1);
              const validRecords: RateSheetRecord[] = [];
              const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

              dataRows.forEach((row, index) => {
                // Extract values
                const name = row[columnMapping.name]?.trim() || '';
                const prefix = row[columnMapping.prefix]?.trim() || '';
                const rateStr = row[columnMapping.rate];
                
                // Auto-generate effective date as today - no longer read from file
                const effective = today;
                
                // Auto-set changeCode to SAME for newly imported records
                const changeCode: ChangeCodeType = ChangeCode.SAME;
                
                // Parse optional fields
                let minDuration: number | undefined;
                let increments: number | undefined;

                if (columnMapping.minDuration >= 0) {
                  const minDurationStr = row[columnMapping.minDuration]?.trim();
                  if (minDurationStr && !isNaN(Number(minDurationStr))) {
                    minDuration = Number(minDurationStr);
                  }
                }

                if (columnMapping.increments >= 0) {
                  const incrementsStr = row[columnMapping.increments]?.trim();
                  if (incrementsStr && !isNaN(Number(incrementsStr))) {
                    increments = Number(incrementsStr);
                  }
                }

                // Parse and validate the rate
                const rate = parseFloat(rateStr);
                if (isNaN(rate) || !name || !prefix) {
                  const invalidRow: InvalidRow = {
                    destinationName: name || `Row ${startLine + index}`,
                    prefix: prefix || 'Missing',
                    invalidRate: rateStr || 'Missing',
                    rowNumber: startLine + index
                  };
                  this.store.addInvalidRow(invalidRow);
                } else {
                  validRecords.push({
                    name,
                    prefix,
                    rate,
                    effective,
                    changeCode,
                    ...(minDuration !== undefined && { minDuration }),
                    ...(increments !== undefined && { increments }),
                  });
                }
              });

              if (validRecords.length > 0) {
                // Use the storeInDexieDB method which handles transaction safety
                await this.dexieDB.storeInDexieDB(validRecords, DBName.RATE_SHEET, this.tableName);
                console.log(`Stored ${validRecords.length} valid records`);
              } else {
                console.log('No valid records to store');
              }

              this.store.setOriginalData(validRecords);
              
              // Process records into groups and set the groupedData in the store
              const groupedData = this.processRecordsIntoGroups(validRecords);
              this.store.setGroupedData(groupedData);
              
              resolve({ fileName: file.name, records: validRecords });
            } catch (error) {
              console.error('Error processing file data:', error);
              reject(error);
            }
          },
          error: error => reject(new Error(`Failed to parse CSV: ${error.message}`)),
        });
      });
    } catch (error) {
      console.error('Error in processFile:', error);
      throw error;
    }
  }

  public processRecordsIntoGroups(records: RateSheetRecord[]): GroupedRateData[] {
    // Group records by destination name
    const groupedByName = new Map<string, RateSheetRecord[]>();
    records.forEach(record => {
      const existing = groupedByName.get(record.name) || [];
      groupedByName.set(record.name, [...existing, record]);
    });

    return Array.from(groupedByName.entries()).map(([name, records]) => {
      const rateMap = new Map<number, number>();
      records.forEach(record => {
        const rate = typeof record.rate === 'string' ? parseFloat(record.rate) : record.rate;
        rateMap.set(rate, (rateMap.get(rate) || 0) + 1);
      });

      const totalRecords = records.length;
      const rates: RateStatistics[] = Array.from(rateMap.entries()).map(([rate, count]) => ({
        rate,
        count,
        percentage: (count / totalRecords) * 100,
        isCommon: false,
      }));

      const maxCount = Math.max(...rates.map(r => r.count));
      rates.forEach(rate => {
        rate.isCommon = rate.count === maxCount;
      });

      // Determine if there's a discrepancy (more than one unique rate)
      const hasDiscrepancy = rateMap.size > 1;
      
      // Add debug logging to check rate conflicts
      if (hasDiscrepancy) {
        console.log(`Rate conflict detected for ${name}: ${Array.from(rateMap.keys()).join(', ')}`);
      }

      return {
        destinationName: name,
        codes: records.map(r => r.prefix),
        rates,
        hasDiscrepancy,
        effectiveDate: records[0]?.effective || new Date().toISOString().split('T')[0],
        changeCode: records[0]?.changeCode || ChangeCode.SAME as ChangeCodeType,
        minDuration: records[0]?.minDuration,
        increments: records[0]?.increments,
      };
    });
  }
}
