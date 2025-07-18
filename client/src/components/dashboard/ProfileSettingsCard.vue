<template>
  <div class="bg-gray-800 rounded-lg p-6 shadow-lg">
    <div class="mb-6">
      <h3 class="text-xl font-semibold text-white">Profile Settings</h3>
      <p class="text-gray-400 text-sm mt-1">Manage your account preferences</p>
    </div>

    <!-- Email Management -->
    <div class="space-y-4 mb-8">
      <div>
        <div class="space-y-3">
          <div class="flex justify-between items-center">
            <span class="text-gray-400">Current Email</span>
            <span class="text-white">{{ displayEmail }}</span>
          </div>
          
          <div class="flex items-start">
            <label class="text-sm font-medium text-gray-400 mr-3 mt-2">Enter New Email Address</label>
            <div class="flex gap-2 flex-1 justify-end">
              <input
                v-model="newEmail"
                type="email"
                placeholder="Enter new email"
                class="bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent text-sm w-48"
              />
              <BaseButton
                @click="$emit('update-email', newEmail)"
                :disabled="!newEmail || !isValidEmail"
                :loading="isUpdatingEmail"
                variant="secondary"
                size="small"
              >
                Update
              </BaseButton>
            </div>
          </div>
          
          <!-- Email Status Messages -->
          <div v-if="emailSuccessMessage" class="text-green-400 text-sm">
            {{ emailSuccessMessage }}
          </div>
          <div v-if="emailErrorMessage" class="text-red-400 text-sm">
            {{ emailErrorMessage }}
          </div>
        </div>
      </div>
    </div>

    <!-- Danger Zone -->
    <div class="pt-6 border-t border-gray-700">
      <h4 class="text-lg font-medium text-red-400 mb-4">Danger Zone</h4>
      <div class="bg-red-950/20 border border-red-500/50 rounded-lg p-4">
        <div class="flex justify-between items-start">
          <div>
            <h5 class="text-white font-medium">Delete Account</h5>
            <p class="text-gray-400 text-sm mt-1">
              Permanently delete your account and all associated data. This action is irreversible.
            </p>
          </div>
          <BaseButton
            @click="$emit('delete-account')"
            variant="destructive"
            size="small"
          >
            Delete Account
          </BaseButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useUserStore } from '@/stores/user-store';
import BaseButton from '@/components/shared/BaseButton.vue';

interface Props {
  isUpdatingEmail?: boolean;
  emailSuccessMessage?: string | null;
  emailErrorMessage?: string | null;
}

const props = withDefaults(defineProps<Props>(), {
  isUpdatingEmail: false,
  emailSuccessMessage: null,
  emailErrorMessage: null
});

const emit = defineEmits<{
  'update-email': [email: string];
  'delete-account': [];
}>();

const userStore = useUserStore();
const newEmail = ref('');

const displayEmail = computed(() => {
  return userStore.auth.user?.email || 'Loading...';
});

const isValidEmail = computed(() => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(newEmail.value);
});
</script>