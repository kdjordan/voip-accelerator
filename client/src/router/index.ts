import { createRouter, createWebHistory } from 'vue-router';
import { adminRoutes } from './admin-routes';
import AdminLergView from '../pages/AdminLergView.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../pages/AzPricingView.vue'),
    },
    {
      path: '/azpricing',
      name: 'azpricing',
      component: () => import('../pages/AzPricingView.vue'),
    },
    {
      path: '/uspricing',
      name: 'uspricing',
      component: () => import('../pages/UsPricingView.vue'),
    },
    {
      path: '/healthcheck',
      name: 'healthcheck',
      component: () => import('../pages/HealthCheckView.vue'),
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
