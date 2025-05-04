import { createRouter, createWebHistory } from 'vue-router';
import { adminRoutes } from './admin-routes';
import { useUserStore } from '@/stores/user-store';
import { supabase } from '@/services/supabase.service';
import { Session } from '@supabase/supabase-js';

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
    console.log('scrollBehavior triggered:', { to, from, savedPosition });
    // If there's a hash, scroll to it smoothly
    if (to.hash) {
      console.log('Hash found:', to.hash);
      return {
        el: to.hash,
        behavior: 'smooth',
      };
    }

    // If there's a saved position (from browser back/forward),
    // return it to restore the previous scroll position
    if (savedPosition) {
      console.log('Using saved position:', savedPosition);
      return savedPosition;
    }

    // Otherwise, scroll to the top of the page
    console.log('Scrolling to top');
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

router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore();

  // Ensure the store is initialized before proceeding.
  // This should be guaranteed by awaiting initializeAuthListener in App.vue's onMounted.
  if (!userStore.getAuthIsInitialized) {
    console.warn(
      '[NavGuard] Auth store not initialized yet. Waiting for initialization. This might indicate an issue if it repeats.'
    );
    // Optionally, wait for initialization here, though ideally it's done before mount.
    // Example (requires adding a watcher or event bus):
    // await new Promise(resolve => { /* wait for store.isInitialized to be true */ });
    // For now, we assume App.vue's await handles this.
  }

  const isAuthenticated = userStore.getIsAuthenticated;
  const requiresAuth = authRequiredRoutes.some((route) => to.path.startsWith(route));
  const isPublicOnly = publicOnlyRoutes.includes(to.path);
  const requiresAdmin = to.matched.some((record) => record.meta.requiresAdmin);
  const isAdmin = userStore.getUserRole === 'admin'; // Use the getter for role

  console.log(
    `NavGuard Check: To: ${to.path}, RequiresAuth: ${requiresAuth}, PublicOnly: ${isPublicOnly}, IsAuth: ${isAuthenticated}, RequiresAdmin: ${requiresAdmin}, IsAdmin: ${isAdmin}`
  );

  if (requiresAuth && !isAuthenticated) {
    // Redirect unauthenticated users from protected routes to login
    console.log('[NavGuard] Redirecting to login (requires auth, not authenticated)');
    next({ path: '/login', query: { redirect: to.fullPath } }); // Store intended path
  } else if (isPublicOnly && isAuthenticated) {
    // Redirect authenticated users from public-only routes to dashboard
    console.log('[NavGuard] Redirecting to dashboard (public only, authenticated)');
    next({ path: '/dashboard' });
  } else if (requiresAdmin && !isAdmin) {
    // Redirect non-admin users from admin routes
    console.log('[NavGuard] Redirecting to dashboard (requires admin, not admin)');
    // Or redirect to an 'unauthorized' page: next({ name: 'Unauthorized' });
    next({ path: '/dashboard' });
  } else {
    // Allow navigation
    console.log('[NavGuard] Allowing navigation');
    next();
  }
});

export default router;
