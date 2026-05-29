import './assets/index.css';
import { ViteSSG } from 'vite-ssg';
import { createPinia } from 'pinia';

// @ts-ignore
import App from './App.vue';
import { installRouterGuards, routes } from './router';
import { initTheme } from './composables/useTheme';

// TEMP: Load test functions for +1 detection (remove after testing)
// import './utils/test-detection-console';

const marketingRoutes = ['/', '/features', '/pricing', '/contact'];

export const createApp = ViteSSG(App, { routes }, ({ app, router, isClient }) => {
  const pinia = createPinia();
  app.use(pinia);

  if (isClient) {
    installRouterGuards(router);
    initTheme();

    // Track page views on every route change.
    router.afterEach((to) => {
      if (typeof window.gtag === 'function') {
        window.gtag('event', 'page_view', {
          page_path: to.fullPath,
          page_title: document.title,
        });
      }
    });
  }
});

export async function includedRoutes(): Promise<string[]> {
  return marketingRoutes;
}
