import { RouteRecordRaw } from 'vue-router';

export const adminRoutes: RouteRecordRaw[] = [
  {
    path: '/admin',
    name: 'AdminDashboard',
    component: () => import('@/pages/AdminView.vue'),
    meta: {
      requiresAuth: true,
      requiresSuperAdmin: true, // Only super_admin can access this
    },
  },
  {
    path: '/enterprise',
    name: 'EnterpriseDashboard', 
    component: () => import('@/pages/EnterpriseView.vue'),
    meta: {
      requiresAuth: true,
      requiresAdmin: true, // Enterprise admins (admin role) can access this
    },
  },
];
