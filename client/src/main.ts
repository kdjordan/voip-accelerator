import './assets/index.css';
import { createApp } from 'vue';
import { createPinia } from 'pinia';

// @ts-ignore
import App from './App.vue';
import router from './router';

// Initialize the application
const app = createApp(App);

const pinia = createPinia();

app.use(router).use(pinia);

// Track page views on every route change
router.afterEach((to) => {
  if (typeof window.gtag === 'function') {
    window.gtag('event', 'page_view', {
      page_path: to.fullPath,
      page_title: document.title,
    });
  }
});

app.mount('#app');
