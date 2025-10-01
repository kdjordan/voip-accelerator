<template>
  <div class="bg-gray-800/50 rounded-lg overflow-hidden">
    <!-- Table Header -->
    <div class="px-6 py-4 border-b border-gray-700/50">
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-medium text-white">Users</h3>
        <div class="flex items-center space-x-2">
          <input
            type="checkbox"
            :checked="isAllSelected"
            @change="handleSelectAll"
            class="rounded border-gray-600 text-accent focus:ring-accent focus:ring-offset-gray-800"
          />
          <label class="text-sm text-gray-400">Select All</label>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="p-8 text-center text-gray-400">
      <ArrowPathIcon class="animate-spin h-8 w-8 mx-auto mb-2" />
      <p>Loading users...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="users.length === 0" class="p-8 text-center text-gray-400">
      <UserIcon class="h-12 w-12 mx-auto mb-2 opacity-50" />
      <p>No users found</p>
    </div>

    <!-- Table -->
    <div v-else class="overflow-x-auto">
      <table class="w-full">
        <thead class="bg-gray-900/50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              Select
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              User
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              Role
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              Subscription
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              Uploads
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              Status
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              Created
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-700/50">
          <tr
            v-for="user in users"
            :key="user.id"
            class="hover:bg-gray-700/30 transition-colors"
          >
            <!-- Checkbox -->
            <td class="px-6 py-4 whitespace-nowrap">
              <input
                type="checkbox"
                :checked="selectedUsers.has(user.id)"
                @change="() => $emit('user-selected', user.id)"
                class="rounded border-gray-600 text-accent focus:ring-accent focus:ring-offset-gray-800"
              />
            </td>

            <!-- User Info -->
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="flex items-center">
                <div class="flex-shrink-0 h-10 w-10">
                  <div class="h-10 w-10 rounded-full bg-gradient-to-r from-accent to-blue-500 flex items-center justify-center">
                    <span class="text-white font-medium text-sm">
                      {{ getUserInitials(user.email || user.id) }}
                    </span>
                  </div>
                </div>
                <div class="ml-4">
                  <div class="text-sm font-medium text-white">
                    {{ user.email || 'No email' }}
                  </div>
                  <div class="text-sm text-gray-400">
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

            <!-- Subscription -->
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm text-white">
                {{ user.subscription_status || 'None' }}
              </div>
              <div v-if="user.plan_expires_at" class="text-xs text-gray-400">
                Expires: {{ formatDate(user.plan_expires_at) }}
              </div>
            </td>

            <!-- Total Uploads (Analytics) -->
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm text-white font-mono">
                {{ user.total_uploads || 0 }}
              </div>
              <div class="text-xs text-gray-400">
                uploads
              </div>
            </td>

            <!-- Status -->
            <td class="px-6 py-4 whitespace-nowrap">
              <UserStatusToggle
                :user-id="user.id"
                :is-active="true"
                @status-changed="(isActive) => $emit('toggle-status', user.id, isActive)"
              />
            </td>

            <!-- Created Date -->
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
              {{ formatDate(user.created_at) }}
            </td>

            <!-- Actions -->
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
              <div class="flex items-center justify-end space-x-2">
                <button
                  @click="$emit('user-details', user)"
                  class="text-accent hover:text-accent/80 transition-colors"
                  title="View Details"
                >
                  <EyeIcon class="h-4 w-4" />
                </button>
                <button
                  @click="$emit('user-details', user)"
                  class="text-blue-400 hover:text-blue-300 transition-colors"
                  title="Edit User"
                >
                  <PencilIcon class="h-4 w-4" />
                </button>
                <button
                  @click="confirmDelete(user)"
                  class="text-red-400 hover:text-red-300 transition-colors"
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
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { 
  ArrowPathIcon, 
  UserIcon, 
  EyeIcon, 
  PencilIcon, 
  TrashIcon 
} from '@heroicons/vue/24/outline'
import { type UserProfile } from '@/stores/admin-users-store'
import { useAdminUsersStore } from '@/stores/admin-users-store'
import UserRoleSelector from './UserRoleSelector.vue'
import UserStatusToggle from './UserStatusToggle.vue'

// Props
interface Props {
  users: UserProfile[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

// Emits
defineEmits<{
  'user-selected': [userId: string]
  'select-all': []
  'user-details': [user: UserProfile]
  'update-role': [userId: string, role: 'user' | 'admin' | 'superadmin']
  'toggle-status': [userId: string, isActive: boolean]
}>()

// Store
const store = useAdminUsersStore()

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
  if (confirm(`Are you sure you want to delete user ${user.email || user.id}? This action cannot be undone.`)) {
    // TODO: Emit delete event
    console.log('Delete user:', user.id)
  }
}
</script>