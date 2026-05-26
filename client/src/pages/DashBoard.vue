<template>
  <div class="w-full pb-4">
    <!-- Dashboard Content -->
    <div class="flex flex-col gap-6 px-4">
      <!-- Header -->
      <header class="pt-2">
        <p class="text-xs font-secondary uppercase tracking-wider text-emerald-400">Dashboard</p>
        <h1 class="mt-1 flex items-center gap-2 text-2xl md:text-3xl font-semibold text-white">
          Welcome back, {{ displayName }}
          <BoltIcon class="h-6 w-6 text-emerald-400" aria-hidden="true" />
        </h1>
        <p class="mt-1 text-sm text-zinc-400">Here's what's happening with your account.</p>
      </header>

      <!-- Two Column Account Section -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <!-- Account Information -->
        <section class="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 flex flex-col">
          <div class="flex items-start justify-between mb-5">
            <h2 class="text-base font-semibold text-white">Account Information</h2>
            <div class="w-10 h-10 rounded-full bg-emerald-400/10 ring-1 ring-emerald-400/30 flex items-center justify-center shrink-0">
              <span class="text-xs font-medium text-emerald-300">{{ userInitials }}</span>
            </div>
          </div>

          <!-- Email -->
          <div class="mb-5">
            <span class="block text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Email</span>
            <span class="text-sm text-zinc-200">{{ displayEmail }}</span>
          </div>

          <!-- Email Edit Form -->
          <div v-if="isEditingEmail" class="w-full space-y-2 mb-5">
            <input
              v-model="newEmail"
              type="email"
              placeholder="Enter new email"
              class="w-full bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/60 focus:border-transparent text-sm"
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
            <div v-if="emailSuccessMessage" class="text-emerald-400 text-xs">
              {{ emailSuccessMessage }}
            </div>
            <div v-if="emailErrorMessage" class="text-rose-400 text-xs">
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
        <section class="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
          <div class="flex items-start justify-between mb-5">
            <h2 class="text-base font-semibold text-white">Activity</h2>
            <div class="w-10 h-10 rounded-full bg-emerald-400/10 ring-1 ring-emerald-400/30 flex items-center justify-center shrink-0">
              <ClockIcon class="w-5 h-5 text-emerald-300" aria-hidden="true" />
            </div>
          </div>

          <div class="flex flex-col gap-4">
            <!-- Last Login -->
            <div>
              <span class="block text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Last Login</span>
              <span class="text-sm text-zinc-200 font-secondary">{{ formattedLastLogin }}</span>
            </div>

            <!-- Member Since -->
            <div>
              <span class="block text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Member Since</span>
              <span class="text-sm text-zinc-200 font-secondary">{{ formattedCreatedAt }}</span>
            </div>
          </div>
        </section>
      </div>

      <!-- Quick Actions -->
      <section class="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6">
        <h2 class="text-lg font-semibold text-white mb-5">Quick Actions</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- US Reporting -->
          <button
            @click="$router.push('/usview')"
            class="group text-left rounded-xl border border-emerald-500/15 bg-white/[0.02] p-5 transition-colors hover:border-emerald-400/40 hover:bg-white/[0.04] focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60"
          >
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-3">
                <div class="w-11 h-11 rounded-lg border border-emerald-400/30 bg-emerald-400/[0.08] flex items-center justify-center">
                  <GlobeAmericasIcon class="w-5 h-5 text-emerald-300" aria-hidden="true" />
                </div>
                <h3 class="text-base font-semibold text-white">US Reporting</h3>
              </div>
              <ArrowRightIcon
                class="w-5 h-5 text-emerald-400 transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transform-none"
                aria-hidden="true"
              />
            </div>
            <p class="text-sm text-zinc-400">Compare and analyze NPANXX rate decks</p>
          </button>

          <!-- AZ Reporting — HIDDEN for US-NPANXX focus (reversible). To restore: uncomment. -->
          <!--
          <button
            @click="$router.push('/azview')"
            class="group text-left rounded-xl border border-emerald-500/15 bg-white/[0.02] p-5 transition-colors hover:border-emerald-400/40 hover:bg-white/[0.04] focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60"
          >
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-3">
                <div class="w-11 h-11 rounded-lg border border-emerald-400/30 bg-emerald-400/[0.08] flex items-center justify-center">
                  <GlobeAltIcon class="w-5 h-5 text-emerald-300" aria-hidden="true" />
                </div>
                <h3 class="text-base font-semibold text-white">AZ Reporting</h3>
              </div>
              <ArrowRightIcon class="w-5 h-5 text-emerald-400 transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transform-none" aria-hidden="true" />
            </div>
            <p class="text-sm text-zinc-400">Compare and analyze AZ rate decks</p>
          </button>
          -->

          <!-- US Rate Wizard -->
          <button
            @click="$router.push('/us-rate-sheet')"
            class="group text-left rounded-xl border border-emerald-500/15 bg-white/[0.02] p-5 transition-colors hover:border-emerald-400/40 hover:bg-white/[0.04] focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60"
          >
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-3">
                <div class="w-11 h-11 rounded-lg border border-emerald-400/30 bg-emerald-400/[0.08] flex items-center justify-center">
                  <AdjustmentsVerticalIcon class="w-5 h-5 text-emerald-300" aria-hidden="true" />
                </div>
                <h3 class="text-base font-semibold text-white">US Rate Wizard</h3>
              </div>
              <ArrowRightIcon
                class="w-5 h-5 text-emerald-400 transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transform-none"
                aria-hidden="true"
              />
            </div>
            <p class="text-sm text-zinc-400">Fine tune NPANXX rate decks</p>
          </button>

          <!-- AZ Rate Wizard — HIDDEN for US-NPANXX focus (reversible). To restore: uncomment. -->
          <!--
          <button
            @click="$router.push('/az-rate-sheet')"
            class="group text-left rounded-xl border border-emerald-500/15 bg-white/[0.02] p-5 transition-colors hover:border-emerald-400/40 hover:bg-white/[0.04] focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60"
          >
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-3">
                <div class="w-11 h-11 rounded-lg border border-emerald-400/30 bg-emerald-400/[0.08] flex items-center justify-center">
                  <AdjustmentsVerticalIcon class="w-5 h-5 text-emerald-300" aria-hidden="true" />
                </div>
                <h3 class="text-base font-semibold text-white">AZ Rate Wizard</h3>
              </div>
              <ArrowRightIcon class="w-5 h-5 text-emerald-400 transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transform-none" aria-hidden="true" />
            </div>
            <p class="text-sm text-zinc-400">Fine tune AZ rate decks</p>
          </button>
          -->

          <!-- Rate Generation -->
          <button
            @click="$router.push('/rate-gen/us')"
            class="group text-left rounded-xl border border-emerald-500/15 bg-white/[0.02] p-5 transition-colors hover:border-emerald-400/40 hover:bg-white/[0.04] focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60"
          >
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-3">
                <div class="w-11 h-11 rounded-lg border border-emerald-400/30 bg-emerald-400/[0.08] flex items-center justify-center">
                  <SparklesIcon class="w-5 h-5 text-emerald-300" aria-hidden="true" />
                </div>
                <h3 class="text-base font-semibold text-white">Rate Generation</h3>
              </div>
              <ArrowRightIcon
                class="w-5 h-5 text-emerald-400 transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transform-none"
                aria-hidden="true"
              />
            </div>
            <p class="text-sm text-zinc-400">Generate NPANXX rate decks from up to 5 providers</p>
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
  import { BoltIcon } from '@heroicons/vue/24/solid';
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
