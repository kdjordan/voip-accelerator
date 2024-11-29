import useCSVProcessing from '@/composables/useCsvFiles';
import useIndexedDB from '@/composables/useIndexDB';
import { DBName } from '@/types/app-types';

export async function loadUSCodesApi(): Promise<void> {
  const csvProcessing = useCSVProcessing();
  //   const { storeInIndexedDB } = useIndexedDB();
  const file = new File([''], '/src/data/us-master-codes.csv'); // Replace with actual file loading logic

  try {
    csvProcessing.file.value = file; // Set the file to be processed

    // Parse the CSV file
    await csvProcessing.parseCSVForFullProcessing();

    // Assuming the parsed data is stored in a ref or returned from the parsing function
    // const parsedData = csvProcessing.standardizedData.value;

    // Store the parsed data in IndexedDB
    // await storeInIndexedDB(parsedData, DBName.USCodes, file.name, 'USCodesComponent');
  } catch (error) {
    console.error('Error loading US codes:', error);
  }
}
