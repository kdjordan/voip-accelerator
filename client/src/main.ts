import './assets/index.css';
import { createApp } from 'vue';
import { createPinia } from 'pinia';

// @ts-ignore
import App from './App.vue';
import router from './router';
import { setupMemoryMonitoring } from './services/storage/storage-factory';
import { storageConfig, updateStorageConfig } from './config/storage-config';

// Initialize the application
const app = createApp(App);
const pinia = createPinia();

app.use(router).use(pinia);

// Set up memory monitoring if in browser environment
if (typeof window !== 'undefined') {
  // Enable memory monitoring for production use
  updateStorageConfig({
    autoFallbackOnMemoryPressure: true,
    memoryThresholdMB: 350 // Set an appropriate threshold
  });
  
  // Initialize memory monitoring
  setupMemoryMonitoring();
  
  // Listen for storage strategy changes
  window.addEventListener('storage-strategy-changed', ((event: CustomEvent) => {
    console.log('[Storage] Strategy changed:', event.detail);
    // You could show a notification to the user here
  }) as EventListener);
}

app.mount('#app');
