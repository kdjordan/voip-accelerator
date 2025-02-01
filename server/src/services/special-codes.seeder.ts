import { DatabaseService } from '@/services/database.service';
import { logger } from '@/config/logger';
import * as fs from 'fs';
import * as path from 'path';
import Papa, { ParseResult } from 'papaparse';
import type { SpecialCode, CSVRow } from '@/types/lerg.types';

export class SpecialCodesSeeder {
  private db: DatabaseService;

  constructor() {
    this.db = DatabaseService.getInstance();
  }

  async seedFromCsv(filePath: string): Promise<number> {
    const records = await this.parseCsvFile(filePath);
    return this.insertRecords(records);
  }

  private async parseCsvFile(filePath: string): Promise<SpecialCode[]> {
    const fileContent = await fs.promises.readFile(filePath, 'utf-8');

    return new Promise<SpecialCode[]>((resolve, reject) => {
      Papa.parse<CSVRow>(fileContent, {
        header: true,
        skipEmptyLines: true,
        complete: (results: ParseResult<CSVRow>) => {
          const records = results.data
            .filter((row: CSVRow) => row.NPA && row.Country)
            .map((row: CSVRow) => ({
              npa: row.NPA,
              country: row.Country,
              province_or_territory: row['Province or Territory'] || '',
            }));
          resolve(records);
        },
      });
    });
  }

  private async insertRecords(records: SpecialCode[]): Promise<number> {
    logger.info('Starting record insertion');
    const query = `
      INSERT INTO special_area_codes (npa, country, province_or_territory)
      VALUES ($1, $2, $3)
      ON CONFLICT (npa) DO UPDATE SET
        country = EXCLUDED.country,
        province_or_territory = EXCLUDED.province_or_territory
      RETURNING id
    `;

    let inserted = 0;
    for (const record of records) {
      try {
        const result = await this.db.query(query, [record.npa, record.country, record.province_or_territory]);
        if (result.rowCount) inserted++;
      } catch (error) {
        logger.error(`Error inserting NPA ${record.npa}`, error);
      }
    }

    return inserted;
  }
}
