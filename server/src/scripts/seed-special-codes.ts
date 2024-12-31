import { SpecialCodesSeeder } from '../domains/lerg/services/special-codes.seeder';
import * as path from 'path';

async function seedSpecialCodes() {
  const seeder = new SpecialCodesSeeder();
  const csvPath = path.resolve(__dirname, '../../node_modules/special_codes.csv');

  try {
    const count = await seeder.seedFromCsv(csvPath);
    console.log(`Successfully seeded ${count} special area codes`);
  } catch (error) {
    console.error('Error seeding special codes:', error);
    process.exit(1);
  }
}

seedSpecialCodes();
