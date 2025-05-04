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
  let currentSession: Session | null = null;

  // Attempt to get the current session status directly
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    currentSession = session;
    // Update store state based on this check if it hasn't initialized yet
    // (This slightly duplicates listener logic but ensures guard has fresh data)
    if (!userStore.auth.isStateInitialized) {
      userStore.auth.user = session?.user ?? null;
      userStore.auth.isAuthenticated = !!session;
      if (session?.user && !userStore.auth.profile) {
        // Fetch profile only if needed and session exists
        // Avoid fetching if profile might already be loading from listener
        if (!userStore.auth.isLoading) {
          console.log(
            '[NavGuard] Initializing state & profile null. Calling fetchProfile for user:',
            session.user.id
          );
          await userStore.fetchProfile(session.user.id);
        } else {
          console.log(
            '[NavGuard] Initializing state & profile null, but store is already loading. Skipping fetchProfile call.'
          );
        }
      } else if (!session) {
        console.log('[NavGuard] Initializing state: No session found, clearing auth data.');
        userStore.clearAuthData();
      }
      userStore.auth.isStateInitialized = true; // Mark initialized *after* potential update
    }
  } catch (e) {
    console.error('Error fetching session in router guard:', e);
    // Decide how to handle error - maybe allow navigation or redirect to error page/login?
    // For now, let's clear auth data just in case
    userStore.clearAuthData();
    // Ensure isAuthenticated reflects the error state
    currentSession = null;
  }

  // Use the freshly checked session status for the guard logic
  // Also check the store's state as a fallback/confirmation, as listener might have updated it
  const isAuthenticated = !!currentSession || userStore.auth.isAuthenticated;
  const requiresAuth = authRequiredRoutes.some((route) => to.path.startsWith(route));
  const isPublicOnly = publicOnlyRoutes.includes(to.path);

  console.log(
    `NavGuard Check: To: ${to.path}, RequiresAuth: ${requiresAuth}, PublicOnly: ${isPublicOnly}, Authenticated: ${isAuthenticated} (Session: ${!!currentSession}, Store: ${userStore.auth.isAuthenticated})`
  );

  if (requiresAuth && !isAuthenticated) {
    // Redirect unauthenticated users from protected routes to login
    console.log('Redirecting to login (requires auth, not authenticated)');
    next({ path: '/login', query: { redirect: to.fullPath } }); // Store intended path
  } else if (isPublicOnly && isAuthenticated) {
    // Redirect authenticated users from public-only routes to dashboard
    console.log('Redirecting to dashboard (public only, authenticated)');
    next({ path: '/dashboard' });
  } else {
    // Allow navigation
    console.log('Allowing navigation');
    next();
  }
});

export default router;
