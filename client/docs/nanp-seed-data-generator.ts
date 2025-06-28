/**
 * NANP Seed Data Generator
 * 
 * This script generates SQL INSERT statements to populate the enhanced_lerg table
 * by combining data from existing constants files and the current LERG data.
 * 
 * Run this to generate the initial seed data for the migration.
 */

import { STATE_CODES } from '@/types/constants/state-codes';
import { PROVINCE_CODES } from '@/types/constants/province-codes';
import { COUNTRY_CODES } from '@/types/constants/country-codes';

// Interface matching our enhanced LERG structure
interface EnhancedLERGRecord {
  npa: string;
  country_code: string;
  country_name: string;
  state_province_code: string;
  state_province_name: string;
  region: string;
  category: 'us-domestic' | 'canadian' | 'caribbean' | 'pacific';
  source: 'seed';
  confidence_score: number;
}

// Known US NPAs from nanp-categorization.ts (to be expanded from LERG)
const US_NPAS_SAMPLE = [
  { npa: '201', state: 'NJ' }, { npa: '202', state: 'DC' }, { npa: '203', state: 'CT' },
  { npa: '205', state: 'AL' }, { npa: '206', state: 'WA' }, { npa: '207', state: 'ME' },
  { npa: '208', state: 'ID' }, { npa: '209', state: 'CA' }, { npa: '210', state: 'TX' },
  { npa: '212', state: 'NY' }, { npa: '213', state: 'CA' }, { npa: '214', state: 'TX' },
  { npa: '215', state: 'PA' }, { npa: '216', state: 'OH' }, { npa: '217', state: 'IL' },
  { npa: '218', state: 'MN' }, { npa: '219', state: 'IN' }, { npa: '224', state: 'IL' },
  // ... many more from actual LERG data
];

// Known Canadian NPAs (including 438!)
const CANADIAN_NPAS_SAMPLE = [
  { npa: '204', province: 'MB' }, { npa: '226', province: 'ON' }, { npa: '236', province: 'BC' },
  { npa: '249', province: 'ON' }, { npa: '250', province: 'BC' }, { npa: '289', province: 'ON' },
  { npa: '306', province: 'SK' }, { npa: '343', province: 'ON' }, { npa: '365', province: 'ON' },
  { npa: '403', province: 'AB' }, { npa: '416', province: 'ON' }, { npa: '418', province: 'QC' },
  { npa: '431', province: 'MB' }, { npa: '437', province: 'ON' }, 
  { npa: '438', province: 'QC' }, // The missing NPA!
  { npa: '450', province: 'QC' }, // This one too!
  { npa: '506', province: 'NB' }, { npa: '514', province: 'QC' }, { npa: '519', province: 'ON' },
  { npa: '579', province: 'QC' }, { npa: '581', province: 'QC' }, { npa: '587', province: 'AB' },
  { npa: '604', province: 'BC' }, { npa: '613', province: 'ON' }, { npa: '639', province: 'SK' },
  { npa: '647', province: 'ON' }, { npa: '705', province: 'ON' }, { npa: '709', province: 'NL' },
  { npa: '778', province: 'BC' }, { npa: '780', province: 'AB' }, { npa: '782', province: 'NS' },
  { npa: '807', province: 'ON' }, { npa: '819', province: 'QC' }, { npa: '867', province: 'NT' },
  { npa: '873', province: 'QC' }, { npa: '902', province: 'NS' }, { npa: '905', province: 'ON' },
  // ... complete list from LERG
];

// Caribbean NPAs by country
const CARIBBEAN_NPAS_SAMPLE = [
  { npa: '242', country: 'BS' }, // Bahamas
  { npa: '246', country: 'BB' }, // Barbados
  { npa: '264', country: 'AI' }, // Anguilla
  { npa: '268', country: 'AG' }, // Antigua and Barbuda
  { npa: '284', country: 'VG' }, // British Virgin Islands
  { npa: '340', country: 'VI' }, // U.S. Virgin Islands
  { npa: '345', country: 'KY' }, // Cayman Islands
  { npa: '441', country: 'BM' }, // Bermuda
  { npa: '473', country: 'GD' }, // Grenada
  { npa: '649', country: 'TC' }, // Turks and Caicos
  { npa: '664', country: 'MS' }, // Montserrat
  { npa: '721', country: 'SX' }, // Sint Maarten
  { npa: '758', country: 'LC' }, // Saint Lucia
  { npa: '767', country: 'DM' }, // Dominica
  { npa: '784', country: 'VC' }, // Saint Vincent
  { npa: '787', country: 'PR' }, // Puerto Rico
  { npa: '809', country: 'DO' }, // Dominican Republic
  { npa: '829', country: 'DO' }, // Dominican Republic
  { npa: '849', country: 'DO' }, // Dominican Republic
  { npa: '868', country: 'TT' }, // Trinidad and Tobago
  { npa: '869', country: 'KN' }, // Saint Kitts and Nevis
  { npa: '876', country: 'JM' }, // Jamaica
  { npa: '939', country: 'PR' }, // Puerto Rico
];

