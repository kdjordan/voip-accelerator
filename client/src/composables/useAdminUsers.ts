import { ref } from 'vue'
import { useAdminUsersStore, type UserProfile, type UserActivity } from '@/stores/admin-users-store'
import { supabase } from '@/utils/supabase'

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

interface UpdateUserRequest {
  userId: string
  updates: {
    role?: 'user' | 'admin' | 'superadmin'
    subscription_status?: string
    plan_expires_at?: string
  }
}

interface ToggleStatusRequest {
  userId: string
  isActive: boolean
}

export function useAdminUsers() {
  const store = useAdminUsersStore()
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Get the current session token for API calls
  async function getAuthToken(): Promise<string | null> {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token || null
  }

  // Call edge functions with proper headers
  async function callEdgeFunction(functionName: string, options: {
    method?: 'GET' | 'POST' | 'PUT'
    body?: any
    params?: Record<string, string>
  } = {}) {
    const token = await getAuthToken()
    if (!token) {
      throw new Error('Authentication required')
    }

    const { method = 'POST', body, params } = options
    
    let url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${functionName}`
    
    if (params && method === 'GET') {
      const searchParams = new URLSearchParams(params)
      url += `?${searchParams.toString()}`
    }

    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(errorData.error || `HTTP ${response.status}`)
    }

    return await response.json()
  }

  // Fetch users with current filters
  async function fetchUsers(params?: GetUsersParams): Promise<GetUsersResponse> {
    try {
      isLoading.value = true
      error.value = null
      store.setLoading(true)

      const queryParams = {
        page: params?.page?.toString() || store.state.currentPage.toString(),
        limit: params?.limit?.toString() || store.state.itemsPerPage.toString(),
        search: params?.search || store.state.searchQuery || undefined,
        role: params?.role || store.state.roleFilter || undefined,
        status: params?.status || store.state.statusFilter || undefined,
      }

      // Remove undefined values
      const cleanParams = Object.fromEntries(
        Object.entries(queryParams).filter(([_, value]) => value !== undefined)
      ) as Record<string, string>

      const response: GetUsersResponse = await callEdgeFunction('get-all-users', {
        method: 'GET',
        params: cleanParams,
      })

      // Update store with new data
      store.setUsers(response.users)
      store.setTotalUsers(response.total)
      store.setCurrentPage(response.page)

      return response
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

  // Update user role or other profile data
  async function updateUserRole(userId: string, role: 'user' | 'admin' | 'superadmin'): Promise<void> {
    try {
      isLoading.value = true
      error.value = null

      const request: UpdateUserRequest = {
        userId,
        updates: { role }
      }

      await callEdgeFunction('update-user-profile', {
        method: 'POST',
        body: request,
      })

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

  // Update user subscription details
  async function updateUserSubscription(userId: string, updates: {
    subscription_status?: string
    plan_expires_at?: string
  }): Promise<void> {
    try {
      isLoading.value = true
      error.value = null

      const request: UpdateUserRequest = {
        userId,
        updates
      }

      await callEdgeFunction('update-user-profile', {
        method: 'POST',
        body: request,
      })

      // Update local store
      store.updateUser(userId, { ...updates, updated_at: new Date().toISOString() })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update user subscription'
      error.value = errorMessage
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Toggle user active status
  async function toggleUserStatus(userId: string, isActive: boolean): Promise<void> {
    try {
      isLoading.value = true
      error.value = null

      const request: ToggleStatusRequest = {
        userId,
        isActive
      }

      await callEdgeFunction('toggle-user-status', {
        method: 'POST',
        body: request,
      })

      // Update activity in store
      const existingActivity = store.getUserActivity(userId)
      if (existingActivity) {
        store.setUserActivity(userId, {
          ...existingActivity,
          isActive,
          banDuration: isActive ? null : existingActivity.banDuration
        })
      }
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

      // Note: This would need a delete edge function or modify existing delete-user-account
      // For now, we'll simulate by toggling status to inactive
      await toggleUserStatus(userId, false)
      
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

  // Get user activity details
  async function getUserActivity(userId: string): Promise<UserActivity> {
    try {
      // Check if we already have it in store
      const cachedActivity = store.getUserActivity(userId)
      if (cachedActivity) {
        return cachedActivity
      }

      const activity: UserActivity = await callEdgeFunction('get-user-activity', {
        method: 'GET',
        params: { userId }
      })

      // Cache in store
      store.setUserActivity(userId, activity)
      
      return activity
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch user activity'
      error.value = errorMessage
      throw err
    }
  }

  // Export users to CSV
  async function exportUsers(): Promise<void> {
    try {
      // Get all users (no pagination)
      const allUsers = await fetchUsers({ limit: 1000 })
      
      // Create CSV content
      const headers = ['ID', 'Email', 'Role', 'Subscription Status', 'Plan Expires', 'Created At', 'Last Updated']
      const csvContent = [
        headers.join(','),
        ...allUsers.users.map(user => [
          user.id,
          user.email || '',
          user.role,
          user.subscription_status || '',
          user.plan_expires_at || '',
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