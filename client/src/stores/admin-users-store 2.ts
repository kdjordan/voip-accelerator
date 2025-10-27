import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface UserProfile {
  id: string
  created_at: string
  updated_at: string | null
  role: string
  plan_expires_at: string | null
  stripe_customer_id: string | null
  subscription_status: string | null
  total_uploads: number | null
  uploads_this_month: number | null
  uploads_reset_date: string | null
  email?: string
}

export interface UserActivity {
  lastLogin: string | null
  totalLogins: number
  createdAt: string
  lastActivity: string | null
  rateSheetUploads: number
  isActive: boolean
  banDuration: string | null
}

interface AdminUsersState {
  users: UserProfile[]
  totalUsers: number
  currentPage: number
  itemsPerPage: number
  searchQuery: string
  roleFilter: string | null
  statusFilter: 'all' | 'active' | 'inactive'
  isLoading: boolean
  error: string | null
  selectedUsers: Set<string>
  userActivities: Map<string, UserActivity>
}

export const useAdminUsersStore = defineStore('admin-users', () => {
  // State
  const state = ref<AdminUsersState>({
    users: [],
    totalUsers: 0,
    currentPage: 1,
    itemsPerPage: 20,
    searchQuery: '',
    roleFilter: null,
    statusFilter: 'all',
    isLoading: false,
    error: null,
    selectedUsers: new Set(),
    userActivities: new Map(),
  })

  // Getters
  const hasMorePages = computed(() => {
    return state.value.totalUsers > state.value.currentPage * state.value.itemsPerPage
  })

  const totalPages = computed(() => {
    return Math.ceil(state.value.totalUsers / state.value.itemsPerPage)
  })

  const selectedUsersList = computed(() => {
    return Array.from(state.value.selectedUsers)
  })

  const filteredUsers = computed(() => {
    let filtered = state.value.users

    if (state.value.searchQuery) {
      const query = state.value.searchQuery.toLowerCase()
      filtered = filtered.filter(user => 
        user.email?.toLowerCase().includes(query) ||
        user.id.toLowerCase().includes(query)
      )
    }

    if (state.value.roleFilter) {
      filtered = filtered.filter(user => user.role === state.value.roleFilter)
    }

    return filtered
  })

  // Actions
  function setUsers(users: UserProfile[]) {
    state.value.users = users
  }

  function addUser(user: UserProfile) {
    const existingIndex = state.value.users.findIndex(u => u.id === user.id)
    if (existingIndex >= 0) {
      state.value.users[existingIndex] = user
    } else {
      state.value.users.push(user)
    }
  }

  function updateUser(userId: string, updates: Partial<UserProfile>) {
    const userIndex = state.value.users.findIndex(u => u.id === userId)
    if (userIndex >= 0) {
      state.value.users[userIndex] = { ...state.value.users[userIndex], ...updates }
    }
  }

  function removeUser(userId: string) {
    state.value.users = state.value.users.filter(u => u.id !== userId)
    state.value.selectedUsers.delete(userId)
    state.value.userActivities.delete(userId)
  }

  function setTotalUsers(total: number) {
    state.value.totalUsers = total
  }

  function setCurrentPage(page: number) {
    state.value.currentPage = page
  }

  function setItemsPerPage(count: number) {
    state.value.itemsPerPage = Math.max(1, Math.min(100, count))
  }

  function setSearchQuery(query: string) {
    state.value.searchQuery = query
    state.value.currentPage = 1 // Reset to first page when searching
  }

  function setRoleFilter(role: string | null) {
    state.value.roleFilter = role
    state.value.currentPage = 1 // Reset to first page when filtering
  }

  function setStatusFilter(status: 'all' | 'active' | 'inactive') {
    state.value.statusFilter = status
    state.value.currentPage = 1 // Reset to first page when filtering
  }

  function setLoading(loading: boolean) {
    state.value.isLoading = loading
  }

  function setError(error: string | null) {
    state.value.error = error
  }

  function toggleUserSelection(userId: string) {
    if (state.value.selectedUsers.has(userId)) {
      state.value.selectedUsers.delete(userId)
    } else {
      state.value.selectedUsers.add(userId)
    }
  }

  function selectAllUsers() {
    state.value.users.forEach(user => {
      state.value.selectedUsers.add(user.id)
    })
  }

  function clearSelection() {
    state.value.selectedUsers.clear()
  }

  function setUserActivity(userId: string, activity: UserActivity) {
    state.value.userActivities.set(userId, activity)
  }

  function getUserActivity(userId: string): UserActivity | null {
    return state.value.userActivities.get(userId) || null
  }

  function nextPage() {
    if (hasMorePages.value) {
      state.value.currentPage += 1
    }
  }

  function previousPage() {
    if (state.value.currentPage > 1) {
      state.value.currentPage -= 1
    }
  }

  function goToPage(page: number) {
    if (page >= 1 && page <= totalPages.value) {
      state.value.currentPage = page
    }
  }

  function resetFilters() {
    state.value.searchQuery = ''
    state.value.roleFilter = null
    state.value.statusFilter = 'all'
    state.value.currentPage = 1
  }

  function resetStore() {
    state.value = {
      users: [],
      totalUsers: 0,
      currentPage: 1,
      itemsPerPage: 20,
      searchQuery: '',
      roleFilter: null,
      statusFilter: 'all',
      isLoading: false,
      error: null,
      selectedUsers: new Set(),
      userActivities: new Map(),
    }
  }

  return {
    // State
    state: state.value,
    
    // Getters
    hasMorePages,
    totalPages,
    selectedUsersList,
    filteredUsers,
    
    // Actions
    setUsers,
    addUser,
    updateUser,
    removeUser,
    setTotalUsers,
    setCurrentPage,
    setItemsPerPage,
    setSearchQuery,
    setRoleFilter,
    setStatusFilter,
    setLoading,
    setError,
    toggleUserSelection,
    selectAllUsers,
    clearSelection,
    setUserActivity,
    getUserActivity,
    nextPage,
    previousPage,
    goToPage,
    resetFilters,
    resetStore,
  }
})