<template>
  <div class="flex items-center space-x-2">
    <!-- Status Badge -->
    <BaseBadge
      :variant="statusVariant"
      size="small"
    >
      <span 
        class="w-2 h-2 rounded-full mr-1.5"
        :class="statusDotClass"
      ></span>
      {{ statusText }}
    </BaseBadge>

    <!-- Toggle Button -->
    <button
      @click="handleToggle"
      :disabled="isLoading"
      :title="toggleTitle"
      class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-canvas disabled:opacity-50 disabled:cursor-not-allowed"
      :class="toggleBackgroundClass"
    >
      <span
        class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
        :class="toggleKnobClass"
      >
        <!-- Loading Spinner -->
        <ArrowPathIcon 
          v-if="isLoading" 
          class="h-3 w-3 animate-spin text-fg-mute absolute top-0.5 left-0.5" 
        />
      </span>
    </button>
  </div>

  <ConfirmationModal
    v-model="showConfirmModal"
    title="Confirm Status Change"
    :message="confirmMessage"
    confirm-button-text="Confirm"
    confirm-button-variant="primary"
    @confirm="onConfirm"
  />
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ArrowPathIcon } from '@heroicons/vue/24/outline'
import BaseBadge from '@/components/shared/BaseBadge.vue'
import ConfirmationModal from '@/components/shared/ConfirmationModal.vue'

// Props
interface Props {
  userId: string
  isActive: boolean
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  'status-changed': [isActive: boolean]
}>()

// Local state
const isLoading = ref(false)
const showConfirmModal = ref(false)
const confirmMessage = ref('')
const pendingStatus = ref(false)

// Computed
const statusText = computed(() => {
  return props.isActive ? 'Active' : 'Inactive'
})

const statusVariant = computed(() => {
  return props.isActive ? 'success' : 'destructive'
})

const statusDotClass = computed(() => {
  return props.isActive ? 'bg-warn' : 'bg-down'
})

const toggleBackgroundClass = computed(() => {
  if (isLoading.value) {
    return 'bg-fg-mute'
  }
  return props.isActive ? 'bg-warn' : 'bg-down'
})

const toggleKnobClass = computed(() => {
  return props.isActive ? 'translate-x-6' : 'translate-x-1'
})

const toggleTitle = computed(() => {
  return props.isActive 
    ? 'Click to deactivate user' 
    : 'Click to activate user'
})

// Methods
function handleToggle() {
  const newStatus = !props.isActive
  const action = newStatus ? 'activate' : 'deactivate'

  // Confirm the action
  confirmMessage.value = `Are you sure you want to ${action} this user? ${
    newStatus
      ? 'The user will be able to sign in and use the application.'
      : 'The user will be unable to sign in until reactivated.'
  }`
  pendingStatus.value = newStatus
  showConfirmModal.value = true
}

function onConfirm() {
  showConfirmModal.value = false
  try {
    isLoading.value = true
    emit('status-changed', pendingStatus.value)
  } catch (error) {
    console.error('Failed to toggle user status:', error)
  } finally {
    isLoading.value = false
  }
}
</script>