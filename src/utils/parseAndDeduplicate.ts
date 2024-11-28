import fs from 'fs';
import { type LergData } from '@/types/app-types';

export function parseAndDeduplicate(filePath: string): LergData[] {
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const lines = fileContent.split('\n');
  const uniqueEntries = new Set<string>();
  const result: LergData[] = [];

  lines.forEach(line => {
    const columns = line.split('\t'); // Adjust delimiter as needed
    if (columns.length < 3) return; // Ensure there are enough columns

    const key = `${columns[0]}-${columns[1]}`; // Create a unique key based on the first two columns
    const state = columns[2]; // Assuming column 3 is at index 2
    if (!uniqueEntries.has(key)) {
      uniqueEntries.add(key);
      result.push({
        key,
        state, // Map the state abbreviation to the state property
        // Map other columns to LergData properties
      });
    }
  });

  return result;
}

