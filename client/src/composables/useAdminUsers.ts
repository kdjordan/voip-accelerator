import { ref } from 'vue'
import { useAdminUsersStore, type UserProfile, type UserActivity } from '@/stores/admin-users-store'
import { authClient } from '@/lib/auth'

interface GetUsersParams {
  page?: number
  limit?: number
  search?: string
  role?: string
  status?: string
}

interface GetUsersResponse {
  users: UserProfile[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

// Stripe / upload-limit admin fields aren't owned by better-auth; the routes that
// back these get ported in chunk 4 (subscription surface). Until then, stub + throw.
const CHUNK_4_NOT_PORTED =
  'Subscription and upload admin actions are not available yet (ported in chunk 4).'

export function useAdminUsers() {
  const store = useAdminUsersStore()
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Map a better-auth admin user onto the UserProfile shape the UI renders.
  // Subscription/upload columns are chunk-4 territory, so they come back null.
  function toUserProfile(u: {
    id: string
    email: string
    role?: string | null
    banned?: boolean | null
    createdAt: string | Date
    updatedAt: string | Date | null
  }): UserProfile {
    return {
      id: u.id,
      email: u.email,
      role: u.role ?? 'user',
      banned: u.banned ?? false,
      created_at: new Date(u.createdAt).toISOString(),
      updated_at: u.updatedAt ? new Date(u.updatedAt).toISOString() : null,
      plan_expires_at: null,
      stripe_customer_id: null,
      subscription_status: null,
      total_uploads: null,
      uploads_this_month: null,
      uploads_reset_date: null,
    }
  }

  // Fetch users with current filters
  async function fetchUsers(params?: GetUsersParams): Promise<GetUsersResponse> {
    try {
      isLoading.value = true
      error.value = null
      store.setLoading(true)

      const page = params?.page ?? store.state.currentPage
      const limit = params?.limit ?? store.state.itemsPerPage
      const search = params?.search ?? store.state.searchQuery
      const role = params?.role ?? store.state.roleFilter ?? undefined
      const status = params?.status ?? store.state.statusFilter

      const query: {
        limit: number
        offset: number
        searchField?: 'email'
        searchOperator?: 'contains'
        searchValue?: string
        filterField?: string
        filterOperator?: 'eq'
        filterValue?: string | boolean
      } = {
        limit,
        offset: (page - 1) * limit,
      }

      if (search) {
        query.searchField = 'email'
        query.searchOperator = 'contains'
        query.searchValue = search
      }

      // listUsers accepts a single filter field. Role filter takes precedence;
      // status (active/inactive) maps to the banned flag only when no role filter set.
      if (role) {
        query.filterField = 'role'
        query.filterOperator = 'eq'
        query.filterValue = role
      } else if (status && status !== 'all') {
        query.filterField = 'banned'
        query.filterOperator = 'eq'
        query.filterValue = status === 'inactive'
      }

      const { data, error: apiError } = await authClient.admin.listUsers({ query })
      if (apiError) {
        throw new Error(apiError.message || 'Failed to fetch users')
      }

      const users = (data?.users ?? []).map(toUserProfile)
      const total = data?.total ?? 0

      // Update store with new data
      store.setUsers(users)
      store.setTotalUsers(total)
      store.setCurrentPage(page)

      return { users, total, page, limit, hasMore: total > page * limit }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch users'
      error.value = errorMessage
      store.setError(errorMessage)
      throw err
    } finally {
      isLoading.value = false
      store.setLoading(false)
    }
  }

  // Update user role
  async function updateUserRole(userId: string, role: 'user' | 'admin'): Promise<void> {
    try {
      isLoading.value = true
      error.value = null

      const { error: apiError } = await authClient.admin.setRole({ userId, role })
      if (apiError) {
        throw new Error(apiError.message || 'Failed to update user role')
      }

      // Update local store
      store.updateUser(userId, { role, updated_at: new Date().toISOString() })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update user role'
      error.value = errorMessage
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Toggle user active status via better-auth ban/unban
  async function toggleUserStatus(userId: string, isActive: boolean): Promise<void> {
    try {
      isLoading.value = true
      error.value = null

      const { error: apiError } = isActive
        ? await authClient.admin.unbanUser({ userId })
        : await authClient.admin.banUser({ userId })
      if (apiError) {
        throw new Error(apiError.message || 'Failed to toggle user status')
      }

      // Update local store
      store.updateUser(userId, { banned: !isActive, updated_at: new Date().toISOString() })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to toggle user status'
      error.value = errorMessage
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Delete user account
  async function deleteUser(userId: string): Promise<void> {
    try {
      isLoading.value = true
      error.value = null

      const { error: apiError } = await authClient.admin.removeUser({ userId })
      if (apiError) {
        throw new Error(apiError.message || 'Failed to delete user')
      }

      // Remove from local store
      store.removeUser(userId)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete user'
      error.value = errorMessage
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // chunk 4: Stripe subscription fields — not managed by better-auth, needs a custom route.
  async function updateUserSubscription(
    _userId: string,
    _updates: { subscription_status?: string; plan_expires_at?: string }
  ): Promise<void> {
    throw new Error(CHUNK_4_NOT_PORTED)
  }

  // chunk 4: upload-limit accounting — not managed by better-auth, needs a custom route.
  async function updateUserUploads(
    _userId: string,
    _updates: { total_uploads?: number; uploads_this_month?: number; uploads_reset_date?: string }
  ): Promise<void> {
    throw new Error(CHUNK_4_NOT_PORTED)
  }

  // chunk 4: user activity analytics — not managed by better-auth, needs a custom route.
  async function getUserActivity(_userId: string): Promise<UserActivity> {
    throw new Error(CHUNK_4_NOT_PORTED)
  }

  // Export users to CSV
  async function exportUsers(): Promise<void> {
    try {
      // Get all users (no pagination)
      const allUsers = await fetchUsers({ limit: 1000 })

      // Create CSV content
      const headers = ['ID', 'Email', 'Role', 'Subscription Status', 'Plan Expires', 'Total Uploads', 'Uploads This Month', 'Uploads Reset Date', 'Created At', 'Last Updated']
      const csvContent = [
        headers.join(','),
        ...allUsers.users.map(user => [
          user.id,
          user.email || '',
          user.role,
          user.subscription_status || '',
          user.plan_expires_at || '',
          user.total_uploads || 0,
          user.uploads_this_month || 0,
          user.uploads_reset_date || '',
          user.created_at,
          user.updated_at || ''
        ].join(','))
      ].join('\\n')

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `users-export-${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export users'
      error.value = errorMessage
      throw err
    }
  }

  // Search users with debounce
  async function searchUsers(query: string): Promise<void> {
    store.setSearchQuery(query)
    return fetchUsers()
  }

  // Filter by role
  async function filterByRole(role: string | null): Promise<void> {
    store.setRoleFilter(role)
    return fetchUsers()
  }

  // Change page
  async function changePage(page: number): Promise<void> {
    store.setCurrentPage(page)
    return fetchUsers()
  }

  // Refresh current page
  async function refresh(): Promise<void> {
    return fetchUsers()
  }

  return {
    // State
    isLoading,
    error,
    store,

    // Actions
    fetchUsers,
    updateUserRole,
    updateUserSubscription,
    updateUserUploads,
    toggleUserStatus,
    deleteUser,
    getUserActivity,
    exportUsers,
    searchUsers,
    filterByRole,
    changePage,
    refresh,
  }
}
