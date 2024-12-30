import { createRouter, createWebHistory } from 'vue-router';
import { adminRoutes } from './admin-routes';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
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
      path: '/lcr',
      name: 'lcr',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../pages/LcrGeneratorView.vue'),
    },
    {
      path: '/disputes',
      name: 'disputes',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../pages/DisputeEngineView.vue'),
    },
    // Spread the admin routes
    ...adminRoutes,
  ],
});

export default router;
