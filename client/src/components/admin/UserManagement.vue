<template>
  <div class="bg-gray-900/50">
    <!-- Access Denied for Non-Admins -->
    <div v-if="!isAdmin" class="px-6 py-4 border-b border-gray-700/50">
      <div class="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
        <div class="flex items-start space-x-3">
          <div class="flex-shrink-0">
            <XMarkIcon class="h-6 w-6 text-red-400" />
          </div>
          <div class="flex-1">
            <h3 class="text-lg font-medium text-red-400 mb-2">Access Denied</h3>
            <p class="text-red-300 text-sm">Admin privileges are required to access User Management.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Admin Content -->
    <div v-else>
      <div class="px-6 py-4 border-b border-gray-700/50">
        <div class="flex justify-between items-center">
          <h2 class="text-xl font-semibold">User Management</h2>
          <div class="flex items-center space-x-3">
            <BaseBadge v-if="store.state.totalUsers > 0" variant="accent" size="small">
              {{ store.state.totalUsers }} users total
            </BaseBadge>
          </div>
        </div>
      </div>

    <div class="p-6 space-y-6">
      <!-- Loading State -->
      <div v-if="isLoading" class="flex items-center justify-center space-x-2 text-gray-400">
        <ArrowPathIcon class="animate-spin h-5 w-5 text-accent" />
        <span>Loading user data...</span>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
        <div class="flex items-start space-x-3">
          <div class="flex-shrink-0">
            <XMarkIcon class="h-6 w-6 text-red-400" />
          </div>
          <div class="flex-1">
            <h3 class="text-lg font-medium text-red-400 mb-2">Error Loading Users</h3>
            <p class="text-red-300 text-sm mb-3">{{ error }}</p>
            <BaseButton
              @click="loadUsers"
              variant="destructive"
              size="small"
              :icon="ArrowPathIcon"
            >
              Retry
            </BaseButton>
          </div>
        </div>
      </div>

      <!-- Main Management Interface -->
      <div v-else class="space-y-6">
        <!-- Statistics Dashboard -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div class="bg-gray-800/50 p-4 rounded-lg">
            <div class="text-2xl font-bold text-white">{{ store.state.totalUsers }}</div>
            <div class="text-sm text-gray-400">Total Users</div>
          </div>
          <div class="bg-gray-800/50 p-4 rounded-lg">
            <div class="text-2xl font-bold text-white">{{ adminCount }}</div>
            <div class="text-sm text-gray-400">Administrators</div>
          </div>
          <div class="bg-gray-800/50 p-4 rounded-lg">
            <div class="text-2xl font-bold text-white">{{ activeCount }}</div>
            <div class="text-sm text-gray-400">Active Users</div>
          </div>
          <div class="bg-gray-800/50 p-4 rounded-lg">
            <div class="text-2xl font-bold text-white">{{ store.state.selectedUsers.size }}</div>
            <div class="text-sm text-gray-400">Selected</div>
          </div>
        </div>

        <!-- Search and Filters -->
        <div class="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div class="flex flex-col md:flex-row gap-3 flex-1">
            <!-- Search Input -->
            <div class="relative">
              <MagnifyingGlassIcon class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                v-model="searchQuery"
                @input="debouncedSearch"
                type="text"
                placeholder="Search by email..."
                class="pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-accent"
              />
            </div>

            <!-- Role Filter -->
            <Listbox
              v-model="roleFilter"
              @update:model-value="filterByRole"
            >
              <div class="relative">
                <ListboxButton
                  class="relative w-full cursor-default rounded bg-gray-800 py-2 pl-3 pr-8 text-left text-sm text-white shadow-sm ring-1 ring-inset ring-gray-600 focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <span class="block truncate">{{ getRoleFilterDisplayName(roleFilter) }}</span>
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
                      v-for="option in roleFilterOptions"
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

            <!-- Status Filter -->
            <Listbox
              v-model="statusFilter"
              @update:model-value="filterByStatus"
            >
              <div class="relative">
                <ListboxButton
                  class="relative w-full cursor-default rounded bg-gray-800 py-2 pl-3 pr-8 text-left text-sm text-white shadow-sm ring-1 ring-inset ring-gray-600 focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <span class="block truncate">{{ getStatusFilterDisplayName(statusFilter) }}</span>
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
                      v-for="option in statusFilterOptions"
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

          <!-- Action Buttons -->
          <div class="flex gap-2">
            <BaseButton
              @click="clearFilters"
              variant="secondary"
              size="small"
            >
              Clear Filters
            </BaseButton>
            <BaseButton
              @click="exportUsers"
              :disabled="isExporting"
              :loading="isExporting"
              variant="primary"
              size="small"
            >
              Export CSV
            </BaseButton>
            <BaseButton
              @click="loadUsers"
              variant="secondary"
              size="small"
              :icon="ArrowPathIcon"
            >
              Refresh
            </BaseButton>
          </div>
        </div>

        <!-- Bulk Actions -->
        <div v-if="store.state.selectedUsers.size > 0" class="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
          <div class="flex items-center justify-between">
            <BaseBadge variant="info" size="small">
              {{ store.state.selectedUsers.size }} user(s) selected
            </BaseBadge>
            <div class="flex gap-2">
              <BaseButton
                @click="store.clearSelection()"
                variant="secondary-outline"
                size="small"
              >
                Clear Selection
              </BaseButton>
              <!-- Add more bulk actions here as needed -->
            </div>
          </div>
        </div>

        <!-- User Table -->
        <UserTable
          :users="store.state.users"
          :loading="store.state.isLoading"
          @user-selected="store.toggleUserSelection"
          @select-all="store.selectAllUsers"
          @user-details="showUserDetails"
          @update-role="handleUpdateRole"
          @toggle-status="handleToggleStatus"
        />

        <!-- Pagination -->
        <div v-if="store.totalPages > 1" class="flex items-center justify-between">
          <div class="text-sm text-gray-400">
            Page {{ store.state.currentPage }} of {{ store.totalPages }}
            ({{ store.state.totalUsers }} total users)
          </div>
          <div class="flex gap-2">
            <BaseButton
              @click="changePage(store.state.currentPage - 1)"
              :disabled="store.state.currentPage <= 1"
              variant="secondary"
              size="small"
            >
              Previous
            </BaseButton>
            <BaseButton
              @click="changePage(store.state.currentPage + 1)"
              :disabled="!store.hasMorePages"
              variant="secondary"
              size="small"
            >
              Next
            </BaseButton>
          </div>
        </div>
      </div>
    </div>
    </div>

    <!-- User Details Modal -->
    <UserDetailsModal
      :show="showDetailsModal"
      :user="selectedUser"
      @close="closeUserDetails"
      @update-user="handleUserUpdate"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ArrowPathIcon, MagnifyingGlassIcon, XMarkIcon, ChevronUpDownIcon, CheckIcon } from '@heroicons/vue/24/outline'
