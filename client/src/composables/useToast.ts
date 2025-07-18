import { ref } from 'vue';

interface ToastOptions {
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

export function useToast() {
  const isVisible = ref(false);
  const message = ref('');
  const type = ref<'success' | 'error' | 'info' | 'warning'>('info');

  const showToast = (options: ToastOptions | string) => {
    if (typeof options === 'string') {
      console.log(`[Toast] ${options}`);
      return;
    }
    
    console.log(`[Toast ${options.type || 'info'}] ${options.message}`);
  };

  const showError = (msg: string, msgType?: string) => {
    if (msgType === 'success') {
      console.log(`[Success] ${msg}`);
    } else if (msgType === 'info') {
      console.info(`[Info] ${msg}`);
    } else {
      console.error(`[Error] ${msg}`);
    }
  };

  const showSuccess = (msg: string) => {
    console.log(`[Success] ${msg}`);
  };

  const showInfo = (msg: string) => {
    console.info(`[Info] ${msg}`);
  };

  const showWarning = (msg: string) => {
    console.warn(`[Warning] ${msg}`);
  };

  return {
    showToast,
    showError,
    showSuccess,
    showInfo,
    showWarning,
    isVisible,
    message,
    type
  };
}