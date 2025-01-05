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
      // component: () => import('../pages/HomeView.vue')
    },
    {
      path: '/azpricing',
      name: 'azpricing',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../pages/AzPricingView.vue'),
    },
    {
      path: '/uspricing',
      name: 'uspricing',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../pages/UsPricingView.vue'),
    },
    {
      path: '/healthcheck',
      name: 'healthcheck',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
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
