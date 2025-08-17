<template>
  <div class="min-h-screen text-white pt-2 w-full">
    <!-- Service Expiry Banner -->
    <ServiceExpiryBanner 
      v-bind="bannerState"
      @upgrade-clicked="handleUpgradeFromExpiry"
    />
    
    <h1 class="text-3xl text-accent uppercase rounded-lg px-4 py-2 font-secondary">Dashboard</h1>

    <!-- Dashboard Content -->
    <div class="flex flex-col gap-6 mb-8">
      <!-- User Welcome Section -->
      <div class="bg-gray-800 rounded-lg p-6 border border-gray-700/50">
        <div class="flex flex-col md:flex-row gap-6 items-start md:items-center">
          <div class="flex-shrink-0">
            <div class="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center overflow-hidden border-2 border-accent/30">
              <span class="text-xl font-medium text-accent">{{ userInitials }}</span>
            </div>
          </div>
          <div class="flex-grow">
            <div class="flex flex-col md:flex-row md:items-center justify-between w-full">
              <div>
                <h2 class="text-xl font-semibold">Welcome back,</h2>
                <p class="text-sm text-gray-400">{{ userStore.auth.user?.email || 'Guest' }}</p>
              </div>
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
      </div>

      <!-- Account Stats Grid -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Last Login -->
        <div class="bg-gray-800 rounded-lg p-6 border border-gray-700/50">
          <div>
            <p class="text-gray-400 text-sm">Last Login</p>
            <p class="text-lg font-medium mt-1">{{ formattedLastLogin }}</p>
          </div>
        </div>

        <!-- Upload Usage -->
        <div class="bg-gray-800 rounded-lg p-6 border border-gray-700/50">
          <div class="space-y-3">
            <div class="flex justify-between items-start">
              <div>
                <p class="text-gray-400 text-sm">
                  <template v-if="uploadStats.isUnlimited">
                    All-Time Uploads
                  </template>
                  <template v-else>
                    Monthly Uploads
                  </template>
                </p>
                <p class="text-lg font-medium mt-1">
                  <template v-if="uploadStats.isUnlimited">
                    {{ uploadStats.allTimeUploads || uploadStats.uploads }} total
                  </template>
                  <template v-else>
                    {{ uploadStats.uploads }}/{{ uploadStats.limit }}
                  </template>
                </p>
              </div>
              <BaseBadge 
                :variant="uploadStats.isUnlimited ? 'success' : 'info'" 
                size="small"
              >
                {{ uploadTracking.getTierDisplayName(uploadStats.tier) }}
              </BaseBadge>
            </div>
            
            <!-- Progress bar (only for limited tiers) -->
            <div v-if="!uploadStats.isUnlimited" class="w-full">
              <div class="flex justify-between text-xs text-gray-400 mb-1">
                <span>{{ uploadStatusMessage }}</span>
                <span>{{ uploadStats.percentage }}%</span>
              </div>
              <div class="w-full bg-gray-700 rounded-full h-2">
                <div 
                  :class="uploadProgressColor"
                  class="h-2 rounded-full transition-all duration-300"
                  :style="{ width: `${Math.min(uploadStats.percentage, 100)}%` }"
                ></div>
              </div>
            </div>
            
            <!-- Status message for unlimited tiers -->
            <div v-else class="text-sm text-green-400">
              {{ uploadStatusMessage }}
            </div>
          </div>
        </div>

        <!-- Account Created -->
        <div class="bg-gray-800 rounded-lg p-6 border border-gray-700/50">
          <div>
            <p class="text-gray-400 text-sm">Account Created</p>
            <p class="text-lg font-medium mt-1">{{ formattedCreatedAt }}</p>
          </div>
        </div>
      </div>

      <!-- Profile Settings Bento -->
      <div class="bg-gray-800 rounded-lg p-6 border border-gray-700/50">
        <div class="mb-6">
          <h3 class="text-xl font-semibold text-white">Profile Settings</h3>
        </div>

        <div class="space-y-4 mb-8">
          <!-- Loading State -->
          <div v-if="isRefreshingSubscription">
            <div class="flex justify-center items-center py-8">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
              <span class="ml-3 text-gray-400">Updating subscription...</span>
            </div>
          </div>

          <!-- Plan Details -->
          <div v-else class="space-y-4">
            <!-- Trial Alert (for trial users only) - No colored background -->
            <div v-if="currentPlanTier === 'trial'">
              <div class="space-y-3">
                <div class="flex items-center justify-between">
                  <span class="text-gray-400 text-sm">Current Plan:</span>
                  <BaseBadge variant="warning" size="small">Trial</BaseBadge>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-gray-400 text-sm">Expires At:</span>
                  <span class="text-white text-sm">{{ formattedPlanExpiresAt }}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-gray-400 text-sm">Trial Uploads:</span>
                  <span class="text-white text-sm">{{ uploadStats.uploads }}/{{ uploadStats.limit }}</span>
                </div>
                <div class="flex justify-end mt-4">
                  <BaseButton
                    @click="showPlanSelectorModal = true"
                    variant="primary"
                    size="small"
                  >
                    Choose Plan
                  </BaseButton>
                </div>
              </div>
            </div>

            <!-- Active Subscription (for paid users) - No colored background -->
            <div v-else class="space-y-4">
              <div class="space-y-2">
                <div class="flex items-center justify-between">
                  <span class="text-gray-400 text-sm">Current Plan:</span>
                  <BaseBadge :variant="currentPlanBadgeVariant" size="small">
                    {{ currentPlanTier === 'trial' ? 'Free Trial' : currentPlanName }}
                  </BaseBadge>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-gray-400 text-sm">Next Billing:</span>
                  <span class="text-white text-sm">{{ formattedPlanExpiresAt }}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-gray-400 text-sm">Monthly Cost:</span>
                  <span class="text-white text-sm font-medium">${{ getMonthlyPrice() }}</span>
                </div>
                
                <!-- Upload Limits for Optimizer Tier -->
                <div v-if="currentPlanTier === 'optimizer'" class="flex items-center justify-between">
                  <span class="text-gray-400 text-sm">Upload Limit:</span>
                  <span class="text-white text-sm">{{ uploadStats.uploads }}/{{ uploadStats.limit }} this month</span>
                </div>
                
                <!-- Upload Status for Unlimited Tiers -->
                <div v-else-if="uploadStats.isUnlimited" class="flex items-center justify-between">
                  <span class="text-gray-400 text-sm">Uploads:</span>
                  <span class="text-green-400 text-sm">{{ uploadStats.uploads }} (Unlimited)</span>
                </div>
              </div>
              <div class="flex gap-2">
                <BaseButton
                  @click="showAllPlansInModal = true; showPaymentModal = true"
                  variant="secondary"
                  size="small"
                >
                  Change Plan
                </BaseButton>
                <BaseButton
                  @click="handleManageBilling"
                  variant="secondary-outline"
                  size="small"
                >
                  Manage Billing
                </BaseButton>
              </div>
            </div>

            <!-- Email Management Section -->
            <div class="pt-4">
              <div class="space-y-3">
                <div class="flex justify-between items-center">
                  <span class="text-gray-400">Email</span>
                  <div class="flex items-center gap-2">
                    <span class="text-white">{{ displayEmail }}</span>
                    <BaseButton
                      v-if="!isEditingEmail"
                      @click="isEditingEmail = true"
                      variant="secondary-outline"
                      size="small"
                      :icon="PencilIcon"
                    />
                  </div>
                </div>
                
                <!-- Collapsible Email Update Form -->
                <div v-if="isEditingEmail" class="pl-4 border-l-2 border-gray-700 ml-2">
                  <div class="flex gap-2 items-center">
                    <input
                      v-model="newEmail"
                      type="email"
                      placeholder="Enter new email"
                      class="bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent text-sm flex-1 max-w-xs"
                      @keyup.enter="updateEmail(newEmail)"
                      @keyup.escape="cancelEmailEdit"
                    />
                    <BaseButton
                      @click="updateEmail(newEmail)"
                      :disabled="!isEmailInputValid"
                      :loading="isUpdatingEmail"
                      variant="primary"
                      size="small"
                    >
                      Save
                    </BaseButton>
                    <BaseButton
                      @click="cancelEmailEdit"
                      variant="destructive"
                      size="small"
                    >
                      Cancel
                    </BaseButton>
                  </div>
                  
                  <!-- Email Status Messages -->
                  <div v-if="emailSuccessMessage" class="text-green-400 text-sm mt-2">
                    {{ emailSuccessMessage }}
                  </div>
                  <div v-if="emailErrorMessage" class="text-red-400 text-sm mt-2">
                    {{ emailErrorMessage }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Danger Zone -->
        <div class="bg-red-950/20 border border-red-500/50 rounded-lg p-4">
          <div class="flex justify-between items-start">
            <div>
              <h5 class="text-white font-medium">Delete Account</h5>
              <p class="text-gray-400 text-sm mt-1">
                Permanently delete your account and all associated data. This action is irreversible.
              </p>
            </div>
            <BaseButton
              @click="openDeleteConfirmModal"
              variant="destructive"
              size="small"
            >
              Delete Account
            </BaseButton>
          </div>
        </div>
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

    <!-- Payment Modal -->
    <PaymentModal 
      v-if="showPaymentModal"
      :preselected-tier="userStore.getTrialTier || userStore.getSubscriptionTier"
      :show-all-plans="showAllPlansInModal"
      @close="showPaymentModal = false; showAllPlansInModal = false"
      @select-plan="handlePlanSelection"
    />
    
    <!-- Plan Selector Modal -->
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
  import BaseBadge from '@/components/shared/BaseBadge.vue';
  import type { BaseBadgeProps } from '@/types/app-types';
  import BaseButton from '@/components/shared/BaseButton.vue';
  import { ArrowPathIcon, PencilIcon } from '@heroicons/vue/24/outline';
  import {
    ArrowRightOnRectangleIcon,
  } from '@heroicons/vue/24/solid';
  import { useRouter, useRoute } from 'vue-router';
  import { useBilling } from '@/composables/useBilling';
  import type { PlanTierType, SubscriptionTier } from '@/types/user-types'; // Import PlanTierType
  import ConfirmationModal from '@/components/shared/ConfirmationModal.vue';
  import ServiceExpiryBanner from '@/components/shared/ServiceExpiryBanner.vue';
  import PaymentModal from '@/components/billing/PaymentModal.vue';
  import PlanSelectorModal from '@/components/billing/PlanSelectorModal.vue';
  import { useUploadTracking } from '@/composables/useUploadTracking';
  

  // User store for user info
  const userStore = useUserStore();
  const router = useRouter();
  const route = useRoute();
  
  // Upload tracking composable
  const uploadTracking = useUploadTracking();
  
  // Payment modal state
  const showPaymentModal = ref(false);
  const showAllPlansInModal = ref(false); // Track if modal should show all plans
  
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
      case 'enterprise':
        return '499.00';
      default:
        return '0.00';
    }
  }

  // Upload tracking computeds
  const uploadStats = computed(() => {
    const tier = uploadTracking.currentTier.value;
    const uploads = uploadTracking.uploadsThisMonth.value;
    const remaining = uploadTracking.uploadsRemaining.value;
    const percentage = uploadTracking.percentageUsed.value;
    const isUnlimited = uploadTracking.isUnlimited.value;
    
    // For unlimited plans (Accelerator/Enterprise), we still show monthly uploads
    // but could track all-time if we add that to the database later
    const allTimeUploads = uploads; // TODO: Add total_uploads to profiles table
    
    return {
      tier,
      uploads,
      remaining,
      percentage,
      isUnlimited,
      limit: uploadTracking.UPLOAD_LIMIT,
      allTimeUploads
    };
  });

  const uploadProgressColor = computed(() => {
    const percentage = uploadStats.value.percentage;
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 80) return 'bg-yellow-500';
    return 'bg-accent';
  });

  const uploadStatusMessage = computed(() => {
    return uploadTracking.formatRemainingMessage();
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

  function handlePlanSelection(plan: 'monthly' | 'annual') {
    showPaymentModal.value = false;
    // PaymentModal will handle the checkout redirect
  }
  
  // Handler for upgrade clicked from expiry banner
  function handleUpgradeFromExpiry() {
    showPlanSelectorModal.value = true; // Use PlanSelectorModal for expiry upgrades
  }
  
  // Handler for plan selection from PlanSelectorModal
  async function handlePlanSelectorSelection(tier: SubscriptionTier) {
    showPlanSelectorModal.value = false;
    
    try {
      const { createCheckoutSession } = useBilling();
      
      // Get the correct price ID based on selected tier
      const priceIds = {
        optimizer: import.meta.env.VITE_STRIPE_PRICE_OPTIMIZER,
        accelerator: import.meta.env.VITE_STRIPE_PRICE_ACCELERATOR,
        enterprise: import.meta.env.VITE_STRIPE_PRICE_ENTERPRISE,
      };
      
      const priceId = priceIds[tier];
      
      if (!priceId) {
        throw new Error(`Price ID not found for ${tier} plan`);
      }
      
      console.log(`🚀 Creating checkout session for ${tier} upgrade`);
      await createCheckoutSession(priceId, tier);
      
    } catch (error: any) {
      console.error('Upgrade checkout error:', error);
      alert(`Failed to start checkout: ${error.message}`);
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

    // Initialize upload statistics for dashboard display
    try {
      console.log('[DashBoard] Loading upload statistics...');
      await uploadTracking.getUploadStatistics();
      console.log('[DashBoard] Upload statistics loaded successfully');
    } catch (err) {
      console.error('[DashBoard] Failed to load upload statistics:', err);
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
