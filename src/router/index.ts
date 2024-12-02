import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/AzPricingView.vue'),
      // component: () => import('../views/HomeView.vue')
    },
    {
      path: '/azpricing',
      name: 'azpricing',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/AzPricingView.vue'),
    },
    {
      path: '/uspricing',
      name: 'uspricing',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/UsPricingView.vue'),
    },
    {
      path: '/lcr',
      name: 'lcr',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/LcrGeneratorView.vue'),
    },
    {
      path: '/disputes',
      name: 'disputes',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/DisputeEngineView.vue'),
    },
  ],
});

export default router;
