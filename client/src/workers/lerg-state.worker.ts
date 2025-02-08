// import type { StateWorkerMessage, StateWorkerResponse, LERGRecord, StateNPAMapping } from '@/types/lerg-types';

// const DEFAULT_BATCH_SIZE = 1000;

// self.onmessage = async (event: MessageEvent<StateWorkerMessage>) => {
//   const { data, batchSize = DEFAULT_BATCH_SIZE } = event.data;

//   try {
//     if (!data || !Array.isArray(data)) {
//       throw new Error('Invalid data received');
//     }

//     const stateMap = new Map<string, Set<string>>();
//     let processed = 0;
//     const total = data.length;

//     // Process in batches
//     for (let i = 0; i < total; i += batchSize) {
//       const batch = data.slice(i, i + batchSize);

//       // Process each record in batch
//       batch.forEach((record: LERGRecord) => {
//         if (!stateMap.has(record.state)) {
//           stateMap.set(record.state, new Set());
//         }
//         stateMap.get(record.state)?.add(record.npa);
//       });

//       processed += batch.length;

//       // Report progress
//       self.postMessage({
//         type: 'progress',
//         progress: (processed / total) * 100,
//         processed,
//         total,
//       } as StateWorkerResponse);
//     }

//     // Convert Map<string, Set<string>> to StateNPAMapping
//     const stateNPAs: StateNPAMapping = {};
//     stateMap.forEach((npas, state) => {
//       stateNPAs[state] = Array.from(npas).sort();
//     });

//     // Send final result
//     self.postMessage({
//       type: 'complete',
//       data: stateNPAs,
//       processed,
//       total,
//     } as StateWorkerResponse);
//   } catch (error) {
//     self.postMessage({
//       type: 'error',
//       error: error instanceof Error ? error.message : 'Unknown error occurred',
//     } as StateWorkerResponse);
//   }
// };
