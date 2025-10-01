import { RouteRecordRaw } from 'vue-router';

export const adminRoutes: RouteRecordRaw[] = [
  {
    path: '/admin',
    name: 'AdminDashboard',
    component: () => import('@/pages/AdminView.vue'),
    meta: {
      requiresAuth: true,
      requiresAdmin: true, // Only admin can access this
    },
  },
];
