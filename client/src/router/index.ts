import { createRouter, createWebHistory } from 'vue-router';
import { nextTick } from 'vue';
import { adminRoutes } from './admin-routes';
import { useUserStore } from '@/stores/user-store';
import { supabase } from '@/utils/supabase';

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
    {
      path: '/billing',
      name: 'billing',
      component: () => import('@/pages/BillingPage.vue'),
      meta: { requiresAuth: true },
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
      meta: { requiresAuth: false }, // Publicly accessible, guards will redirect if user logs in
    },

    // Spread the admin routes
    ...adminRoutes,
    {
      path: '/access-denied',
      name: 'AccessDenied',
      component: () => import('@/pages/AccessDeniedView.vue'),
    },
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
  '/rate-gen',
  '/admin',
  '/billing',
  // Add any other admin routes from adminRoutes if needed
];

// Routes that require active subscription (bypass billing page)
const subscriptionRequiredRoutes = [
  '/az-rate-sheet',
  '/us-rate-sheet',
  '/azview',
  '/usview',
  '/rate-gen',
];

// Routes that require upload capability (blocked for Optimizer users at limit)
const uploadRequiredRoutes = [
  '/az-rate-sheet',
  '/us-rate-sheet',
  '/azview',
  '/usview', 
  '/rate-gen',
];

// Routes only accessible when logged out
const publicOnlyRoutes = [
  '/login',
  '/signup',
  // Add password reset, etc. if they exist and should be public only
];

// Transitional or non-content pages for authenticated users to be redirected from
const transitionalAuthRoutes = ['/login', '/signup', '/forgot-password', '/auth/callback', '/']; // Added root '/', '/auth/callback', and '/forgot-password'

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

// Helper function to check if user has valid subscription (no upload limits, just subscription status check)
async function checkUploadLimit(userId: string): Promise<boolean> {
  try {
    // All paid users have unlimited uploads - only check subscription status
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('subscription_status, cancel_at_period_end, cancel_at')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error checking subscription status:', error);
      return true; // Allow access on error (fail-safe)
    }

    // Check if subscription is scheduled for cancellation and past the cancel date
    if (profile.cancel_at_period_end && profile.cancel_at) {
      const cancelDate = new Date(profile.cancel_at);
      const now = new Date();
      if (now >= cancelDate) {
        console.log('Upload blocked: subscription cancellation date has passed');
        return false; // Block uploads after cancellation date
      }
    }

    // Check if subscription is canceled
    if (profile.subscription_status === 'canceled') {
      console.log('Upload blocked: subscription is canceled');
      return false; // Block uploads for canceled subscriptions
    }

    // All active/trial users have unlimited uploads
    return true;

  } catch (err) {
    console.error('Error checking subscription status:', err);
    return true; // Allow access on error (fail-safe)
  }
}

// Helper function to check if user has active subscription or trial
async function checkSubscriptionStatus(userId: string): Promise<boolean> {
  try {
    // Direct database query for subscription status - more reliable than edge function
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('subscription_status, current_period_end, plan_expires_at, cancel_at_period_end, cancel_at')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('Error checking subscription status:', error);
      return false;
    }
    
    const now = new Date();
    
    // Check if subscription is already canceled
    if (profile.subscription_status === 'canceled') {
      console.log('Access blocked: subscription is canceled');
      return false;
    }
    
    // Check if user has active subscription
    if (profile.subscription_status === 'active' || profile.subscription_status === 'monthly' || profile.subscription_status === 'annual') {
      // If scheduled for cancellation, check if we're still within the paid period
      if (profile.cancel_at_period_end && profile.cancel_at) {
        const cancelDate = new Date(profile.cancel_at);
        if (now >= cancelDate) {
          console.log('Access blocked: subscription cancellation date has passed');
          return false;
        }
        // Still within paid period, allow access
        return true;
      }
      
      // Normal active subscription check
      const expirationDate = profile.current_period_end ? new Date(profile.current_period_end) : null;
      return !expirationDate || expirationDate > now;
    }
    
    // Check if trial is still active
    if (profile.subscription_status === 'trial' && profile.plan_expires_at) {
      const trialEnd = new Date(profile.plan_expires_at);
      return now < trialEnd;
    }
    
    return false;
  } catch (err) {
    console.error('Error checking subscription status:', err);
    return false; // Fail safe
  }
}

router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore();

  // ALWAYS allow password reset page regardless of auth state
  // This must be first to prevent any redirects during password recovery
  // Also check URL hash for recovery token (Supabase puts it in #access_token=...&type=recovery)
  const isResetPasswordRoute = to.name === 'ResetPassword' || to.path === '/reset-password';
  const hasRecoveryToken = window.location.hash.includes('type=recovery');

  if (isResetPasswordRoute || hasRecoveryToken) {
    console.log('[NavGuard] Password reset flow detected - allowing access', {
      isResetPasswordRoute,
      hasRecoveryToken
    });
    // If we have a recovery token but are not on reset-password page, redirect there
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
    // After waiting for isInitialized, wait for one more tick for related reactive updates
    // like isAuthenticated potentially being set by onAuthStateChange if a session was found.

    await nextTick();
  }

  const isAuthenticated = userStore.getIsAuthenticated;
  const authIsInitialized = userStore.getAuthIsInitialized; // Should be true here
  const requiresAuth =
    authRequiredRoutes.some((route) => to.path.startsWith(route)) ||
    to.matched.some((record) => record.meta.requiresAuth);
  const requiresSubscription = subscriptionRequiredRoutes.some((route) => to.path.startsWith(route));
  const requiresUpload = uploadRequiredRoutes.some((route) => to.path.startsWith(route));
  const isTransitionalRoute = transitionalAuthRoutes.includes(to.path);
  const requiresAdmin = to.matched.some((record) => record.meta.requiresAdmin);
  const isAdmin = userStore.isAdmin; // Use the isAdmin getter

  if (isAuthenticated) {

    // Check if user needs to complete billing (paid tier but no stripe_customer_id)
    // Skip this check if already going to billing page or returning from Stripe
    const isReturningFromStripe = to.query.subscription === 'success' || from.name === 'billing';

    if (to.name !== 'billing' && !isReturningFromStripe && userStore.shouldRedirectToBilling) {
      console.log('[Router] User needs to complete billing, redirecting...');
      const tier = userStore.getUserProfile?.subscription_tier;
      next({
        name: 'billing',
        query: { tier, autoCheckout: 'true' }
      });
      return;
    }

    if (isTransitionalRoute && to.name !== 'dashboard') {
      // Avoid redirect loop
      next({ name: 'dashboard' });
    } else if (requiresAdmin && !isAdmin) {
      next({ name: 'AccessDenied' });
    } else if (requiresSubscription && to.name !== 'billing') {
      // Check subscription status for protected routes
      const hasActiveSubscription = await checkSubscriptionStatus(userStore.getUser?.id || '');
      
      if (!hasActiveSubscription) {
        // Redirect to billing page if no active subscription
        next({ name: 'billing', query: { redirect: to.fullPath } });
        return;
      }
      
      // Additional check for upload routes - ensure Optimizer users haven't hit their limit
      if (requiresUpload && to.name !== 'dashboard') {
        const canUpload = await checkUploadLimit(userStore.getUser?.id || '');
        
        if (!canUpload) {
          // Redirect to dashboard where ServiceExpiryBanner will show upload limit message
          next({ name: 'dashboard', query: { uploadLimitReached: 'true' } });
          return;
        }
      }
      
      next();
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
