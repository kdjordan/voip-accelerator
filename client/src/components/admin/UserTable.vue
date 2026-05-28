<template>
  <div class="bg-surface rounded-lg overflow-hidden">
    <!-- Table Header -->
    <div class="px-6 py-4 border-b border-line">
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-medium text-fg">Users</h3>
        <div class="flex items-center space-x-2">
          <input
            type="checkbox"
            :checked="isAllSelected"
            @change="handleSelectAll"
            class="rounded border-line-strong text-accent focus:ring-accent focus:ring-offset-canvas"
          />
          <label class="text-sm text-fg-faint">Select All</label>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="p-8 text-center text-fg-faint">
      <ArrowPathIcon class="animate-spin h-8 w-8 mx-auto mb-2" />
      <p>Loading users...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="users.length === 0" class="p-8 text-center text-fg-faint">
      <UserIcon class="h-12 w-12 mx-auto mb-2 opacity-50" />
      <p>No users found</p>
    </div>

    <!-- Table -->
    <div v-else class="overflow-x-auto">
      <table class="w-full">
        <thead class="bg-row">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-fg-faint uppercase tracking-wider">
              Select
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-fg-faint uppercase tracking-wider">
              User
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-fg-faint uppercase tracking-wider">
              Role
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-fg-faint uppercase tracking-wider">
              Status
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-fg-faint uppercase tracking-wider">
              Created
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-fg-faint uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-line">
          <tr
            v-for="user in users"
            :key="user.id"
            class="hover:bg-row-hover transition-colors"
          >
            <!-- Checkbox -->
            <td class="px-6 py-4 whitespace-nowrap">
              <input
                type="checkbox"
                :checked="selectedUsers.has(user.id)"
                @change="() => $emit('user-selected', user.id)"
                class="rounded border-line-strong text-accent focus:ring-accent focus:ring-offset-canvas"
              />
            </td>

            <!-- User Info -->
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="flex items-center">
                <div class="flex-shrink-0 h-10 w-10">
                  <div class="h-10 w-10 rounded-full bg-accent-soft ring-1 ring-accent-ring flex items-center justify-center">
                    <span class="text-accent font-medium text-sm">
                      {{ getUserInitials(user.email || user.id) }}
                    </span>
                  </div>
                </div>
                <div class="ml-4">
                  <div class="text-sm font-medium text-fg">
                    {{ user.email || 'No email' }}
                  </div>
                  <div class="text-sm text-fg-faint">
                    ID: {{ user.id.slice(0, 8) }}...
                  </div>
                </div>
              </div>
            </td>

            <!-- Role -->
            <td class="px-6 py-4 whitespace-nowrap">
              <UserRoleSelector
                :current-role="user.role"
                :user-id="user.id"
                @role-changed="(role) => $emit('update-role', user.id, role)"
              />
            </td>

            <!-- Status -->
            <td class="px-6 py-4 whitespace-nowrap">
              <UserStatusToggle
                :user-id="user.id"
                :is-active="!user.banned"
                @status-changed="(isActive) => $emit('toggle-status', user.id, isActive)"
              />
            </td>

            <!-- Created Date -->
            <td class="px-6 py-4 whitespace-nowrap text-sm text-fg-faint">
              {{ formatDate(user.created_at) }}
            </td>

            <!-- Actions -->
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
              <div class="flex items-center justify-end space-x-2">
                <button
                  @click="confirmDelete(user)"
                  class="text-down hover:text-down transition-colors"
                  title="Delete User"
                >
                  <TrashIcon class="h-4 w-4" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <ConfirmationModal
    v-model="showDeleteModal"
    title="Delete User"
    :message="deleteMessage"
    confirm-button-text="Delete"
    confirm-button-variant="destructive"
    @confirm="onConfirmDelete"
  />
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  ArrowPathIcon,
  UserIcon,
  TrashIcon
} from '@heroicons/vue/24/outline'
import { type UserProfile } from '@/stores/admin-users-store'
import { useAdminUsersStore } from '@/stores/admin-users-store'
import UserRoleSelector from './UserRoleSelector.vue'
import UserStatusToggle from './UserStatusToggle.vue'
import ConfirmationModal from '@/components/shared/ConfirmationModal.vue'

// Props
interface Props {
  users: UserProfile[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

// Emits
const emit = defineEmits<{
  'user-selected': [userId: string]
  'select-all': []
  'update-role': [userId: string, role: 'user' | 'admin']
  'toggle-status': [userId: string, isActive: boolean]
  'delete-user': [userId: string]
}>()

// Store
const store = useAdminUsersStore()

// Delete confirmation state
const showDeleteModal = ref(false)
const deleteMessage = ref('')
const pendingDeleteUserId = ref<string | null>(null)

// Computed
const selectedUsers = computed(() => store.state.selectedUsers)

const isAllSelected = computed(() => {
  return props.users.length > 0 && props.users.every(user => selectedUsers.value.has(user.id))
})

// Methods
function handleSelectAll(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.checked) {
    props.users.forEach(user => store.state.selectedUsers.add(user.id))
  } else {
    props.users.forEach(user => store.state.selectedUsers.delete(user.id))
  }
}

function getUserInitials(email: string): string {
  if (email.includes('@')) {
    return email.split('@')[0].slice(0, 2).toUpperCase()
  }
  return email.slice(0, 2).toUpperCase()
}

function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  } catch {
    return 'Invalid date'
  }
}

function confirmDelete(user: UserProfile) {
  deleteMessage.value = `Are you sure you want to delete user ${user.email || user.id}? This action cannot be undone.`
  pendingDeleteUserId.value = user.id
  showDeleteModal.value = true
}

function onConfirmDelete() {
  showDeleteModal.value = false
  if (pendingDeleteUserId.value) {
    emit('delete-user', pendingDeleteUserId.value)
    pendingDeleteUserId.value = null
  }
}
</script>