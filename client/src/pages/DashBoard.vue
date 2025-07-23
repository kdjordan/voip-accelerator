<template>
  <div class="min-h-screen text-white pt-2 w-full">
    <!-- Service Expiry Banner -->
    <ServiceExpiryBanner 
      v-bind="bannerState"
      @upgrade-clicked="showPaymentModal = true"
    />
    
    <h1 class="text-3xl text-accent uppercase rounded-lg px-4 py-2 font-secondary">Dashboard</h1>

    <!-- Dashboard Content -->
    <div class="flex flex-col gap-6 mb-8">
      <!-- Welcome Box -->
      <div class="bg-gray-800 rounded-lg p-6 border border-gray-700/50">
        <div class="flex flex-col md:flex-row gap-6 items-start md:items-center">
          <!-- User Initial Avatar -->
          <div class="flex-shrink-0">
            <div
              class="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center overflow-hidden border-2 border-accent/30"
            >
              <span class="text-xl font-medium text-accent">{{ userInitials }}</span>
            </div>
          </div>

          <!-- User Info Section -->
          <div class="flex-grow">
            <div class="flex flex-col md:flex-row md:items-center justify-between w-full">
              <div>
                <h2 class="text-xl font-semibold">Welcome back,</h2>
                <p class="text-sm text-gray-400">{{ userStore.auth.user?.email || 'Guest' }}</p>
              </div>
              <!-- Add Logout Button Here -->
              <BaseButton
                @click="handleLogout"
                variant="destructive"
                size="small"
                :is-loading="isLoggingOut"
              >
                <span>Logout</span>
              </BaseButton>
            </div>
          </div>
        </div>

        <!-- Stats Section -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-700/50">
          <div class="bg-gray-900/40 rounded-lg p-4">
            <div class="flex justify-between items-start">
              <div>
                <p class="text-gray-400 text-sm">Last Login</p>
                <p class="text-lg font-medium mt-1">{{ formattedLastLogin }}</p>
              </div>
              <div class="p-2 bg-blue-900/30 rounded-lg border border-blue-400/50">
                <InformationCircleIcon class="h-5 w-5 text-blue-400" />
              </div>
            </div>
          </div>

          <div class="bg-gray-900/40 rounded-lg p-4">
            <div class="flex justify-between items-start">
              <div>
                <p class="text-gray-400 text-sm">Uploads Today</p>
                <p class="text-lg font-medium mt-1">{{ userStore.getUploadsToday }}</p>
              </div>
              <div class="p-2 bg-yellow-900/30 rounded-lg border border-yellow-400/50">
                <ArrowUpTrayIcon class="h-5 w-5 text-yellow-400" />
              </div>
            </div>
          </div>

          <div class="bg-gray-900/40 rounded-lg p-4">
            <div class="flex justify-between items-start">
              <div>
                <p class="text-gray-400 text-sm">Account Created</p>
                <p class="text-lg font-medium mt-1">{{ formattedCreatedAt }}</p>
              </div>
              <div class="p-2 bg-accent/30 rounded-lg border border-accent/50">
                <CalendarDaysIcon class="h-5 w-5 text-accent" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Account & Billing -->
      <AccountBillingCard 
        :is-loading="isRefreshingSubscription"
        @choose-plan="showPaymentModal = true"
        @manage-billing="handleManageBilling"
      />

      <!-- Profile Settings -->
      <ProfileSettingsCard 
        :is-updating-email="isUpdatingEmail"
        :email-success-message="emailSuccessMessage"
        :email-error-message="emailErrorMessage"
        @update-email="updateEmail"
        @delete-account="openDeleteConfirmModal"
      />

    </div>

    <ConfirmationModal
      v-model="showDeleteConfirmModal"
      title="Delete Account Confirmation"
      message="Are you sure you want to permanently delete your account? This action is irreversible and all your data, including call history, settings, and personal information, will be removed."
      confirm-button-text="Yes, Delete My Account"
      cancel-button-text="Cancel"
      :requires-confirmation-phrase="true"
      confirmation-phrase="DELETE"
      @confirm="handleDeleteAccountConfirm"
    />

    <!-- Payment Modal -->
    <PaymentModal 
      v-if="showPaymentModal"
      @close="showPaymentModal = false"
      @select-plan="handlePlanSelection"
    />
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
  import { useUserStore } from '@/stores/user-store';
  import { useAzStore } from '@/stores/az-store';
  import { useUsStore } from '@/stores/us-store';
  import { useLergStoreV2 } from '@/stores/lerg-store-v2';
  import { useLergOperations } from '@/composables/useLergOperations';
  import BaseBadge from '@/components/shared/BaseBadge.vue';
  import type { BaseBadgeProps } from '@/types/app-types';
  import BaseButton from '@/components/shared/BaseButton.vue';
  import { ArrowPathIcon } from '@heroicons/vue/24/outline';
  import {
    InformationCircleIcon,
    ArrowUpTrayIcon,
    CalendarDaysIcon,
    ArrowRightOnRectangleIcon,
  } from '@heroicons/vue/24/solid';
  import { useRouter, useRoute } from 'vue-router';
  import { useBilling } from '@/composables/useBilling';
  import type { PlanTierType } from '@/types/user-types'; // Import PlanTierType
  import ConfirmationModal from '@/components/shared/ConfirmationModal.vue';
  import ServiceExpiryBanner from '@/components/shared/ServiceExpiryBanner.vue';
  import PaymentModal from '@/components/billing/PaymentModal.vue';
  import AccountBillingCard from '@/components/dashboard/AccountBillingCard.vue';
  import ProfileSettingsCard from '@/components/dashboard/ProfileSettingsCard.vue';

  // User store for user info
  const userStore = useUserStore();
  const router = useRouter();
  const route = useRoute();
  
  // Payment modal state
  const showPaymentModal = ref(false);
  
  // Banner state from unified store logic
  const bannerState = computed(() => userStore.getServiceExpiryBanner);
  
  // Loading state for subscription refresh
  const isRefreshingSubscription = ref(false);

  // User data from store (using root store state directly for simplicity)
  // const userProfile = computed(() => userStore.profile);
  // const authUser = computed(() => userStore.user);

  // Adjusted: Fetch plan directly, badge moved below
  const currentPlanTier = computed<PlanTierType | null>(() => userStore.getCurrentPlanTier);

  const currentPlanName = computed(() => {
    const tier = currentPlanTier.value;
    if (!tier) return 'Unknown';
    return tier.charAt(0).toUpperCase() + tier.slice(1);
  });

  const currentPlanBadgeVariant = computed<BaseBadgeProps['variant']>(() => {
    const tier = currentPlanTier.value;
    if (tier === 'trial') {
      return 'warning';
    }
    return 'accent'; // Default for monthly, annual, or unknown
  });

  const userUsage = computed(() => ({ uploadsToday: 0 }));

  // Plan Expiration Information
  const planExpiresAt = computed(() => {
    const endsAt = userStore.getUserProfile?.plan_expires_at;
    return endsAt ? new Date(endsAt) : null;
  });

  const formattedPlanExpiresAt = computed(() => {
    if (!planExpiresAt.value) return 'N/A';
    try {
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }).format(planExpiresAt.value);
    } catch (e) {
      console.error('Error formatting plan_expires_at date:', planExpiresAt.value, e);
      return 'Invalid Date';
    }
  });

  // Computed properties for user display
  const userInitials = computed(() => {
    const email = userStore.auth.user?.email;
    if (!email) return '?';
    const nameSource = email;
    return nameSource
      .split(' ')
      .map((name: string) => name.charAt(0))
      .join('')
      .toUpperCase();
  });

  const formattedLastLogin = computed(() => {
    const lastSignIn = userStore.auth.user?.last_sign_in_at;
    if (!lastSignIn) {
      return 'Never';
    }
    try {
      const date = new Date(lastSignIn);
      const formatted = new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }).format(date);
      return formatted;
    } catch (e) {
      console.error('Error formatting last login date:', lastSignIn, e);
      return 'Invalid Date';
    }
  });

  const formattedCreatedAt = computed(() => {
    const createdAt = userStore.auth.user?.created_at;
    if (!createdAt) {
      return 'Never';
    }
    try {
      const date = new Date(createdAt);
      const formatted = new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }).format(date);
      return formatted;
    } catch (e) {
      console.error('Error formatting account created date:', createdAt, e);
      return 'Invalid Date';
    }
  });

  // Corrected: Only use user.email for display
  const displayEmail = computed(() => {
    return userStore.auth.user?.email || 'Loading...';
  });

  // Email Update State & Logic
  const newEmail = ref('');
  const isUpdatingEmail = ref(false);
  const emailErrorMessage = ref<string | null>(null);
  const emailSuccessMessage = ref<string | null>(null);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@\.]{2,}$/; // Stricter email regex

  async function updateEmail(email: string) {
    const currentEmail = userStore.auth.user?.email;
    if (!email || email === currentEmail || isUpdatingEmail.value) {
      emailErrorMessage.value =
        'Please enter a new, valid email address different from the current one.';
      return;
    }

    isUpdatingEmail.value = true;
    emailErrorMessage.value = null;
    emailSuccessMessage.value = null;

    try {
      await userStore.updateUserEmail(email);
      emailSuccessMessage.value =
        'Email update initiated. Check both email inboxes for confirmation.';
    } catch (error: any) {
      console.error('Update email error:', error);
      emailErrorMessage.value = error.message || 'Failed to update email. Please try again.';
    } finally {
      isUpdatingEmail.value = false;
    }
  }

  // Plan management logic
  async function manageSubscription() {
    isUpdatingEmail.value = true; // Reuse loading state for simplicity, or add a new one
    try {
      // Corrected: Access user via auth state
      const email = userStore.auth.user?.email;
      if (!email) {
        throw new Error('User email not found.');
      }
      // Call your backend/Stripe service to create a portal session
      // const response = await fetch('/api/create-customer-portal', { // Example endpoint
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ customerEmail: email }), // Pass user email or ID
      // });
      // const { url } = await response.json();
      // if (url) {
      //   window.location.href = url; // Redirect to Stripe Portal
      // } else {
      //   throw new Error('Could not create portal session.');
      // }
      console.log('Manage subscription clicked - Placeholder for Stripe Portal integration');
      // Replace console.log with actual API call and redirect
    } catch (error: any) {
      console.error('Manage subscription error:', error);
      // Show error message to user
    } finally {
      isUpdatingEmail.value = false;
    }
  }

  function handlePlanSelection(plan: 'monthly' | 'annual') {
    showPaymentModal.value = false;
    // PaymentModal will handle the checkout redirect
  }

  async function handleManageBilling() {
    try {
      const { openBillingPortal } = useBilling();
      await openBillingPortal();
    } catch (error: any) {
      console.error('Error opening billing portal:', error);
      // Show user-friendly error message
      if (error.message?.includes('No billing information found')) {
        alert('Please subscribe to a plan first to manage your billing.');
      } else {
        alert('Unable to open billing portal. Please try again later.');
      }
    }
  }

  // Watch for user/profile changes if needed
  watch(
    () => userStore.auth.user,
    (newUser) => {
      if (!newEmail.value) {
        // Pre-fill email field if empty and user data is available
        // Let's not prefill automatically anymore, user might want to type fresh
        // newEmail.value = newUser?.email ?? '';
      }
    },
    { immediate: true } // Keep immediate true if needed for other init logic
  );





  // Stores for accessing memory (Pinia) data and triggering updates
  const azStore = useAzStore();
  const usStore = useUsStore();
  const lergStore = useLergStoreV2();

  // LERG initialization - using simplified system
  const { initializeLergData, error: lergError } = useLergOperations();


  // Function to refresh user profile after subscription purchase
  async function refreshUserProfile() {
    console.log('[DashBoard] Refreshing user profile after subscription purchase...');
    isRefreshingSubscription.value = true;
    
    try {
      // Wait a bit for webhook to process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Refresh user profile data
      const userId = userStore.getUser?.id;
      if (userId) {
        await userStore.fetchProfile(userId);
      }
      console.log('[DashBoard] User profile refreshed successfully');
      
      // Clear the subscription success parameter from URL
      if (route.query.subscription === 'success') {
        router.replace({ query: {} });
      }
    } catch (error) {
      console.error('[DashBoard] Failed to refresh user profile:', error);
    } finally {
      isRefreshingSubscription.value = false;
    }
  }

  // SMART LERG initialization - single point of truth for the entire app
  onMounted(async () => {
    console.log('[DashBoard] ========== DASHBOARD MOUNTED: SMART LERG INITIALIZATION ==========');
    
    // Check if user just completed a subscription purchase
    if (route.query.subscription === 'success') {
      console.log('[DashBoard] Detected successful subscription, refreshing profile...');
      await refreshUserProfile();
    }
    
    try {
      // This is the ONLY place in the app that should call initializeLergData
      // It will check Pinia first and only download if empty
      console.log('[DashBoard] Calling smart LERG initialization...');
      await initializeLergData();
      console.log('[DashBoard] LERG initialization completed successfully');
    } catch (err) {
      console.error('[DashBoard] Failed to initialize LERG:', err);
    }

    console.log('[DashBoard] ========== DASHBOARD INITIALIZATION COMPLETE ==========');
  });

  watch(
    () => azStore.filesUploaded.size,
    async (newSize, oldSize) => {
      if (newSize !== oldSize) {
          }
    }
  );

  watch(
    () => usStore.filesUploaded.size,
    async (newSize, oldSize) => {
      if (newSize !== oldSize) {
          }
    }
  );

  const isLoggingOut = ref(false);

  async function handleLogout() {
    isLoggingOut.value = true;
    try {
      await userStore.signOut();
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      emailErrorMessage.value = 'Logout failed. Please try again.';
    } finally {
      isLoggingOut.value = false;
    }
  }

  // Corrected: Only use user.email for display
  // Computed property to determine if the button should be enabled and primary
  const isEmailInputValid = computed(() => {
    const currentEmail = userStore.auth.user?.email;
    const isNotEmpty = newEmail.value.trim() !== '';
    const isDifferent = newEmail.value !== currentEmail;
    const isValidFormat = emailRegex.test(newEmail.value);
    return isNotEmpty && isDifferent && isValidFormat;
  });

  // Delete Account Modal State
  const showDeleteConfirmModal = ref(false);
  const isDeletingAccount = ref(false); // Added for loading state
  const deleteAccountError = ref<string | null>(null); // Added for error message

  // Functions for Delete Account Modal
  function openDeleteConfirmModal() {
    deleteAccountError.value = null; // Clear previous errors
    showDeleteConfirmModal.value = true;
  }

  async function handleDeleteAccountConfirm() {
    if (isDeletingAccount.value) return;

    isDeletingAccount.value = true;
    deleteAccountError.value = null;
    console.log('[DashBoard] Attempting to delete account via userStore...');

    try {
      const result = await userStore.deleteCurrentUserAccount();

      if (result.success) {
        console.log('[DashBoard] Account deleted successfully. Navigating to login.');
        // Display a success toast/notification (implementation depends on a global notification system)
        // Example: toast.success(result.message || 'Your account has been successfully deleted.');
        router.push({ name: 'Login' }); // Assuming 'Login' is the name of your login route
      } else {
        console.error('[DashBoard] Failed to delete account:', result.error);
        deleteAccountError.value =
          result.error?.message ||
          'An unexpected error occurred while deleting your account. Please try again.';
        // Keep modal open to show error, or close and show toast
        // For now, error will be shown if modal is adapted or a separate notification is used.
        // If modal closes automatically, an alternative error display is needed.
        showDeleteConfirmModal.value = false; // Close modal on error for now, or keep open and show error within modal
        // Example: toast.error(deleteAccountError.value);
      }
    } catch (e: any) {
      console.error('[DashBoard] Unexpected error during handleDeleteAccountConfirm:', e);
      deleteAccountError.value = 'A critical error occurred. Please contact support.';
      showDeleteConfirmModal.value = false;
      // Example: toast.error(deleteAccountError.value);
    } finally {
      isDeletingAccount.value = false;
    }
  }
</script>

<style scoped>
  /* Add specific styles if needed, otherwise rely on Tailwind */
</style>
