<template>
  <div class="text-white pt-2 w-full">
    <!-- Service Expiry Banner -->
    <ServiceExpiryBanner 
      v-bind="bannerState"
      @upgrade-clicked="handleUpgradeFromExpiry"
    />
    
    <!-- Dashboard Content -->
    <div class="flex flex-col gap-6 mb-8 px-4">
      <h1 class="relative">
      <span class="text-xl md:text-2xl text-accent uppercase rounded-lg px-4 py-2 font-secondary">
        WELCOME BACK
      </span>
      <!-- Info Icon Button -->

    </h1>
      <!-- Three Column Account Section -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- Bento 1: Account Information -->
        <div class="bg-gray-800 rounded-lg p-5 border border-gray-700/50 flex flex-col">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-base font-semibold text-white">Account Information</h3>
            <div class="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center border border-accent/50 flex-shrink-0">
              <span class="text-xs font-medium text-accent">{{ userInitials }}</span>
            </div>
          </div>

          <!-- Email -->
          <div class="text-sm mb-3">
            <span class="text-gray-400 block mb-1">Email:</span>
            <span class="text-gray-300">{{ displayEmail }}</span>
          </div>

          <!-- Email Edit Form -->
          <div v-if="isEditingEmail" class="w-full space-y-2 mb-3">
            <input
              v-model="newEmail"
              type="email"
              placeholder="Enter new email"
              class="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent text-sm"
              @keyup.enter="updateEmail(newEmail)"
              @keyup.escape="cancelEmailEdit"
            />
            <div class="flex gap-2">
              <BaseButton
                @click="updateEmail(newEmail)"
                :disabled="!isEmailInputValid"
                :loading="isUpdatingEmail"
                variant="primary"
                size="small"
                class="flex-1"
              >
                Save
              </BaseButton>
              <BaseButton
                @click="cancelEmailEdit"
                variant="destructive"
                size="small"
                class="flex-1"
              >
                Cancel
              </BaseButton>
            </div>
            <div v-if="emailSuccessMessage" class="text-green-400 text-xs">
              {{ emailSuccessMessage }}
            </div>
            <div v-if="emailErrorMessage" class="text-red-400 text-xs">
              {{ emailErrorMessage }}
            </div>
          </div>

          <!-- Buttons at bottom -->
          <div class="flex justify-between mt-auto">
            <!-- Update Email Button -->
            <BaseButton
              v-if="!isEditingEmail"
              @click="isEditingEmail = true"
              variant="secondary"
              size="small"
              style="width: 33.333%;"
            >
              Update Email
            </BaseButton>

            <!-- Logout Button -->
            <BaseButton
              @click="handleLogout"
              variant="destructive"
              size="small"
              :is-loading="isLoggingOut"
              style="width: 33.333%;"
            >
              Logout
            </BaseButton>
          </div>
        </div>

        <!-- Bento 2: Plan Information -->
        <div class="bg-gray-800 rounded-lg p-5 border border-gray-700/50 flex flex-col">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-base font-semibold text-white">Plan Information</h3>
            <BaseBadge :variant="currentPlanBadgeVariant" size="small">
              {{ currentPlanTier === 'trial' ? 'Trial Plan' : `${currentPlanName} Plan` }}
            </BaseBadge>
          </div>

          <!-- Expires -->
          <div class="text-sm mb-3">
            <span class="text-gray-400 block mb-1">Expires:</span>
            <span class="text-gray-300">{{ formattedPlanExpiresAt }}</span>
          </div>

          <!-- Button -->
          <div class="mt-auto" style="width: 33.333%;">
            <BaseButton
              @click="showPlanSelectorModal = true"
              variant="secondary"
              size="small"
            >
              Manage Plan
            </BaseButton>
          </div>
        </div>

        <!-- Bento 3: Activity -->
        <div class="bg-gray-800 rounded-lg p-5 border border-gray-700/50">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-base font-semibold text-white">Activity</h3>
            <div class="w-6 h-6 rounded-full border border-accent/50 bg-accent/20 flex items-center justify-center flex-shrink-0">
              <ClockIcon class="w-4 h-4 text-accent" />
            </div>
          </div>

          <div class="flex flex-col gap-3">
            <!-- Last Login -->
            <div class="text-sm">
              <span class="text-gray-400 block mb-1">Last Login</span>
              <span class="text-gray-300">{{ formattedLastLogin }}</span>
            </div>

            <!-- Member Since -->
            <div class="text-sm">
              <span class="text-gray-400 block mb-1">Member Since</span>
              <span class="text-gray-300">{{ formattedCreatedAt }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="bg-gray-800 rounded-lg p-6 border border-gray-700/50">
        <h3 class="text-lg font-semibold text-white mb-5">Quick Actions</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- US Reporting -->
          <button
            @click="$router.push('/usview')"
            class="bg-gray-700/30 hover:bg-accent/10 border border-accent/30 hover:border-accent/50 rounded-lg p-5 transition-all group text-left"
          >
            <div class="flex items-center gap-3 mb-2">
              <div class="w-10 h-10 rounded-lg border border-accent/50 bg-accent/20 flex items-center justify-center group-hover:bg-accent/30 transition-colors">
                <GlobeAmericasIcon class="w-6 h-6 text-accent" />
              </div>
              <h4 class="text-base font-semibold text-white">US Reporting</h4>
            </div>
            <p class="text-sm text-gray-400">Compare and analyze NPANXX rate decks</p>
          </button>

          <!-- AZ Reporting -->
          <button
            @click="$router.push('/azview')"
            class="bg-gray-700/30 hover:bg-accent/10 border border-accent/30 hover:border-accent/50 rounded-lg p-5 transition-all group text-left"
          >
            <div class="flex items-center gap-3 mb-2">
              <div class="w-10 h-10 rounded-lg border border-accent/50 bg-accent/20 flex items-center justify-center group-hover:bg-accent/30 transition-colors">
                <GlobeAltIcon class="w-6 h-6 text-accent" />
              </div>
              <h4 class="text-base font-semibold text-white">AZ Reporting</h4>
            </div>
            <p class="text-sm text-gray-400">Compare and analyze AZ rate decks</p>
          </button>

          <!-- US Rate Wizard -->
          <button
            @click="$router.push('/us-rate-sheet')"
            class="bg-gray-700/30 hover:bg-accent/10 border border-accent/30 hover:border-accent/50 rounded-lg p-5 transition-all group text-left"
          >
            <div class="flex items-center gap-3 mb-2">
              <div class="w-10 h-10 rounded-lg border border-accent/50 bg-accent/20 flex items-center justify-center group-hover:bg-accent/30 transition-colors">
                <AdjustmentsVerticalIcon class="w-6 h-6 text-accent" />
              </div>
              <h4 class="text-base font-semibold text-white">US Rate Wizard</h4>
            </div>
            <p class="text-sm text-gray-400">Fine tune NPANXX rate decks</p>
          </button>

          <!-- AZ Rate Wizard -->
          <button
            @click="$router.push('/az-rate-sheet')"
            class="bg-gray-700/30 hover:bg-accent/10 border border-accent/30 hover:border-accent/50 rounded-lg p-5 transition-all group text-left"
          >
            <div class="flex items-center gap-3 mb-2">
              <div class="w-10 h-10 rounded-lg border border-accent/50 bg-accent/20 flex items-center justify-center group-hover:bg-accent/30 transition-colors">
                <AdjustmentsVerticalIcon class="w-6 h-6 text-accent" />
              </div>
              <h4 class="text-base font-semibold text-white">AZ Rate Wizard</h4>
            </div>
            <p class="text-sm text-gray-400">Fine tune AZ rate decks</p>
          </button>

          <!-- Rate Generation -->
          <button
            @click="$router.push('/rate-gen/us')"
            class="bg-gray-700/30 hover:bg-accent/10 border border-accent/30 hover:border-accent/50 rounded-lg p-5 transition-all group text-left"
          >
            <div class="flex items-center gap-3 mb-2">
              <div class="w-10 h-10 rounded-lg border border-accent/50 bg-accent/20 flex items-center justify-center group-hover:bg-accent/30 transition-colors">
                <SparklesIcon class="w-6 h-6 text-accent" />
              </div>
              <h4 class="text-base font-semibold text-white">Rate Generation</h4>
            </div>
            <p class="text-sm text-gray-400">Generate NPANXX rate decks from up to 5 providers</p>
          </button>
        </div>
      </div>

      <!-- Delete Account Button -->
      <div class="flex justify-end">
        <BaseButton
          @click="openDeleteConfirmModal"
          variant="destructive"
          size="small"
        >
          Delete Account
        </BaseButton>
      </div>

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

    <!-- Cancel Subscription Modal -->
    <ConfirmationModal
      v-model="showCancelSubscriptionModal"
      title="Cancel Subscription"
      message="Are you sure you want to cancel your subscription? Your subscription will remain active until the end of your current billing period, and you'll continue to have access to all features until then."
      confirm-button-text="Yes, Cancel Subscription"
      cancel-button-text="Keep Subscription"
      :loading="isCancellingSubscription"
      @confirm="confirmCancelSubscription"
      @cancel="cancelCancelSubscription"
    />

    <!-- Account Deletion Success Modal (Scheduled) -->
    <ConfirmationModal
      v-model="showDeletionScheduledModal"
      title="Account Deletion Scheduled"
      :message="deletionScheduledMessage"
      confirm-button-text="I Understand"
      :cancel-button-text="undefined"
      confirm-button-variant="primary"
      @confirm="closeDeletionScheduledModal"
    />

    <!-- Plan Selector Modal (Unified for all subscription flows) -->
    <PlanSelectorModal
      v-if="showPlanSelectorModal"
      :is-trial-expired="true"
      @close="showPlanSelectorModal = false"
      @select-plan="handlePlanSelectorSelection"
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
  import { useSessionHeartbeat } from '@/composables/useSessionHeartbeat';
  import BaseBadge from '@/components/shared/BaseBadge.vue';
  import type { BaseBadgeProps } from '@/types/app-types';
  import BaseButton from '@/components/shared/BaseButton.vue';
  import {
    ArrowPathIcon,
    PencilIcon,
    GlobeAmericasIcon,
    GlobeAltIcon,
    AdjustmentsVerticalIcon,
    SparklesIcon,
    ClockIcon
  } from '@heroicons/vue/24/outline';
  import {
    ArrowRightOnRectangleIcon,
  } from '@heroicons/vue/24/solid';
  import { useRouter, useRoute } from 'vue-router';
  import { useBilling } from '@/composables/useBilling';
  import type { PlanTierType, SubscriptionTier } from '@/types/user-types'; // Import PlanTierType
  import ConfirmationModal from '@/components/shared/ConfirmationModal.vue';
  import ServiceExpiryBanner from '@/components/shared/ServiceExpiryBanner.vue';
  import PlanSelectorModal from '@/components/billing/PlanSelectorModal.vue';
  import { supabase } from '@/utils/supabase';
  

  // User store for user info
  const userStore = useUserStore();
  const router = useRouter();
  const route = useRoute();

  // Session heartbeat to detect force logouts
  const { checkSessionValidity } = useSessionHeartbeat();
  
  // Plan selector modal state (unified for all subscription flows)
  const showPlanSelectorModal = ref(false);
  
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
    if (tier === 'trial') return 'Free Trial';
    return tier.charAt(0).toUpperCase() + tier.slice(1);
  });

  const currentPlanBadgeVariant = computed<BaseBadgeProps['variant']>(() => {
    const tier = currentPlanTier.value;
    if (tier === 'trial') {
      return 'warning';
    }
    return 'info'; // Blue variant for monthly, annual, or unknown
  });

  function getMonthlyPrice() {
    const tier = currentPlanTier.value;
    switch (tier) {
      case 'trial':
        return '0.00'; // Trial is free
      case 'optimizer':
        return '99.00';
      case 'accelerator':
        return '249.00';
      default:
        return '0.00';
    }
  }

  // Upload tracking computeds
  const uploadStats = computed(() => {
    const profile = userStore.getUserProfile;
    const tier = userStore.getCurrentPlanTier;
    const totalUploads = profile?.total_uploads ?? 0;

    // Simplified: All plans are unlimited now, just track total uploads for analytics
    return {
      tier,
      uploads: totalUploads,
      remaining: null, // No limits anymore
      percentage: 0, // No limits anymore
      isUnlimited: true, // All plans unlimited
      limit: null, // No limits anymore
      allTimeUploads: totalUploads
    };
  });

  const uploadProgressColor = computed(() => {
    const percentage = uploadStats.value.percentage;
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 80) return 'bg-yellow-500';
    return 'bg-accent';
  });

  const uploadStatusMessage = computed(() => {
    // Simplified: No limits, just show total uploads
    return `${uploadStats.value.uploads} total uploads`;
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

  // Cancellation status
  const isCancellationScheduled = computed(() => {
    const profile = userStore.getUserProfile;
    return profile?.cancel_at_period_end && profile?.cancel_at;
  });

  function formatCancelDate() {
    const profile = userStore.getUserProfile;
    if (!profile?.cancel_at) return 'N/A';
    try {
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(new Date(profile.cancel_at));
    } catch (e) {
      console.error('Error formatting cancel_at date:', profile.cancel_at, e);
      return 'Invalid Date';
    }
  }

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
  const isEditingEmail = ref(false);
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
      // Auto-close the edit form after successful update
      setTimeout(() => {
        isEditingEmail.value = false;
        newEmail.value = '';
      }, 3000);
    } catch (error: any) {
      console.error('Update email error:', error);
      emailErrorMessage.value = error.message || 'Failed to update email. Please try again.';
    } finally {
      isUpdatingEmail.value = false;
    }
  }

  function cancelEmailEdit() {
    isEditingEmail.value = false;
    newEmail.value = '';
    emailErrorMessage.value = null;
    emailSuccessMessage.value = null;
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

  // Handler for upgrade clicked from expiry banner
  function handleUpgradeFromExpiry() {
    showPlanSelectorModal.value = true;
  }
  
  // Handler for plan selection from PlanSelectorModal
  async function handlePlanSelectorSelection(billingPeriod: 'monthly' | 'annual' | 'test') {
    showPlanSelectorModal.value = false;

    try {
      const { createCheckoutSession } = useBilling();

      // Get the correct price ID based on billing period
      let priceId: string;
      if (billingPeriod === 'test') {
        priceId = import.meta.env.VITE_STRIPE_PRICE_TEST_CHARGE;
      } else if (billingPeriod === 'annual') {
        priceId = import.meta.env.VITE_STRIPE_PRICE_ANNUAL_ACCELERATOR;
      } else {
        priceId = import.meta.env.VITE_STRIPE_PRICE_MONTHLY_ACCELERATOR;
      }

      console.log('📋 Environment check:', {
        billingPeriod,
        monthlyPriceId: import.meta.env.VITE_STRIPE_PRICE_MONTHLY_ACCELERATOR,
        annualPriceId: import.meta.env.VITE_STRIPE_PRICE_ANNUAL_ACCELERATOR,
        testPriceId: import.meta.env.VITE_STRIPE_PRICE_TEST_CHARGE,
        selectedPriceId: priceId,
      });

      if (!priceId) {
        throw new Error(`Price ID not found for ${billingPeriod} plan. Check environment variables.`);
      }

      console.log(`🚀 Creating checkout session for ${billingPeriod} Accelerator plan`);
      await createCheckoutSession(priceId, 'accelerator');

    } catch (error: any) {
      console.error('Upgrade checkout error:', error);

      // Enhanced error messaging
      let errorMessage = 'Failed to start checkout';
      if (error.message) {
        errorMessage += `: ${error.message}`;
      }
      if (error.details) {
        errorMessage += ` (${error.details})`;
      }

      console.error('Full error object:', JSON.stringify(error, null, 2));
      alert(errorMessage);

      // Reopen modal on error
      showPlanSelectorModal.value = true;
    }
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

  function handleCancelSubscription() {
    showCancelSubscriptionModal.value = true;
  }

  async function confirmCancelSubscription() {
    try {
      isCancellingSubscription.value = true;
      const { openBillingPortal } = useBilling();
      await openBillingPortal();
      // TODO: Add direct cancellation API call when edge functions are working
      // For now, redirect to Stripe portal where users can cancel
      showCancelSubscriptionModal.value = false;
    } catch (error: any) {
      console.error('Error opening cancellation portal:', error);
      alert('Unable to open cancellation portal. Please try again later.');
    } finally {
      isCancellingSubscription.value = false;
    }
  }

  function cancelCancelSubscription() {
    showCancelSubscriptionModal.value = false;
  }

  function closeDeletionScheduledModal() {
    showDeletionScheduledModal.value = false;
    deletionScheduledMessage.value = '';
  }

  async function handleReactivateSubscription() {
    try {
      const { openBillingPortal } = useBilling();
      await openBillingPortal();
      // TODO: Add direct reactivation API call when edge functions are working
      // For now, redirect to Stripe portal where users can reactivate
    } catch (error: any) {
      console.error('Error opening reactivation portal:', error);
      alert('Unable to open reactivation portal. Please try again later.');
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
    
    // Ensure profile is loaded before checking billing redirect
    const userId = userStore.getUser?.id;
    if (userId && !userStore.getUserProfile) {
      console.log('[DashBoard] Profile not loaded yet, fetching...');
      await userStore.fetchProfile(userId);
    }
    
    // Check if user needs to be redirected to billing (paid signup after email confirmation)
    console.log('[DashBoard] Checking billing redirect...');
    console.log('[DashBoard] Profile:', userStore.getUserProfile);
    console.log('[DashBoard] Should redirect to billing:', userStore.shouldRedirectToBilling);
    
    if (userStore.shouldRedirectToBilling) {
      console.log('[DashBoard] Detected paid signup, redirecting to billing...');
      userStore.clearBillingRedirect();
      
      // Redirect directly to Stripe checkout with the selected tier
      const tier = userStore.getUserProfile?.subscription_tier;
      if (tier) {
        await router.push({
          path: '/billing',
          query: { tier, autoCheckout: 'true' }
        });
      } else {
        await router.push('/billing');
      }
      return; // Exit early since we're redirecting
    } else {
      console.log('[DashBoard] No billing redirect needed');
    }
    
    // Check if user was redirected due to upload limit
    if (route.query.uploadLimitReached === 'true') {
      console.log('[DashBoard] User redirected due to upload limit, refreshing profile to show banner...');
      const userId = userStore.getUser?.id;
      if (userId) {
        await userStore.fetchProfile(userId);
      }
      // Clear the query parameter
      router.replace({ query: {} });
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

    // Upload statistics now come directly from user profile (no initialization needed)
    console.log('[DashBoard] Upload stats available from user profile:', userStore.getUserProfile?.total_uploads ?? 0);

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
  const isTestingAuth = ref(false);

  async function testAuthFunction() {
    isTestingAuth.value = true;
    try {
      // First check what session we have
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Current session:', session);
      console.log('Access token preview:', session?.access_token?.substring(0, 50));
      
      if (!session) {
        alert('No session found! Please login first.');
        return;
      }
      
      console.log('Testing auth status...');
      
      // Show session info
      if (session) {
        console.log('✅ Auth working - User:', session.user.email);
      } else {
        console.log('❌ No auth session');
      }
      
      // For debugging - log and copy to clipboard
      const debugOutput = `Session exists: ${!!session}\nUser: ${session?.user?.email}\nAccess token: ${session?.access_token?.substring(0, 20)}...\n`;
      
      console.log('Full debug output:', debugOutput);
      
      // Copy to clipboard
      try {
        await navigator.clipboard.writeText(debugOutput);
        alert('Debug info copied to clipboard! Check console for full output.');
      } catch (err) {
        alert('Debug info logged to console (clipboard copy failed)');
      }
      
    } catch (error) {
      console.error('Test auth error:', error);
      alert(`Test Auth Error: ${error.message}`);
    } finally {
      isTestingAuth.value = false;
    }
  }

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

  // Cancel Subscription Modal State
  const showCancelSubscriptionModal = ref(false);
  const isCancellingSubscription = ref(false);

  // Deletion Scheduled Modal State
  const showDeletionScheduledModal = ref(false);
  const deletionScheduledMessage = ref('');

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
        if (result.scheduled) {
          // Scheduled deletion - show modal and keep user logged in
          console.log('[DashBoard] Account deletion scheduled for:', result.deletion_scheduled_for);
          const deletionDate = result.access_until ? new Date(result.access_until).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }) : 'end of billing period';

          deletionScheduledMessage.value = `Your account will be permanently deleted on <strong>${deletionDate}</strong>.<br><br>You'll continue to have full access to all features until then.<br><br>If you change your mind, please contact support before that date.`;

          showDeleteConfirmModal.value = false;
          showDeletionScheduledModal.value = true;

          // Refresh profile to show updated deletion status
          const userId = userStore.getUser?.id;
          if (userId) {
            await userStore.fetchProfile(userId);
          }
        } else {
          // Immediate deletion - navigate to login
          console.log('[DashBoard] Account deleted immediately. Navigating to login.');
          showDeleteConfirmModal.value = false;
          router.push({ name: 'Login' });
        }
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
