import { createRouter, createWebHistory } from 'vue-router';
import { adminRoutes } from './admin-routes';
import AdminLergView from '../pages/AdminLergView.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../pages/RateSheetView.vue'),
    },
    {
      path: '/rate-sheet',
      name: 'rateSheet',
      component: () => import('../pages/RateSheetView.vue'),
    },
    {
      path: '/azview',
      name: 'azview',
      component: () => import('../pages/AzView.vue'),
    },
    {
      path: '/usview',
      name: 'usview',
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
