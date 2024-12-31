import { DatabaseService } from '../../shared/services/database.service';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse';

interface SpecialCode {
  npa: string;
  country: string;
  province_or_territory: string;
}

export class SpecialCodesSeeder {
  private db: DatabaseService;

  constructor() {
    this.db = DatabaseService.getInstance();
  }

  async seedFromCsv(filePath: string): Promise<number> {
    const records: SpecialCode[] = await this.parseCsvFile(filePath);
    return this.insertRecords(records);
  }

  private async parseCsvFile(filePath: string): Promise<SpecialCode[]> {
    const records: SpecialCode[] = [];

    return new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(
          parse({
            columns: true,
            skip_empty_lines: true,
            trim: true,
          })
        )
        .on('data', row => {
          if (row.NPA && row.Country) {
            records.push({
              npa: row.NPA,
              country: row.Country,
              province_or_territory: row['Province or Territory'] || '',
            });
          }
        })
        .on('end', () => resolve(records))
        .on('error', reject);
    });
  }

  private async insertRecords(records: SpecialCode[]): Promise<number> {
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
        console.error(`Error inserting NPA ${record.npa}:`, error);
      }
    }

    return inserted;
  }
}
