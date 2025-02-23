export const adminRoutes = [
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
