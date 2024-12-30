import { RouteRecordRaw } from 'vue-router';

export const adminRoutes: RouteRecordRaw[] = [
  {
    path: '/admin/lerg',
    name: 'AdminLERG',
    component: () => import('@/pages/AdminLergView.vue'),
    meta: {
      requiresAuth: true,
      requiresAdmin: true,
    },
  },
];
