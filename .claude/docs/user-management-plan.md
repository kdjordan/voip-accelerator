# User Management Feature Plan

## Overview
Enhance AdminView.vue with a comprehensive user management system that allows administrators to view, manage, and update user profiles stored in Supabase.

## Current State Analysis

### Authentication System
- **Framework**: Supabase Auth with email/password and Google OAuth
- **User Store**: `/src/stores/user-store.ts` manages authentication state
- **Roles**: 'user', 'admin', 'superadmin' (stored in profiles table)
- **Route Protection**: Admin routes protected via router middleware

### Existing Infrastructure
- **Edge Functions Pattern**: Established pattern with CORS handling and JWT verification
- **Delete Function**: `delete-user-account` edge function already exists
- **Admin Dashboard**: Currently focused on NANP/LERG management

### Database Schema
```sql
-- Current profiles table structure (verified from staging project: odnwqnmgftgjrdkotlro)
profiles (
  id: uuid (references auth.users) -- PRIMARY KEY
  created_at: timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
  updated_at: timestamp with time zone
  role: text NOT NULL DEFAULT 'user' -- 'user', 'admin', 'superadmin'
  plan_expires_at: timestamp with time zone DEFAULT '2025-06-01 23:59:59+00'::timestamp with time zone
  user_agent: text -- User agent string captured during signup
  signup_method: text -- Method used for signup, e.g., 'email', 'google'
  stripe_customer_id: text -- Stripe customer ID for subscription billing
  subscription_status: text -- Current status: trial, monthly, annual
)

-- Additional table: enhanced_lerg (450 records)
enhanced_lerg (
  npa: varchar(3) NOT NULL -- PRIMARY KEY, North American Numbering Plan area code
  country_code: varchar(2) NOT NULL -- 2-letter country code
  country_name: varchar NOT NULL
  state_province_code: varchar(2) NOT NULL -- 2-letter state/province code
  state_province_name: varchar NOT NULL
  region: varchar
  category: varchar NOT NULL -- 'us-domestic', 'canadian', 'caribbean', 'pacific'
  source: varchar DEFAULT 'lerg' -- 'lerg', 'manual', 'import', 'seed', 'consolidated'
  confidence_score: numeric DEFAULT 1.00 -- Data quality indicator (0-1)
  created_at: timestamp with time zone DEFAULT CURRENT_TIMESTAMP
  updated_at: timestamp with time zone DEFAULT CURRENT_TIMESTAMP
  notes: text
  is_active: boolean DEFAULT true
)
```

## Implementation Plan

### Phase 1: Edge Functions Development

#### 1.1 `get-all-users` Edge Function
**Purpose**: Fetch all users with pagination and filtering
**Parameters**:
- `page`: number (default: 1)
- `limit`: number (default: 20, max: 100)
- `search`: string (optional - search by email/name)
- `role`: string (optional - filter by role)
- `status`: string (optional - active/inactive)

**Response**:
```typescript
{
  users: Profile[],
  total: number,
  page: number,
  limit: number,
  hasMore: boolean
}
```

#### 1.2 `update-user-profile` Edge Function
**Purpose**: Update user profile information
**Parameters**:
- `userId`: string (UUID)
- `updates`: {
    role?: 'user' | 'admin' | 'superadmin',
    full_name?: string,
    company_name?: string,
    is_active?: boolean
  }

**Security**: 
- Verify admin role
- Prevent self-role modification
- Log changes for audit trail

#### 1.3 `toggle-user-status` Edge Function
**Purpose**: Activate or deactivate user accounts
**Parameters**:
- `userId`: string (UUID)
- `isActive`: boolean

#### 1.4 `get-user-activity` Edge Function
**Purpose**: Get detailed user activity and statistics
**Parameters**:
- `userId`: string (UUID)

**Response**:
```typescript
{
  lastLogin: timestamp,
  totalLogins: number,
  createdAt: timestamp,
  rateSheetUploads: number,
  lastActivity: timestamp
}
```

