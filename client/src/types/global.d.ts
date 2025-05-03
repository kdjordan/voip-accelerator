declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

// This export is necessary to make it a module, which allows augmenting the global scope.
export {};
