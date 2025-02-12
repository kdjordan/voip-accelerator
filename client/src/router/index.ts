import { createRouter, createWebHistory } from 'vue-router';
import { adminRoutes } from './admin-routes';
import AdminLergView from '../pages/AdminLergView.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../pages/AzView.vue'),
    },
    {
      path: '/rate-sheet',
      name: 'rateSheet',
      component: () => import('../pages/RateSheetView.vue'),
    },
    {
      path: '/azpricing',
      name: 'azpricing',
      component: () => import('../pages/UsView.vue'),
    },
    {
      path: '/uspricing',
      name: 'uspricing',
      component: () => import('../pages/UsView.vue'),
    },
    {
      path: '/admin/lerg',
      name: 'AdminLerg',
      component: AdminLergView,
    },
    // Spread the admin routes
    ...adminRoutes,
  ],
});

export default router;
