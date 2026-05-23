import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { sql as drizzleSql } from 'drizzle-orm';
import { db, sql } from './client.js';
import { enhancedLerg, type EnhancedLergInsert } from './schema.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
// server/src/db/ -> repo root
const csvPath = resolve(__dirname, '../../../enhanced_lerg.csv');

type CategoryDeriverInput = Pick<EnhancedLergInsert, 'countryCode' | 'region'>;

function deriveCategory({ countryCode, region }: CategoryDeriverInput): EnhancedLergInsert['category'] {
  if (countryCode === 'CA') return 'canadian';
  if (countryCode === 'US') {
    if (region === 'Pacific') return 'pacific';
    return 'us-domestic';
  }
  return 'caribbean';
}

function parseBool(v: string | undefined): boolean {
  if (!v) return true;
  return v.trim().toLowerCase() === 'true' || v.trim() === 't' || v.trim() === '1';
}

function parseTimestamp(v: string | undefined): Date | undefined {
  if (!v || v.trim() === '') return undefined;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

// Minimal CSV parser — enhanced_lerg.csv has no quoted commas; if that changes,
// swap in a real parser. Keeping zero-dep for now.
function splitCsvLine(line: string): string[] {
  return line.split(',').map((s) => s.trim());
}

async function main(): Promise<void> {
  const raw = await readFile(csvPath, 'utf8');
  const lines = raw.split(/\r?\n/).filter((l) => l.length > 0);
  if (lines.length < 2) {
    throw new Error(`enhanced_lerg.csv has no data rows (${csvPath})`);
  }
  const header = splitCsvLine(lines[0]!);
  const expectedHeader = [
    'npa',
    'country_code',
    'country_name',
    'state_province_code',
    'state_province_name',
    'region',
    'created_at',
    'updated_at',
    'notes',
    'is_active',
  ];
  for (let i = 0; i < expectedHeader.length; i++) {
    if (header[i] !== expectedHeader[i]) {
      throw new Error(
        `CSV header mismatch at column ${i}: expected "${expectedHeader[i]}", got "${header[i]}"`,
      );
    }
  }

  const rows: EnhancedLergInsert[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i]!);
    const [
      npa,
      countryCode,
      countryName,
      stateProvinceCode,
      stateProvinceName,
      region,
      createdAt,
      updatedAt,
      notes,
      isActive,
    ] = cols;
    if (!npa || !countryCode || !stateProvinceCode) {
      throw new Error(`Row ${i + 1} missing required columns: ${lines[i]}`);
    }
    rows.push({
      npa,
      countryCode,
      countryName: countryName ?? '',
      stateProvinceCode,
      stateProvinceName: stateProvinceName ?? '',
      region: region || null,
      category: deriveCategory({ countryCode, region: region || null }),
      source: 'seed',
      confidenceScore: '1.00',
      createdAt: parseTimestamp(createdAt),
      updatedAt: parseTimestamp(updatedAt),
      notes: notes || null,
      isActive: parseBool(isActive),
    });
  }

  console.log(`Seeding ${rows.length} LERG rows from ${csvPath} ...`);

  // Idempotent: upsert on PK. Chunk to keep statements small.
  const CHUNK = 500;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    await db
      .insert(enhancedLerg)
      .values(chunk)
      .onConflictDoUpdate({
        target: enhancedLerg.npa,
        set: {
          countryCode: drizzleSql`excluded.country_code`,
          countryName: drizzleSql`excluded.country_name`,
          stateProvinceCode: drizzleSql`excluded.state_province_code`,
          stateProvinceName: drizzleSql`excluded.state_province_name`,
          region: drizzleSql`excluded.region`,
          category: drizzleSql`excluded.category`,
          source: drizzleSql`excluded.source`,
          confidenceScore: drizzleSql`excluded.confidence_score`,
          notes: drizzleSql`excluded.notes`,
          isActive: drizzleSql`excluded.is_active`,
          updatedAt: drizzleSql`CURRENT_TIMESTAMP`,
        },
      });
  }

  const [{ count }] = await db.execute<{ count: string }>(
    drizzleSql`SELECT COUNT(*)::text AS count FROM enhanced_lerg`,
  );
  console.log(`Done. enhanced_lerg row count: ${count}`);
  await sql.end();
}

main().catch(async (err) => {
  console.error(err);
  await sql.end();
  process.exit(1);
});
