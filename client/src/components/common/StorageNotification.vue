<template>
  <transition name="notification">
    <div
      v-if="isVisible"
      class="fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 max-w-md"
      :class="{
        'bg-blue-800 text-white': currentType === 'info',
        'bg-green-800 text-white': currentType === 'success',
        'bg-yellow-800 text-white': currentType === 'warning',
        'bg-red-800 text-white': currentType === 'error',
      }"
    >
      <div class="flex items-start">
        <div class="flex-shrink-0 mr-3">
          <!-- Info icon -->
          <svg
            v-if="currentType === 'info'"
            class="h-6 w-6 text-blue-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>

          <!-- Success icon -->
          <svg
            v-else-if="currentType === 'success'"
            class="h-6 w-6 text-green-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>

          <!-- Warning icon -->
          <svg
            v-else-if="currentType === 'warning'"
            class="h-6 w-6 text-yellow-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>

          <!-- Error icon -->
          <svg
            v-else-if="currentType === 'error'"
            class="h-6 w-6 text-red-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        <div class="flex-1">
          <h3 class="text-sm font-medium mb-1">{{ currentTitle }}</h3>
          <p class="text-sm opacity-90">{{ currentMessage }}</p>

          <div v-if="showActions" class="mt-3 flex space-x-2">
            <button
              v-if="actionPrimary"
              @click="actionPrimary.handler"
              class="px-3 py-1 text-xs rounded-md bg-white bg-opacity-20 hover:bg-opacity-30 transition-colors"
            >
              {{ actionPrimary.label }}
            </button>

            <button
              v-if="actionSecondary"
              @click="actionSecondary.handler"
              class="px-3 py-1 text-xs rounded-md border border-current border-opacity-30 hover:bg-white hover:bg-opacity-10 transition-colors"
            >
              {{ actionSecondary.label }}
            </button>
          </div>
        </div>

        <button
          @click="dismiss"
          class="flex-shrink-0 ml-2 text-white text-opacity-70 hover:text-opacity-100"
        >
          <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <!-- Progress bar for auto-dismiss -->
      <div
        v-if="autoDismiss"
        class="absolute bottom-0 left-0 h-1 bg-white bg-opacity-30"
        :style="{ width: `${dismissProgress}%`, transition: `width ${dismissDuration}ms linear` }"
      ></div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue';
import { StorageType } from '@/config/storage-config';

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface NotificationAction {
  label: string;
  handler: () => void;
}

interface Props {
  title?: string;
  message: string;
  type?: NotificationType;
  autoDismiss?: boolean;
  dismissDuration?: number;
  actionPrimary?: NotificationAction;
  actionSecondary?: NotificationAction;
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  type: 'info',
  autoDismiss: true,
  dismissDuration: 5000,
  actionPrimary: undefined,
  actionSecondary: undefined,
});

const emit = defineEmits<{
  (event: 'dismissed'): void;
}>();

// State
const isVisible = ref(false);
const dismissProgress = ref(100);
const dismissTimer = ref<number | null>(null);

// Local reactive refs that can be updated
const currentTitle = ref(props.title);
const currentMessage = ref(props.message);
const currentType = ref<NotificationType>(props.type);

// Computed
const showActions = computed(() => !!props.actionPrimary || !!props.actionSecondary);

// Methods
function dismiss() {
  isVisible.value = false;
  if (dismissTimer.value) {
    clearTimeout(dismissTimer.value);
    dismissTimer.value = null;
  }
  emit('dismissed');
}

function startDismissTimer() {
  if (props.autoDismiss) {
    // Reset progress
    dismissProgress.value = 100;

    // Force a reflow to restart the CSS transition
    // eslint-disable-next-line no-unused-expressions
    document.body.offsetHeight;

    // Start the progress bar animation
    requestAnimationFrame(() => {
      dismissProgress.value = 0;
    });

    // Set timer for auto-dismiss
    dismissTimer.value = window.setTimeout(() => {
      dismiss();
    }, props.dismissDuration);
  }
}

// Lifecycle
onMounted(() => {
  // Show the notification with a slight delay for animation purposes
  setTimeout(() => {
    isVisible.value = true;
    startDismissTimer();
  }, 100);

  // Listen for storage strategy changes
  window.addEventListener('storage-strategy-changed', handleStorageStrategyChange);
});

onUnmounted(() => {
  if (dismissTimer.value) {
    clearTimeout(dismissTimer.value);
  }
  window.removeEventListener('storage-strategy-changed', handleStorageStrategyChange);
});

// Handle storage strategy changes
function handleStorageStrategyChange(event: Event) {
  const customEvent = event as CustomEvent;
  const { newType, reason } = customEvent.detail as { newType: StorageType; reason: string };

  // Update notification content
  if (newType === 'indexeddb' && reason === 'memory-pressure') {
    // Show a warning notification about the storage strategy change
    isVisible.value = true;

    // Update local refs directly
    currentTitle.value = 'Storage Strategy Changed';
    currentMessage.value =
      'Due to high memory usage, the application has automatically switched to IndexedDB storage. This may impact performance.';
    currentType.value = 'warning';

    startDismissTimer();
  }
}

// Watch for prop changes to restart the timer
watch(
  () => [props.message, props.title, props.type],
  () => {
    if (isVisible.value) {
      if (dismissTimer.value) {
        clearTimeout(dismissTimer.value);
      }
      startDismissTimer();
    }
  }
);

// Update local refs when props change
watch(
  () => props.title,
  (newTitle) => {
    currentTitle.value = newTitle;
  }
);

watch(
  () => props.message,
  (newMessage) => {
    currentMessage.value = newMessage;
  }
);

watch(
  () => props.type,
  (newType) => {
    currentType.value = newType;
  }
);
</script>

<style scoped>
.notification-enter-active,
.notification-leave-active {
  transition: all 0.3s ease;
}

.notification-enter-from,
.notification-leave-to {
  transform: translateY(-20px);
  opacity: 0;
}
</style>
