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

// Transitional or non-content pages for authenticated users to be redirected from
const transitionalAuthRoutes = ['/login', '/signup', '/auth/callback', '/']; // Added root '/' and '/auth/callback'

router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore();

  // It's crucial that the user store, especially auth state, is initialized.
  // Assuming App.vue or a similar entry point awaits userStore.initializeAuthListener()
  if (!userStore.getAuthIsInitialized) {
    console.warn(
      '[NavGuard] Auth store not fully initialized. Navigation might be based on incomplete state. Waiting for initialization is recommended.'
    );
    // In a real-world scenario, you might want to implement a more robust waiting mechanism
    // or ensure initializeAuthListener always completes before any navigation.
  }

  const isAuthenticated = userStore.getIsAuthenticated;
  const requiresAuth = authRequiredRoutes.some((route) => to.path.startsWith(route));
  // const isPublicOnly = publicOnlyRoutes.includes(to.path); // Replaced by transitionalAuthRoutes logic
  const isTransitionalRoute = transitionalAuthRoutes.includes(to.path);
  const requiresAdmin = to.matched.some((record) => record.meta.requiresAdmin);
  const isAdmin = userStore.getUserRole === 'admin';

  console.log(
    `NavGuard Check: To: ${to.path}, IsAuth: ${isAuthenticated}, RequiresAuth: ${requiresAuth}, IsTransitional: ${isTransitionalRoute}, RequiresAdmin: ${requiresAdmin}, IsAdmin: ${isAdmin}`
  );

  if (isAuthenticated) {
    if (isTransitionalRoute) {
      console.log(
        '[NavGuard] Authenticated user on a transitional route. Redirecting to dashboard.'
      );
      next({ name: 'dashboard' }); // Use name for clarity, assuming 'dashboard' is defined
    } else if (requiresAdmin && !isAdmin) {
      console.log(
        '[NavGuard] Authenticated user lacks admin rights for admin route. Redirecting to dashboard.'
      );
      next({ name: 'dashboard' }); // Or an 'Unauthorized' page
    } else {
      console.log('[NavGuard] Authenticated user. Allowing navigation.');
      next();
    }
  } else {
    // Not authenticated
    if (requiresAuth) {
      console.log('[NavGuard] Unauthenticated user on a protected route. Redirecting to login.');
      next({ name: 'Login', query: { redirect: to.fullPath } });
    } else {
      console.log('[NavGuard] Unauthenticated user. Allowing navigation to public route.');
      next();
    }
  }
});

export default router;