// Pacific NPAs
const PACIFIC_NPAS_SAMPLE = [
  { npa: '670', country: 'MP' }, // Northern Mariana Islands
  { npa: '671', country: 'GU' }, // Guam
  { npa: '684', country: 'AS' }, // American Samoa
];

function generateSeedData(): string[] {
  const insertStatements: string[] = [];
  
  // Header
  insertStatements.push(`-- Enhanced LERG Seed Data`);
  insertStatements.push(`-- Generated from existing constants files`);
  insertStatements.push(`-- This provides complete geographic context for all NPAs\n`);
  insertStatements.push(`INSERT INTO enhanced_lerg (npa, country_code, country_name, state_province_code, state_province_name, region, category, source, confidence_score) VALUES`);
  
  const values: string[] = [];
  
  // Process US NPAs
  for (const { npa, state } of US_NPAS_SAMPLE) {
    const stateInfo = STATE_CODES[state];
    if (stateInfo) {
      values.push(
        `('${npa}', 'US', 'United States', '${state}', '${stateInfo.name}', '${stateInfo.region}', 'us-domestic', 'seed', 1.00)`
      );
    }
  }
  
  // Process Canadian NPAs
  for (const { npa, province } of CANADIAN_NPAS_SAMPLE) {
    const provinceInfo = PROVINCE_CODES[province];
    if (provinceInfo) {
      values.push(
        `('${npa}', 'CA', 'Canada', '${province}', '${provinceInfo.name}', '${provinceInfo.region}', 'canadian', 'seed', 1.00)`
      );
    }
  }
  
  // Process Caribbean NPAs
  for (const { npa, country } of CARIBBEAN_NPAS_SAMPLE) {
    const countryInfo = COUNTRY_CODES[country];
    if (countryInfo) {
      // For Caribbean countries, state/province code is same as country code
      values.push(
        `('${npa}', '${country}', '${countryInfo.name}', '${country}', '${countryInfo.name}', '${countryInfo.region}', 'caribbean', 'seed', 1.00)`
      );
    }
  }
  
  // Process Pacific NPAs
  for (const { npa, country } of PACIFIC_NPAS_SAMPLE) {
    const countryInfo = COUNTRY_CODES[country];
    if (countryInfo) {
      values.push(
        `('${npa}', '${country}', '${countryInfo.name}', '${country}', '${countryInfo.name}', '${countryInfo.region}', 'pacific', 'seed', 1.00)`
      );
    }
  }
  
  // Join all values
  insertStatements.push(values.join(',\n'));
  insertStatements.push('ON CONFLICT (npa) DO UPDATE SET');
  insertStatements.push('  country_name = EXCLUDED.country_name,');
  insertStatements.push('  state_province_name = EXCLUDED.state_province_name,');
  insertStatements.push('  region = EXCLUDED.region,');
  insertStatements.push('  category = EXCLUDED.category,');
  insertStatements.push('  updated_at = CURRENT_TIMESTAMP;');
  
  return insertStatements;
}

// Generate and log the SQL
const seedSQL = generateSeedData();
console.log(seedSQL.join('\n'));

// Also generate a validation query
console.log('\n\n-- Validation Queries:');
console.log('-- Check that 438 and 450 are both correctly categorized as Quebec, Canada:');
console.log(`SELECT * FROM enhanced_lerg WHERE npa IN ('438', '450');`);
console.log('\n-- Check category distribution:');
console.log('SELECT category, COUNT(*) FROM enhanced_lerg GROUP BY category ORDER BY category;');
console.log('\n-- Check for any missing geographic names:');
console.log('SELECT * FROM enhanced_lerg WHERE state_province_name IS NULL OR country_name IS NULL;');