import { ref, onMounted } from 'vue';
import { LergLoadingStatus, LergEntry, LergWorkerResponse } from '@/types/lerg-types';
import { openDB } from 'idb';

export function useLergData() {
  const loadingStatus = ref<LergLoadingStatus>({
    isLoading: false,
    progress: 0,
    error: null,
    lastUpdated: null
  });

  const worker = new Worker(
    new URL('../workers/lerg-worker.ts', import.meta.url),
    { type: 'module' }
  );

  worker.onmessage = (event: MessageEvent<LergWorkerResponse>) => {
    switch (event.data.type) {
      case 'progress':
        loadingStatus.value.progress = event.data.progress;
        break;
      case 'complete':
        storeLergData(event.data.data);
        loadingStatus.value.isLoading = false;
        loadingStatus.value.lastUpdated = new Date();
        break;
      case 'error':
        loadingStatus.value.error = event.data.error;
        loadingStatus.value.isLoading = false;
        break;
    }
  };

  async function initializeLergData() {
    try {
      loadingStatus.value.isLoading = true;
      loadingStatus.value.error = null;

      // Check if we already have recent LERG data
      const db = await openDB('LergDB', 1, {
        upgrade(db) {
          db.createObjectStore('lerg', { keyPath: 'npanxx' });
          db.createObjectStore('metadata', { keyPath: 'id' });
        }
      });

      const metadata = await db.get('metadata', 'lastUpdate');
      const needsUpdate = !metadata || isStale(metadata.date);

      if (needsUpdate) {
        const response = await fetch('/src/data/lerg.csv');
        const csvContent = await response.text();
        
        worker.postMessage({
          type: 'process',
          csvContent,
          chunkSize: 1000
        });
      } else {
        loadingStatus.value.isLoading = false;
        loadingStatus.value.lastUpdated = new Date(metadata.date);
      }
    } catch (error) {
      loadingStatus.value.error = {
        code: 'INITIALIZATION_ERROR',
        message: 'Failed to initialize LERG data',
        details: error
      };
      loadingStatus.value.isLoading = false;
    }
  }

  async function storeLergData(entries: LergEntry[]) {
    try {
      const db = await openDB('LergDB', 1);
      const tx = db.transaction('lerg', 'readwrite');
      const store = tx.objectStore('lerg');

      // Store in chunks to avoid memory issues
      for (const entry of entries) {
        await store.put(entry);
      }

      await tx.done;

      // Update metadata
      const metadataTx = db.transaction('metadata', 'readwrite');
      await metadataTx.store.put({
        id: 'lastUpdate',
        date: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error storing LERG data:', error);
      throw error;
    }
  }

  function isStale(date: string): boolean {
    const lastUpdate = new Date(date);
    const now = new Date();
    // Consider data stale after 24 hours
    return now.getTime() - lastUpdate.getTime() > 24 * 60 * 60 * 1000;
  }

  return {
    loadingStatus,
    initializeLergData
  };
}