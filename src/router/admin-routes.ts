import { RouteRecordRaw } from 'vue-router';

export const adminRoutes: RouteRecordRaw[] = [
  {
    path: '/admin/lerg',
    name: 'AdminLERG',
    component: () => import('@/domains/npanxx/views/AdminLergView.vue'),
    meta: {
      requiresAuth: true,
      requiresAdmin: true
    }
  }
]; 