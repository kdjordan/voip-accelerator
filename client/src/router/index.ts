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
      path: '/admin/lerg',
      name: 'AdminLerg',
      component: () => import('@/pages/AdminView.vue'),
      meta: { requiresAuth: true, requiresAdmin: true },
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
      component: () => import('@/pages/auth/LoginPage.vue'), // Adjust path if needed
      meta: { requiresAuth: false, hideWhenAuthed: true },
    },
    {
      path: '/signup',
      name: 'SignUp',
      component: () => import('@/pages/auth/SignUpPage.vue'), // Adjust path if needed
      meta: { requiresAuth: false, hideWhenAuthed: true },
    },
    {
      path: '/auth/callback',
      name: 'AuthCallback',
      component: () => import('@/pages/auth/AuthCallbackPage.vue'),
      meta: { requiresAuth: false }, // Publicly accessible, guards will redirect if user logs in
    },

    // Spread the admin routes
    ...adminRoutes,
    {
      path: '/:pathMatch(.*)*', // Catch-all route
      name: 'notFound',
      component: () => import('@/pages/NotFoundView.vue'),
    },
  ],
  scrollBehavior(to, from, savedPosition) {
    // If there's a hash, scroll to it smoothly
    if (to.hash) {
      return {
        el: to.hash,
        behavior: 'smooth',
      };
    }

    // If there's a saved position (from browser back/forward),
    // return it to restore the previous scroll position
    if (savedPosition) {
      return savedPosition;
    }

    // Otherwise, scroll to the top of the page
    return { top: 0 };
  },
});

// --- Navigation Guards ---

// Routes that require authentication
const authRequiredRoutes = [
  '/dashboard',
  '/az-rate-sheet',
  '/us-rate-sheet',
  '/azview',
  '/usview',
  '/admin/lerg',
  // Add any other admin routes from adminRoutes if needed
];

// Routes only accessible when logged out
const publicOnlyRoutes = [
  '/login',
  '/signup',
  // Add password reset, etc. if they exist and should be public only
];

// Transitional or non-content pages for authenticated users to be redirected from
const transitionalAuthRoutes = ['/login', '/signup', '/auth/callback', '/']; // Added root '/' and '/auth/callback'

// Helper function to wait for auth initialization
async function waitForAuthInitialization(
  userStoreInstance: ReturnType<typeof useUserStore>
): Promise<void> {
  if (userStoreInstance.getAuthIsInitialized) {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    const unwatch = userStoreInstance.$subscribe((_mutation, state) => {
      // Using state from $subscribe to check the new value of isInitialized
      if (state.auth.isInitialized) {
        unwatch(); // Stop watching
        resolve();
      }
    });
    // Fallback check in case the state was already updated when $subscribe was called
    // or if a direct action was too quick for $subscribe to catch the change before initial check.
    if (userStoreInstance.getAuthIsInitialized) {
      unwatch();
      resolve();
    }
  });
}

router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore();

  if (!userStore.getAuthIsInitialized) {
    console.warn('[NavGuard] Auth store not yet initialized. Waiting for initialization...');
    await waitForAuthInitialization(userStore);
    // After waiting for isInitialized, wait for one more tick for related reactive updates
    // like isAuthenticated potentially being set by onAuthStateChange if a session was found.

    await nextTick();
  }

  const isAuthenticated = userStore.getIsAuthenticated;
  const authIsInitialized = userStore.getAuthIsInitialized; // Should be true here
  const requiresAuth =
    authRequiredRoutes.some((route) => to.path.startsWith(route)) ||
    to.matched.some((record) => record.meta.requiresAuth);
  const isTransitionalRoute = transitionalAuthRoutes.includes(to.path);
  const requiresAdmin = to.matched.some((record) => record.meta.requiresAdmin);
  const isAdmin = userStore.isAdmin; // Use the isAdmin getter

  if (isAuthenticated) {
    if (isTransitionalRoute && to.name !== 'dashboard') {
      // Avoid redirect loop
      next({ name: 'dashboard' });
    } else if (requiresAdmin && !isAdmin) {
      next({ name: 'dashboard' }); // Or a specific 'Not Authorized' page
    } else {
      next();
    }
  } else {
    // Not authenticated
    // if (authIsInitialized) { // This check might be redundant due to waitForAuthInitialization
    if (requiresAuth || requiresAdmin) {
      // If route requires auth or specifically admin and user is not logged in
      next({ name: 'Login', query: { redirect: to.fullPath } });
    } else {
      next();
    }
    // } else {
    // Auth not yet initialized - this block should ideally not be hit if waitForAuthInitialization works as expected.
    // next();
    // }
  }
});

export default router;
