<template>
  <div
    v-if="show"
    class="fixed inset-0 z-50 overflow-y-auto"
    @click="handleBackdropClick"
  >
    <div class="flex min-h-screen items-center justify-center p-4">
      <!-- Backdrop -->
      <div class="fixed inset-0 bg-black bg-opacity-75 transition-opacity"></div>

      <!-- Modal -->
      <div 
        ref="modalRef"
        class="relative bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
      >
        <!-- Header -->
        <div class="flex items-center justify-between p-6 border-b border-gray-700">
          <div class="flex items-center space-x-4">
            <div class="h-12 w-12 rounded-full bg-gradient-to-r from-accent to-blue-500 flex items-center justify-center">
              <span class="text-white font-medium">
                {{ getUserInitials(user?.email || user?.id || '') }}
              </span>
            </div>
            <div>
              <h2 class="text-xl font-semibold text-white">User Details</h2>
              <p class="text-sm text-gray-400">
                {{ user?.email || 'No email available' }}
              </p>
            </div>
          </div>
          <button
            @click="$emit('close')"
            class="text-gray-400 hover:text-white transition-colors"
          >
            <XMarkIcon class="h-6 w-6" />
          </button>
        </div>

        <!-- Loading State -->
        <div v-if="isLoadingActivity" class="p-6">
          <div class="flex items-center justify-center space-x-2 text-gray-400">
            <ArrowPathIcon class="animate-spin h-5 w-5" />
            <span>Loading user activity...</span>
          </div>
        </div>

        <!-- Content -->
        <div v-else class="overflow-y-auto max-h-[calc(90vh-120px)]">
          <div class="p-6 space-y-6">
            <!-- Basic Information -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Profile Information -->
              <div class="space-y-4">
                <h3 class="text-lg font-medium text-white border-b border-gray-700 pb-2">
                  Profile Information
                </h3>
                
                <div class="space-y-3">
                  <div>
                    <label class="block text-sm font-medium text-gray-400">User ID</label>
                    <p class="mt-1 text-sm text-white font-mono">{{ user?.id }}</p>
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-gray-400">Email</label>
                    <p class="mt-1 text-sm text-white">{{ user?.email || 'Not available' }}</p>
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-gray-400">Role</label>
                    <div class="mt-1 flex items-center space-x-2">
                      <UserRoleSelector
                        v-if="user"
                        :current-role="user.role"
                        :user-id="user.id"
                        @role-changed="handleRoleChange"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-gray-400">Status</label>
                    <div class="mt-1">
                      <UserStatusToggle
                        v-if="user"
                        :user-id="user.id"
                        :is-active="userActivity?.isActive ?? true"
                        @status-changed="handleStatusChange"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <!-- Account Information -->
              <div class="space-y-4">
                <h3 class="text-lg font-medium text-white border-b border-gray-700 pb-2">
                  Account Information
                </h3>
                
                <div class="space-y-3">
                  <div>
                    <label class="block text-sm font-medium text-gray-400">Created</label>
                    <p class="mt-1 text-sm text-white">{{ formatDateTime(user?.created_at) }}</p>
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-gray-400">Last Updated</label>
                    <p class="mt-1 text-sm text-white">{{ formatDateTime(user?.updated_at) || 'Never' }}</p>
                  </div>
                  
                  <div v-if="userActivity">
                    <label class="block text-sm font-medium text-gray-400">Last Login</label>
                    <p class="mt-1 text-sm text-white">{{ formatDateTime(userActivity.lastLogin) || 'Never' }}</p>
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-gray-400">Signup Method</label>
                    <p class="mt-1 text-sm text-white">{{ user?.signup_method || 'Unknown' }}</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Subscription Information -->
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <h3 class="text-lg font-medium text-white border-b border-gray-700 pb-2 flex-1">
                  Subscription Information
                </h3>
                <BaseButton
                  @click="toggleEditMode"
                  variant="secondary-outline"
                  size="small"
                  :icon="isEditing ? XMarkIcon : PencilIcon"
                >
                  {{ isEditing ? 'Cancel' : 'Edit' }}
                </BaseButton>
              </div>
              
              <div v-if="!isEditing" class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-400">Status</label>
                  <p class="mt-1 text-sm text-white">{{ user?.subscription_status || 'None' }}</p>
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-gray-400">Plan Expires</label>
                  <p class="mt-1 text-sm text-white">{{ formatDateTime(user?.plan_expires_at) || 'No expiration' }}</p>
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-gray-400">Stripe Customer</label>
                  <p class="mt-1 text-sm text-white font-mono">
                    {{ user?.stripe_customer_id ? user.stripe_customer_id.slice(0, 20) + '...' : 'None' }}
                  </p>
                </div>
              </div>

              <!-- Edit Form -->
              <div v-else class="space-y-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-400 mb-2">Subscription Status</label>
                    <Listbox v-model="editForm.subscription_status">
                      <div class="relative">
                        <ListboxButton
                          class="relative w-full cursor-default rounded bg-gray-700 py-2 pl-3 pr-8 text-left text-sm text-white shadow-sm ring-1 ring-inset ring-gray-600 focus:outline-none focus:ring-2 focus:ring-accent"
                        >
                          <span class="block truncate">{{ getSubscriptionStatusDisplayName(editForm.subscription_status) }}</span>
                          <span class="pointer-events-none absolute inset-y-0 right-0 ml-3 flex items-center pr-2">
                            <ChevronUpDownIcon class="h-4 w-4 text-gray-400" aria-hidden="true" />
                          </span>
                        </ListboxButton>

                        <transition
                          leave-active-class="transition duration-100 ease-in"
                          leave-from-class="opacity-100"
                          leave-to-class="opacity-0"
                        >
                          <ListboxOptions
                            class="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-md bg-gray-800 py-1 text-sm shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
                          >
                            <ListboxOption
                              v-for="option in subscriptionStatusOptions"
                              :key="option.value"
                              :value="option.value"
                              as="template"
                              v-slot="{ active, selected }"
                            >
                              <li
                                :class="[
                                  active ? 'bg-accent/20 text-white' : 'text-gray-300',
                                  'relative cursor-default select-none py-2 pl-3 pr-9'
                                ]"
                              >
                                <span
                                  :class="[
                                    selected ? 'font-semibold' : 'font-normal',
                                    'block truncate'
                                  ]"
                                >
                                  {{ option.name }}
                                </span>

                                <span
                                  v-if="selected"
                                  :class="[
                                    active ? 'text-white' : 'text-accent',
                                    'absolute inset-y-0 right-0 flex items-center pr-4'
                                  ]"
                                >
                                  <CheckIcon class="h-4 w-4" aria-hidden="true" />
                                </span>
                              </li>
                            </ListboxOption>
                          </ListboxOptions>
                        </transition>
                      </div>
                    </Listbox>
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-gray-400 mb-2">Plan Expires</label>
                    <input
                      v-model="editForm.plan_expires_at"
                      type="datetime-local"
                      class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm text-white focus:outline-none focus:border-accent"
                    />
                  </div>
                </div>

                <div class="flex justify-end space-x-2 pt-4">
                  <BaseButton
                    @click="cancelEdit"
                    variant="secondary-outline"
                    size="small"
                  >
                    Cancel
                  </BaseButton>
                  <BaseButton
                    @click="saveSubscriptionChanges"
                    :loading="isSaving"
                    variant="primary"
                    size="small"
                  >
                    Save Changes
                  </BaseButton>
                </div>
              </div>
            </div>

            <!-- Activity Statistics -->
            <div v-if="userActivity" class="space-y-4">
              <h3 class="text-lg font-medium text-white border-b border-gray-700 pb-2">
                Activity Statistics
              </h3>
              
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div class="bg-gray-900/50 p-4 rounded-lg">
                  <div class="text-2xl font-bold text-white">{{ userActivity.totalLogins }}</div>
                  <div class="text-sm text-gray-400">Total Logins</div>
                </div>
                
                <div class="bg-gray-900/50 p-4 rounded-lg">
                  <div class="text-2xl font-bold text-accent">{{ userActivity.rateSheetUploads }}</div>
                  <div class="text-sm text-gray-400">Rate Sheets</div>
                </div>
                
                <div class="bg-gray-900/50 p-4 rounded-lg">
                  <div class="text-2xl font-bold" :class="userActivity.isActive ? 'text-green-400' : 'text-red-400'">
                    {{ userActivity.isActive ? 'Active' : 'Inactive' }}
                  </div>
                  <div class="text-sm text-gray-400">Current Status</div>
                </div>
                
                <div class="bg-gray-900/50 p-4 rounded-lg">
                  <div class="text-2xl font-bold text-blue-400">
                    {{ getDaysSinceCreated(userActivity.createdAt) }}
                  </div>
                  <div class="text-sm text-gray-400">Days Active</div>
                </div>
              </div>
            </div>

            <!-- Technical Information -->
            <div class="space-y-4">
              <h3 class="text-lg font-medium text-white border-b border-gray-700 pb-2">
                Technical Information
              </h3>
              
              <div class="space-y-3">
                <div v-if="user?.user_agent">
                  <label class="block text-sm font-medium text-gray-400">User Agent</label>
                  <p class="mt-1 text-xs text-white font-mono bg-gray-900/50 p-2 rounded break-all">
                    {{ user.user_agent }}
                  </p>
                </div>
                
                <div v-if="userActivity?.banDuration">
                  <label class="block text-sm font-medium text-gray-400">Ban Duration</label>
                  <p class="mt-1 text-sm text-red-400">{{ userActivity.banDuration }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="flex items-center justify-end space-x-3 px-6 py-4 border-t border-gray-700 bg-gray-900/50">
          <button
            @click="$emit('close')"
            class="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { XMarkIcon, ArrowPathIcon, PencilIcon, ChevronUpDownIcon, CheckIcon } from '@heroicons/vue/24/outline'
import { Listbox, ListboxButton, ListboxOptions, ListboxOption } from '@headlessui/vue'
import { type UserProfile, type UserActivity } from '@/stores/admin-users-store'
import { useAdminUsers } from '@/composables/useAdminUsers'
import UserRoleSelector from './UserRoleSelector.vue'
import UserStatusToggle from './UserStatusToggle.vue'
import BaseButton from '@/components/shared/BaseButton.vue'

// Props
interface Props {
  show: boolean
  user: UserProfile | null
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  'close': []
  'update-user': [user: UserProfile]
}>()

// Composables
const { getUserActivity, updateUserRole, toggleUserStatus, updateUserSubscription } = useAdminUsers()

// Local state
const modalRef = ref<HTMLDivElement>()
const isLoadingActivity = ref(false)
const userActivity = ref<UserActivity | null>(null)
const isEditing = ref(false)
const isSaving = ref(false)

// Edit form
const editForm = ref({
  subscription_status: '',
  plan_expires_at: ''
})

// Subscription status options
const subscriptionStatusOptions = [
  { value: '', name: 'None' },
  { value: 'trial', name: 'Trial' },
  { value: 'monthly', name: 'Monthly' },
  { value: 'annual', name: 'Annual' }
]

// Methods
function handleBackdropClick(event: MouseEvent) {
  if (event.target === event.currentTarget) {
    emit('close')
  }
}

function getUserInitials(email: string): string {
  if (email.includes('@')) {
    return email.split('@')[0].slice(0, 2).toUpperCase()
  }
  return email.slice(0, 2).toUpperCase()
}

function formatDateTime(dateString: string | null): string {
  if (!dateString) return 'Never'
  
  try {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return 'Invalid date'
  }
}

function getDaysSinceCreated(createdAt: string): number {
  try {
    const created = new Date(createdAt)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - created.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  } catch {
    return 0
  }
}

async function loadUserActivity() {
  if (!props.user) return
  
  try {
    isLoadingActivity.value = true
    userActivity.value = await getUserActivity(props.user.id)
  } catch (error) {
    console.error('Failed to load user activity:', error)
    userActivity.value = null
  } finally {
    isLoadingActivity.value = false
  }
}

async function handleRoleChange(role: 'user' | 'admin' | 'superadmin') {
  if (!props.user) return
  
  try {
    await updateUserRole(props.user.id, role)
    emit('update-user', { ...props.user, role, updated_at: new Date().toISOString() })
  } catch (error) {
    console.error('Failed to update role:', error)
  }
}

async function handleStatusChange(isActive: boolean) {
  if (!props.user) return
  
  try {
    await toggleUserStatus(props.user.id, isActive)
    if (userActivity.value) {
      userActivity.value.isActive = isActive
    }
  } catch (error) {
    console.error('Failed to toggle status:', error)
  }
}

function toggleEditMode() {
  if (isEditing.value) {
    cancelEdit()
  } else {
    startEdit()
  }
}

function startEdit() {
  if (!props.user) return
  
  isEditing.value = true
  editForm.value = {
    subscription_status: props.user.subscription_status || '',
    plan_expires_at: props.user.plan_expires_at ? formatDateForInput(props.user.plan_expires_at) : ''
  }
}

function cancelEdit() {
  isEditing.value = false
  editForm.value = {
    subscription_status: '',
    plan_expires_at: ''
  }
}

async function saveSubscriptionChanges() {
  if (!props.user) return
  
  try {
    isSaving.value = true
    
    const updates: { subscription_status?: string; plan_expires_at?: string } = {}
    
    // Only include changed fields
    if (editForm.value.subscription_status !== (props.user.subscription_status || '')) {
      updates.subscription_status = editForm.value.subscription_status || null
    }
    
    if (editForm.value.plan_expires_at !== (props.user.plan_expires_at ? formatDateForInput(props.user.plan_expires_at) : '')) {
      updates.plan_expires_at = editForm.value.plan_expires_at ? new Date(editForm.value.plan_expires_at).toISOString() : null
    }
    
    // Only make API call if there are changes
    if (Object.keys(updates).length > 0) {
      await updateUserSubscription(props.user.id, updates)
      
      // Update the user object
      const updatedUser = {
        ...props.user,
        ...updates,
        updated_at: new Date().toISOString()
      }
      
      emit('update-user', updatedUser)
    }
    
    isEditing.value = false
  } catch (error) {
    console.error('Failed to update subscription:', error)
  } finally {
    isSaving.value = false
  }
}

function formatDateForInput(dateString: string): string {
  try {
    const date = new Date(dateString)
    // Format for datetime-local input (YYYY-MM-DDTHH:MM)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}`
  } catch {
    return ''
  }
}

function getSubscriptionStatusDisplayName(value: string): string {
  const option = subscriptionStatusOptions.find(opt => opt.value === value)
  return option?.name || 'None'
}

// Watchers
watch(() => props.show, (show) => {
  if (show && props.user) {
    loadUserActivity()
    // Reset edit mode when opening modal
    isEditing.value = false
  } else {
    userActivity.value = null
    isEditing.value = false
  }
})

// Lifecycle
onMounted(() => {
  // Handle escape key
  function handleEscape(event: KeyboardEvent) {
    if (event.key === 'Escape' && props.show) {
      emit('close')
    }
  }
  
  document.addEventListener('keydown', handleEscape)
  
  // Cleanup
  return () => {
    document.removeEventListener('keydown', handleEscape)
  }
})
</script>