### Phase 2: Frontend Components

#### 2.1 User Management Component Structure
```
/src/components/admin/
├── UserManagement.vue          # Main container
├── UserTable.vue              # User list table
├── UserDetailsModal.vue       # User details/edit modal
├── UserRoleSelector.vue       # Role management dropdown
└── UserStatusToggle.vue       # Active/inactive toggle
```

#### 2.2 Features to Implement
1. **User List Table**
   - Sortable columns: Email, Name, Company, Role, Status, Last Login
   - Search/filter functionality
   - Pagination controls
   - Bulk selection for actions

2. **User Actions**
   - Edit user details (modal)
   - Change role (with confirmation)
   - Toggle active status
   - Delete user (with confirmation)
   - Export user list (CSV)

3. **User Details Modal**
   - View complete profile
   - Edit allowed fields
   - Activity history
   - Associated data (rate sheets, etc.)

### Phase 3: State Management

#### 3.1 Admin Users Store
Create `/src/stores/admin-users-store.ts`:
```typescript
interface AdminUsersState {
  users: Profile[]
  totalUsers: number
  currentPage: number
  itemsPerPage: number
  searchQuery: string
  roleFilter: string | null
  statusFilter: 'all' | 'active' | 'inactive'
  isLoading: boolean
  error: string | null
  selectedUsers: Set<string>
}
```

#### 3.2 Composables
Create `/src/composables/useAdminUsers.ts`:
- `fetchUsers()` - Load users with current filters
- `updateUserRole()` - Change user role
- `toggleUserStatus()` - Activate/deactivate user
- `deleteUser()` - Remove user account
- `exportUsers()` - Export to CSV

### Phase 4: UI/UX Design

#### 4.1 Layout Integration
- Add "User Management" tab to AdminView.vue
- Position after NANP Management section
- Use consistent styling with existing admin sections

#### 4.2 Component Design
- Follow existing TailwindCSS patterns
- Use Heroicons for consistency
- Implement loading states and error handling
- Add success/error notifications

### Phase 5: Security & Performance

#### 5.1 Security Measures
1. **Role Verification**: All edge functions verify admin role
2. **Self-Modification Prevention**: Admins cannot modify their own role
3. **Audit Logging**: Track all admin actions
4. **Rate Limiting**: Prevent API abuse
5. **Input Validation**: Sanitize all user inputs

#### 5.2 Performance Optimization
1. **Pagination**: Load users in chunks
2. **Debounced Search**: Prevent excessive API calls
3. **Caching**: Store user list in Pinia store
4. **Lazy Loading**: Load user details on demand

### Phase 6: Testing Requirements

#### 6.1 Edge Function Tests
- Authentication verification
- Role-based access control
- Data validation
- Error handling

#### 6.2 Frontend Tests
- Component rendering
- User interactions
- API integration
- Error states

## Questions for Clarification

1. **Additional User Fields**: Are there any other user profile fields we should display or allow editing?

2. **Audit Log**: Should we create a dedicated audit log table to track all admin actions on user accounts?

3. **Email Notifications**: Should users receive email notifications when their account is modified by an admin?

4. **Bulk Operations**: Do you need bulk operations (e.g., bulk role change, bulk delete)?

5. **User Analytics**: Should we include user activity metrics (login frequency, feature usage)?

6. **Export Format**: Besides CSV, do you need other export formats (Excel, JSON)?

7. **Role Permissions**: Are there specific permissions differences between 'admin' and 'superadmin' roles?

8. **Subscription Management**: Should admins be able to modify user subscription status and plan expiration?

## Next Steps

Upon your approval and answers to the clarification questions, I will:

1. Create the edge functions with proper security and error handling
2. Implement the frontend components following the existing design patterns
3. Add the state management layer
4. Integrate everything into AdminView.vue
5. Add comprehensive error handling and user feedback
6. Create basic tests for critical functionality

The implementation will follow the existing codebase patterns and maintain consistency with the current admin dashboard design.