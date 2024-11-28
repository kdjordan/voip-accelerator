import { type LergData } from '@/types/app-types';
import { parseAndDeduplicate } from '@/utils/parseAndDeduplicate';

// Respond to messages from the main thread
self.addEventListener('message', (event) => {
  const { filePath } = event.data;

  // Process the file and generate LergData
  const lergData: LergData[] = parseAndDeduplicate(filePath);

  // Send the processed data back to the main thread
  self.postMessage(lergData);
});