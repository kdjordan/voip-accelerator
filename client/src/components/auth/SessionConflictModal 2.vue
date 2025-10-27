<template>
  <TransitionRoot appear :show="isOpen" as="template">
    <Dialog as="div" @close="onCancel" class="relative z-50">
      <TransitionChild
        as="template"
        enter="duration-300 ease-out"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="duration-200 ease-in"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <div class="fixed inset-0 bg-black/75" />
      </TransitionChild>

      <div class="fixed inset-0 overflow-y-auto">
        <div class="flex min-h-full items-center justify-center p-4 text-center">
          <TransitionChild
            as="template"
            enter="duration-300 ease-out"
            enter-from="opacity-0 scale-95"
            enter-to="opacity-100 scale-100"
            leave="duration-200 ease-in"
            leave-from="opacity-100 scale-100"
            leave-to="opacity-0 scale-95"
          >
            <DialogPanel class="w-full max-w-md transform overflow-hidden rounded-lg bg-zinc-900 p-6 text-left align-middle shadow-xl transition-all border border-zinc-800">
              <DialogTitle as="h3" class="text-lg font-semibold leading-6 text-white mb-4">
                Active Session Detected
              </DialogTitle>
              
              <div class="mt-2">
                <p class="text-sm text-gray-400 mb-4">
                  You're already logged in on another device. To continue here, you'll need to log out from the other device.
                </p>
                
                <div class="bg-zinc-800 rounded-lg p-4 mb-4">
                  <p class="text-xs text-gray-500 uppercase tracking-wider mb-2">Existing Session</p>
                  <div class="space-y-2">
                    <div class="flex items-center space-x-2">
                      <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span class="text-sm text-white">{{ deviceInfo }}</span>
                    </div>
                    
                    <div v-if="sessionInfo?.ipAddress" class="flex items-center space-x-2">
                      <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span class="text-sm text-gray-400">IP: {{ sessionInfo.ipAddress }}</span>
                    </div>
                    
                    <div class="flex items-center space-x-2">
                      <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span class="text-sm text-gray-400">{{ lastActiveText }}</span>
                    </div>
                  </div>
                </div>

                <div class="bg-blue-900/20 border border-blue-800/30 rounded-lg p-3 mb-4">
                  <p class="text-xs text-blue-400">
                    <strong>Note:</strong> Only one active session is allowed per account to ensure security and prevent unauthorized access.
                  </p>
                </div>
              </div>

              <div class="mt-6 flex space-x-3">
                <button
                  type="button"
                  class="flex-1 inline-flex justify-center rounded-md border border-transparent bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  @click="onForceLogout"
                  :disabled="isLoading"
                >
                  <span v-if="!isLoading">Log Out Other Device</span>
                  <span v-else class="flex items-center">
                    <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Logging out...
                  </span>
                </button>
                
                <button
                  type="button"
                  class="flex-1 inline-flex justify-center rounded-md border border-gray-600 bg-zinc-800 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2"
                  @click="onCancel"
                  :disabled="isLoading"
                >
                  Cancel
                </button>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import {
  TransitionRoot,
  TransitionChild,
  Dialog,
  DialogPanel,
  DialogTitle,
} from '@headlessui/vue';

interface SessionInfo {
  id: string;
  sessionId: string;
  createdAt: string;
  lastHeartbeat: string;
  userAgent: string;
  ipAddress: string;
  browserInfo: any;
}

interface Props {
  isOpen: boolean;
  sessionInfo: SessionInfo | null;
  isLoading?: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'force-logout': [];
  'cancel': [];
}>();

const deviceInfo = computed(() => {
  if (!props.sessionInfo?.browserInfo) return 'Unknown device';
  const info = props.sessionInfo.browserInfo;
  return `${info.browser || 'Unknown'} on ${info.os || 'Unknown'} (${info.device || 'Desktop'})`;
});

const lastActiveText = computed(() => {
  if (!props.sessionInfo?.lastHeartbeat) return 'Unknown';
  
  const lastActive = new Date(props.sessionInfo.lastHeartbeat);
  const now = new Date();
  const diffMinutes = Math.floor((now.getTime() - lastActive.getTime()) / 60000);
  
  if (diffMinutes < 1) return 'Last active: Just now';
  if (diffMinutes < 60) {
    return `Last active: ${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
  }
  
  const hours = Math.floor(diffMinutes / 60);
  return `Last active: ${hours} hour${hours > 1 ? 's' : ''} ago`;
});

const onForceLogout = () => {
  emit('force-logout');
};

const onCancel = () => {
  emit('cancel');
};
</script>