import { Listbox, ListboxButton, ListboxOptions, ListboxOption } from '@headlessui/vue'
import { useAdminUsers } from '@/composables/useAdminUsers'
import { type UserProfile } from '@/stores/admin-users-store'
import { useUserStore } from '@/stores/user-store'
import UserTable from './UserTable.vue'
import UserDetailsModal from './UserDetailsModal.vue'
import BaseButton from '@/components/shared/BaseButton.vue'
import BaseBadge from '@/components/shared/BaseBadge.vue'

// Composables
const { store, isLoading, error, fetchUsers, updateUserRole, toggleUserStatus, exportUsers: exportUsersComposable, searchUsers, filterByRole: filterByRoleComposable, changePage: changePageComposable } = useAdminUsers()
const userStore = useUserStore()

// Check if user is admin
const isAdmin = computed(() => userStore.isAdmin)

// Local state
const searchQuery = ref('')
const roleFilter = ref('')
const statusFilter = ref('all')
const isExporting = ref(false)
const showDetailsModal = ref(false)
const selectedUser = ref<UserProfile | null>(null)

// Computed
const adminCount = computed(() => {
  return store.state.users.filter(user => ['admin', 'super_admin'].includes(user.role)).length
})

const activeCount = computed(() => {
  // For now, assume all users are active unless we have activity data showing otherwise
  return store.state.users.length
})

// Filter options
const roleFilterOptions = [
  { value: '', name: 'All Roles' },
  { value: 'user', name: 'Users' },
  { value: 'admin', name: 'Admins' },
  { value: 'super_admin', name: 'Super Admins' }
]

const statusFilterOptions = [
  { value: 'all', name: 'All Status' },
  { value: 'active', name: 'Active' },
  { value: 'inactive', name: 'Inactive' }
]

// Methods

async function loadUsers() {
  try {
    await fetchUsers()
  } catch (err) {
    console.error('Failed to load users:', err)
  }
}

// Debounced search
let searchTimeout: NodeJS.Timeout
function debouncedSearch() {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(async () => {
    try {
      await searchUsers(searchQuery.value)
    } catch (err) {
      console.error('Search failed:', err)
    }
  }, 300)
}

async function filterByRole(newRole: string) {
  roleFilter.value = newRole
  try {
    await filterByRoleComposable(newRole || null)
  } catch (err) {
    console.error('Filter failed:', err)
  }
}

async function filterByStatus(newStatus: string) {
  statusFilter.value = newStatus
  store.setStatusFilter(newStatus as 'all' | 'active' | 'inactive')
  try {
    await fetchUsers()
  } catch (err) {
    console.error('Filter failed:', err)
  }
}

function clearFilters() {
  searchQuery.value = ''
  roleFilter.value = ''
  statusFilter.value = 'all'
  store.resetFilters()
  loadUsers()
}

async function exportUsers() {
  try {
    isExporting.value = true
    await exportUsersComposable()
  } catch (err) {
    console.error('Export failed:', err)
  } finally {
    isExporting.value = false
  }
}

function showUserDetails(user: UserProfile) {
  selectedUser.value = user
  showDetailsModal.value = true
}

function closeUserDetails() {
  showDetailsModal.value = false
  selectedUser.value = null
}

async function handleUpdateRole(userId: string, role: 'user' | 'admin' | 'superadmin') {
  try {
    await updateUserRole(userId, role)
  } catch (err) {
    console.error('Failed to update role:', err)
  }
}

async function handleToggleStatus(userId: string, isActive: boolean) {
  try {
    await toggleUserStatus(userId, isActive)
  } catch (err) {
    console.error('Failed to toggle status:', err)
  }
}

async function changePage(page: number) {
  try {
    await changePageComposable(page)
  } catch (err) {
    console.error('Failed to change page:', err)
  }
}

function handleUserUpdate(user: UserProfile) {
  store.updateUser(user.id, user)
  closeUserDetails()
}

function getRoleFilterDisplayName(value: string): string {
  const option = roleFilterOptions.find(opt => opt.value === value)
  return option?.name || 'All Roles'
}

function getStatusFilterDisplayName(value: string): string {
  const option = statusFilterOptions.find(opt => opt.value === value)
  return option?.name || 'All Status'
}

// Lifecycle
onMounted(() => {
  // Auto-load users on mount
  loadUsers()
})
</script>