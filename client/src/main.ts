import './assets/index.css';
import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import { pinia } from './store';

const app = createApp(App);

// Install pinia first
app.use(pinia);

// Then install router
app.use(router);

app.mount('#app');
