<template>
  <div class="text-white pt-2 w-full">
    <!-- Dashboard Content -->
    <div class="flex flex-col gap-6 mb-8 px-4">
      <h1 class="relative">
      <span class="text-xl md:text-2xl text-accent uppercase rounded-lg px-4 py-2 font-secondary">
        WELCOME BACK
      </span>
    </h1>
      <!-- Two Column Account Section -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
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

        <!-- Bento 2: Activity -->
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
      message="Are you sure you want to permanently delete your account? This action is irreversible and all your data will be removed."
      confirm-button-text="Yes, Delete My Account"
      cancel-button-text="Cancel"
      :requires-confirmation-phrase="true"
      confirmation-phrase="DELETE"
      @confirm="handleDeleteAccountConfirm"
    />
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted, watch } from 'vue';
  import { useUserStore } from '@/stores/user-store';
  import { useAzStore } from '@/stores/az-store';
  import { useUsStore } from '@/stores/us-store';
  import { useLergStoreV2 } from '@/stores/lerg-store-v2';
  import { useLergOperations } from '@/composables/useLergOperations';
  import { useSessionHeartbeat } from '@/composables/useSessionHeartbeat';
  import BaseButton from '@/components/shared/BaseButton.vue';
  import {
    GlobeAmericasIcon,
    GlobeAltIcon,
    AdjustmentsVerticalIcon,
    SparklesIcon,
    ClockIcon
  } from '@heroicons/vue/24/outline';
  import { useRouter } from 'vue-router';
  import ConfirmationModal from '@/components/shared/ConfirmationModal.vue';
  import { supabase } from '@/utils/supabase';


  // User store for user info
  const userStore = useUserStore();
  const router = useRouter();

  // Session heartbeat to detect force logouts
  const { checkSessionValidity } = useSessionHeartbeat();

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

  const displayEmail = computed(() => {
    return userStore.auth.user?.email || 'Loading...';
  });

  // Email Update State & Logic
  const newEmail = ref('');
  const isUpdatingEmail = ref(false);
  const isEditingEmail = ref(false);
  const emailErrorMessage = ref<string | null>(null);
  const emailSuccessMessage = ref<string | null>(null);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@\.]{2,}$/;

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

  // Stores for accessing memory (Pinia) data and triggering updates
  const azStore = useAzStore();
  const usStore = useUsStore();
  const lergStore = useLergStoreV2();

  // LERG initialization - using simplified system
  const { initializeLergData, error: lergError } = useLergOperations();

  // SMART LERG initialization - single point of truth for the entire app
  onMounted(async () => {
    console.log('[DashBoard] ========== DASHBOARD MOUNTED: SMART LERG INITIALIZATION ==========');

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

  const isEmailInputValid = computed(() => {
    const currentEmail = userStore.auth.user?.email;
    const isNotEmpty = newEmail.value.trim() !== '';
    const isDifferent = newEmail.value !== currentEmail;
    const isValidFormat = emailRegex.test(newEmail.value);
    return isNotEmpty && isDifferent && isValidFormat;
  });

  // Delete Account Modal State
  const showDeleteConfirmModal = ref(false);
  const isDeletingAccount = ref(false);
  const deleteAccountError = ref<string | null>(null);

  function openDeleteConfirmModal() {
    deleteAccountError.value = null;
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
        console.log('[DashBoard] Account deleted. Navigating to login.');
        showDeleteConfirmModal.value = false;
        router.push({ name: 'Login' });
      } else {
        console.error('[DashBoard] Failed to delete account:', result.error);
        deleteAccountError.value =
          result.error?.message ||
          'An unexpected error occurred while deleting your account. Please try again.';
        showDeleteConfirmModal.value = false;
      }
    } catch (e: any) {
      console.error('[DashBoard] Unexpected error during handleDeleteAccountConfirm:', e);
      deleteAccountError.value = 'A critical error occurred. Please contact support.';
      showDeleteConfirmModal.value = false;
    } finally {
      isDeletingAccount.value = false;
    }
  }
</script>

<style scoped>
  /* Add specific styles if needed, otherwise rely on Tailwind */
</style>
