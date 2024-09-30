import './assets/index.css'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
// @ts-ignore
import App from './App.vue'
import router from './router'

const app = createApp(App)
const pinia = createPinia()

app.use(router).use(pinia)

app.mount('#app')
