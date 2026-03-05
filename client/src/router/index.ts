import { createRouter, createWebHistory } from 'vue-router';
import { nextTick } from 'vue';
import { adminRoutes } from './admin-routes';
import { useUserStore } from '@/stores/user-store';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/pages/HomeView.vue'),
    },
    {
      path: '/home',
      redirect: '/',
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('@/pages/DashBoard.vue'),
    },
    {
      path: '/az-rate-sheet',
      name: 'AZRateSheet',
      component: () => import('@/pages/AZRateSheetView.vue'),
    },
    {
      path: '/us-rate-sheet',
      name: 'USRateSheet',
      component: () => import('@/pages/USRateSheetView.vue'),
    },
    {
      path: '/azview',
      name: 'azview',
      component: () => import('@/pages/AzView.vue'),
    },
    {
      path: '/usview',
      name: 'usview',
      component: () => import('@/pages/UsView.vue'),
    },
    {
      path: '/rate-gen/us',
      name: 'RateGenUS',
      component: () => import('@/pages/RateGenUSView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/rate-gen',
      redirect: '/rate-gen/us',
    },
    {
      path: '/terms-and-conditions',
      name: 'termsAndConditions',
      component: () => import('@/pages/TandCView.vue'),
    },
    {
      path: '/privacy-policy',
      name: 'privacyPolicy',
      component: () => import('@/pages/PrivacyView.vue'),
    },

    // --- Auth Routes ---
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/pages/auth/LoginPage.vue'),
      meta: { requiresAuth: false, hideWhenAuthed: true },
    },
    {
      path: '/signup',
      name: 'SignUp',
      component: () => import('@/pages/auth/SignUpPage.vue'),
      meta: { requiresAuth: false, hideWhenAuthed: true },
    },
    {
      path: '/forgot-password',
      name: 'ForgotPassword',
      component: () => import('@/pages/ForgotPasswordPage.vue'),
      meta: { requiresAuth: false, hideWhenAuthed: true },
    },
    {
      path: '/reset-password',
      name: 'ResetPassword',
      component: () => import('@/pages/ResetPasswordPage.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: '/auth/callback',
      name: 'AuthCallback',
      component: () => import('@/pages/auth/AuthCallbackPage.vue'),
      meta: { requiresAuth: false },
    },

    // Spread the admin routes
    ...adminRoutes,
    {
      path: '/access-denied',
      name: 'AccessDenied',
      component: () => import('@/pages/AccessDeniedView.vue'),
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'notFound',
      component: () => import('@/pages/NotFoundView.vue'),
    },
  ],
  scrollBehavior(to, from, savedPosition) {
    if (to.hash) {
      return {
        el: to.hash,
        behavior: 'smooth',
      };
    }

    if (savedPosition) {
      return savedPosition;
    }

    return { top: 0 };
  },
});

// Routes that require authentication
const authRequiredRoutes = [
  '/dashboard',
  '/az-rate-sheet',
  '/us-rate-sheet',
  '/azview',
  '/usview',
  '/rate-gen',
  '/admin',
];

// Routes only for unauthenticated users
const transitionalAuthRoutes = ['/login', '/signup', '/forgot-password', '/auth/callback', '/'];

// Helper function to wait for auth initialization
async function waitForAuthInitialization(
  userStoreInstance: ReturnType<typeof useUserStore>
): Promise<void> {
  if (userStoreInstance.getAuthIsInitialized) {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    const unwatch = userStoreInstance.$subscribe((_mutation, state) => {
      if (state.auth.isInitialized) {
        unwatch();
        resolve();
      }
    });
    if (userStoreInstance.getAuthIsInitialized) {
      unwatch();
      resolve();
    }
  });
}

router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore();

  // ALWAYS allow password reset page regardless of auth state
  const isResetPasswordRoute = to.name === 'ResetPassword' || to.path === '/reset-password';
  const hasRecoveryToken = window.location.hash.includes('type=recovery');

  if (isResetPasswordRoute || hasRecoveryToken) {
    console.log('[NavGuard] Password reset flow detected - allowing access');
    if (hasRecoveryToken && !isResetPasswordRoute) {
      console.log('[NavGuard] Recovery token detected, redirecting to reset-password page');
      next({ name: 'ResetPassword' });
      return;
    }
    next();
    return;
  }

  if (!userStore.getAuthIsInitialized) {
    console.warn('[NavGuard] Auth store not yet initialized. Waiting for initialization...');
    await waitForAuthInitialization(userStore);
    await nextTick();
  }

  const isAuthenticated = userStore.getIsAuthenticated;
  const requiresAuth =
    authRequiredRoutes.some((route) => to.path.startsWith(route)) ||
    to.matched.some((record) => record.meta.requiresAuth);
  const isTransitionalRoute = transitionalAuthRoutes.includes(to.path);
  const requiresAdmin = to.matched.some((record) => record.meta.requiresAdmin);
  const isAdmin = userStore.isAdmin;

  if (isAuthenticated) {
    if (isTransitionalRoute && to.name !== 'dashboard') {
      next({ name: 'dashboard' });
    } else if (requiresAdmin && !isAdmin) {
      next({ name: 'AccessDenied' });
    } else {
      next();
    }
  } else {
    if (requiresAuth || requiresAdmin) {
      next({ name: 'Login', query: { redirect: to.fullPath } });
    } else {
      next();
    }
  }
});

export default router;
