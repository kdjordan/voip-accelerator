<template>
  <div class="w-full pt-2 pb-4">
    <!-- Dashboard Content -->
    <div class="flex flex-col gap-6">
      <!-- Standardized masthead -->
      <PageMasthead
        :title="`Welcome back, ${displayName}`"
        section="Section I — Overview"
        right="Account overview"
        subtitle="Here's what's happening with your account."
      />

      <!-- Two Column Account Section -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <!-- Account Information -->
        <section class="border border-line bg-surface p-5 flex flex-col">
          <div class="flex items-start justify-between mb-5">
            <h2 class="font-display text-base font-semibold text-fg">Account Information</h2>
            <div class="w-10 h-10 rounded-full bg-accent-soft ring-1 ring-accent-ring flex items-center justify-center shrink-0">
              <span class="text-xs font-medium text-accent">{{ userInitials }}</span>
            </div>
          </div>

          <!-- Email -->
          <div class="mb-5">
            <span class="block font-display text-[10px] uppercase tracking-wider text-fg-faint mb-1">Email</span>
            <span class="text-sm text-fg">{{ displayEmail }}</span>
          </div>

          <!-- Email Edit Form -->
          <div v-if="isEditingEmail" class="w-full space-y-2 mb-5">
            <input
              v-model="newEmail"
              type="email"
              placeholder="Enter new email"
              class="w-full bg-input border border-line-strong px-3 py-2 text-fg placeholder-fg-mute focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent text-sm"
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
                variant="secondary"
                size="small"
                class="flex-1"
              >
                Cancel
              </BaseButton>
            </div>
            <div v-if="emailSuccessMessage" class="text-warn text-xs">
              {{ emailSuccessMessage }}
            </div>
            <div v-if="emailErrorMessage" class="text-down text-xs">
              {{ emailErrorMessage }}
            </div>
          </div>

          <!-- Buttons at bottom -->
          <div class="flex items-center gap-3 mt-auto">
            <!-- Update Email Button -->
            <BaseButton
              v-if="!isEditingEmail"
              @click="isEditingEmail = true"
              variant="secondary"
              :icon="EnvelopeIcon"
            >
              Update Email
            </BaseButton>

            <!-- Logout Button -->
            <BaseButton
              @click="handleLogout"
              variant="destructive"
              :icon="ArrowRightOnRectangleIcon"
              :loading="isLoggingOut"
            >
              Logout
            </BaseButton>
          </div>
        </section>

        <!-- Activity -->
        <section class="border border-line bg-surface p-5">
          <div class="flex items-start justify-between mb-5">
            <h2 class="font-display text-base font-semibold text-fg">Activity</h2>
            <div class="w-10 h-10 rounded-full bg-accent-soft ring-1 ring-accent-ring flex items-center justify-center shrink-0">
              <ClockIcon class="w-5 h-5 text-accent" aria-hidden="true" />
            </div>
          </div>

          <div class="flex flex-col gap-4">
            <!-- Last Login -->
            <div>
              <span class="block font-display text-[10px] uppercase tracking-wider text-fg-faint mb-1">Last Login</span>
              <span class="text-sm text-fg font-secondary">{{ formattedLastLogin }}</span>
            </div>

            <!-- Member Since -->
            <div>
              <span class="block font-display text-[10px] uppercase tracking-wider text-fg-faint mb-1">Member Since</span>
              <span class="text-sm text-fg font-secondary">{{ formattedCreatedAt }}</span>
            </div>
          </div>
        </section>
      </div>

      <!-- Quick Actions -->
      <section class="border border-line bg-surface p-6">
        <h2 class="font-display text-lg font-semibold text-fg mb-5">Quick Actions</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- US Reporting -->
          <button
            @click="$router.push('/usview')"
            class="group text-left rounded-xl border border-line bg-surface p-5 transition-colors hover:border-accent hover:bg-row focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-3">
                <div class="w-11 h-11 border border-line-strong bg-row flex items-center justify-center">
                  <GlobeAmericasIcon class="w-5 h-5 text-accent" aria-hidden="true" />
                </div>
                <h3 class="font-display text-base font-semibold text-fg">US Reporting</h3>
              </div>
              <ArrowRightIcon
                class="w-5 h-5 text-accent transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transform-none"
                aria-hidden="true"
              />
            </div>
            <p class="text-sm text-fg-faint">Compare and analyze NPANXX rate decks</p>
          </button>

          <!-- AZ Reporting — HIDDEN for US-NPANXX focus (reversible). To restore: uncomment. -->
          <!--
          <button
            @click="$router.push('/azview')"
            class="group text-left rounded-xl border border-line bg-surface p-5 transition-colors hover:border-accent hover:bg-row focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-3">
                <div class="w-11 h-11 border border-line-strong bg-row flex items-center justify-center">
                  <GlobeAltIcon class="w-5 h-5 text-accent" aria-hidden="true" />
                </div>
                <h3 class="font-display text-base font-semibold text-fg">AZ Reporting</h3>
              </div>
              <ArrowRightIcon class="w-5 h-5 text-accent transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transform-none" aria-hidden="true" />
            </div>
            <p class="text-sm text-fg-faint">Compare and analyze AZ rate decks</p>
          </button>
          -->

          <!-- US Rate Wizard -->
          <button
            @click="$router.push('/us-rate-sheet')"
            class="group text-left rounded-xl border border-line bg-surface p-5 transition-colors hover:border-accent hover:bg-row focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-3">
                <div class="w-11 h-11 border border-line-strong bg-row flex items-center justify-center">
                  <AdjustmentsVerticalIcon class="w-5 h-5 text-accent" aria-hidden="true" />
                </div>
                <h3 class="font-display text-base font-semibold text-fg">US Rate Wizard</h3>
              </div>
              <ArrowRightIcon
                class="w-5 h-5 text-accent transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transform-none"
                aria-hidden="true"
              />
            </div>
            <p class="text-sm text-fg-faint">Fine tune NPANXX rate decks</p>
          </button>

          <!-- AZ Rate Wizard — HIDDEN for US-NPANXX focus (reversible). To restore: uncomment. -->
          <!--
          <button
            @click="$router.push('/az-rate-sheet')"
            class="group text-left rounded-xl border border-line bg-surface p-5 transition-colors hover:border-accent hover:bg-row focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-3">
                <div class="w-11 h-11 border border-line-strong bg-row flex items-center justify-center">
                  <AdjustmentsVerticalIcon class="w-5 h-5 text-accent" aria-hidden="true" />
                </div>
                <h3 class="font-display text-base font-semibold text-fg">AZ Rate Wizard</h3>
              </div>
              <ArrowRightIcon class="w-5 h-5 text-accent transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transform-none" aria-hidden="true" />
            </div>
            <p class="text-sm text-fg-faint">Fine tune AZ rate decks</p>
          </button>
          -->

          <!-- Rate Generation -->
          <button
            @click="$router.push('/rate-gen/us')"
            class="group text-left rounded-xl border border-line bg-surface p-5 transition-colors hover:border-accent hover:bg-row focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-3">
                <div class="w-11 h-11 border border-line-strong bg-row flex items-center justify-center">
                  <SparklesIcon class="w-5 h-5 text-accent" aria-hidden="true" />
                </div>
                <h3 class="font-display text-base font-semibold text-fg">Rate Generation</h3>
              </div>
              <ArrowRightIcon
                class="w-5 h-5 text-accent transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transform-none"
                aria-hidden="true"
              />
            </div>
            <p class="text-sm text-fg-faint">Generate NPANXX rate decks from up to 5 providers</p>
          </button>
        </div>
      </section>

      <!-- Delete Account Button -->
      <div class="flex justify-end">
        <BaseButton
          @click="openDeleteConfirmModal"
          variant="destructive"
          size="small"
          :icon="TrashIcon"
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
  import BaseButton from '@/components/shared/BaseButton.vue';
  import PageMasthead from '@/components/shared/PageMasthead.vue';
  import {
    GlobeAmericasIcon,
    GlobeAltIcon, // retained for the hidden AZ Reporting quick action (see template)
    AdjustmentsVerticalIcon,
    SparklesIcon,
    ClockIcon,
    EnvelopeIcon,
    ArrowRightOnRectangleIcon,
    ArrowRightIcon,
    TrashIcon
  } from '@heroicons/vue/24/outline';
  import { useRouter } from 'vue-router';
  import ConfirmationModal from '@/components/shared/ConfirmationModal.vue';


  // User store for user info
  const userStore = useUserStore();
  const router = useRouter();

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
    const lastSignIn = userStore.auth.user?.updatedAt;
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
    const createdAt = userStore.auth.user?.createdAt;
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

  // Friendly first-name greeting derived from the email local part (e.g. phase3-smoke@… → "Phase3")
  const displayName = computed(() => {
    const email = userStore.auth.user?.email;
    if (!email) return 'there';
    const token = email.split('@')[0].split(/[._-]/)[0];
    return token ? token.charAt(0).toUpperCase() + token.slice(1) : 'there';
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
      const result = await userStore.updateUserEmail(email);
      if (result.success) {
        emailSuccessMessage.value = 'Email updated successfully.';
        setTimeout(() => {
          isEditingEmail.value = false;
          newEmail.value = '';
          emailSuccessMessage.value = null;
        }, 2500);
      } else {
        emailErrorMessage.value =
          result.error?.message || 'Failed to update email. Please try again.';
      }
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
