# Session Management & Multi-Seat Enterprise Implementation Plan

## Overview
Transform VoIP Accelerator from single-user to tiered subscription model with session management and Enterprise multi-seat functionality.

## New Pricing Structure
- **Starter**: $99/month, 100 uploads/month, 1 seat (strict session limit)
- **Professional**: $199/month, unlimited uploads, 1 seat (strict session limit)  
- **Enterprise**: $499/month, unlimited uploads, up to 10 seats (custom pricing for >10 seats)

---

## Phase 1: Database Schema Changes

### 1.1 Organizations Table
```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  subscription_status TEXT DEFAULT 'enterprise',
  stripe_customer_id TEXT,
  subscription_id TEXT,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  billing_email TEXT,
  plan_expires_at TIMESTAMP WITH TIME ZONE,
  seat_limit INTEGER DEFAULT 10, -- Up to 10 seats, custom pricing beyond
  admin_user_id UUID REFERENCES profiles(id) -- Organization admin
);
```

### 1.2 Update Profiles Table
```sql
-- Update existing role column to new 3-tier system
UPDATE profiles SET role = 'user' WHERE role NOT IN ('admin', 'super_admin');

-- Add new columns for subscription tiers and upload tracking
ALTER TABLE profiles ADD COLUMN 
  organization_id UUID REFERENCES organizations(id),
  subscription_tier TEXT DEFAULT 'starter', -- 'starter', 'professional', 'enterprise'
  uploads_this_month INTEGER DEFAULT 0,
  uploads_reset_date DATE DEFAULT CURRENT_DATE;

-- Role column now supports: 'user', 'admin', 'super_admin'
-- 'admin' = organization admin (when organization_id is set)
-- 'super_admin' = global admin (you only)
```

### 1.3 Active Sessions Table
```sql
CREATE TABLE active_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_heartbeat TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_agent TEXT,
  ip_address TEXT,
  browser_info JSONB
);

CREATE INDEX idx_active_sessions_user_id ON active_sessions(user_id);
CREATE INDEX idx_active_sessions_last_heartbeat ON active_sessions(last_heartbeat);
```

### 1.4 Organization Invitations Table
```sql
CREATE TABLE organization_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  invited_by UUID REFERENCES profiles(id),
  role TEXT DEFAULT 'member',
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '7 days',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  used_at TIMESTAMP WITH TIME ZONE NULL
);
```

---

## Phase 2: Backend Implementation

### 2.1 Session Management Edge Functions

#### Create Session Management Function
- [ ] `supabase/functions/manage-session/index.ts`
  - Validate single session per user for Starter/Pro
  - Allow unlimited sessions for Enterprise users
  - Implement session heartbeat system
  - Real-time session termination

#### Upload Tracking Function
- [ ] `supabase/functions/track-upload/index.ts`
  - Increment upload counter per user
  - Reset monthly counters
  - Validate upload limits by tier
  - Return remaining uploads

#### Organization Management Functions
- [ ] `supabase/functions/create-organization/index.ts`
- [ ] `supabase/functions/invite-user/index.ts`
  - **Seat enforcement**: Block new invites when seat_limit reached
  - Return clear error: "Organization has reached its 10 seat limit. Contact sales for additional seats."
  - Admin can see seat usage: "7/10 seats used"
- [ ] `supabase/functions/accept-invitation/index.ts`
  - Double-check seat availability before acceptance
  - Prevent race conditions with concurrent invitations
- [ ] `supabase/functions/manage-organization-members/index.ts`
  - Show seat usage prominently
  - Provide "Request More Seats" button linking to sales

### 2.2 Database Triggers

#### Monthly Upload Reset Trigger (UTC-Based)
```sql
CREATE OR REPLACE FUNCTION reset_monthly_uploads()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Reset based on UTC midnight on the first of each month
  -- This ensures consistent behavior across all time zones
  UPDATE profiles 
  SET uploads_this_month = 0,
      uploads_reset_date = DATE_TRUNC('month', CURRENT_DATE AT TIME ZONE 'UTC')
  WHERE uploads_reset_date < DATE_TRUNC('month', CURRENT_DATE AT TIME ZONE 'UTC');
END;
$$;

-- Schedule to run daily at UTC midnight
-- Will only actually reset on the first of each month
SELECT cron.schedule('reset-uploads', '0 0 * * *', 'SELECT reset_monthly_uploads();', 'UTC');
```

#### Session Cleanup Trigger
```sql
-- Clean up stale sessions (no heartbeat for 5+ minutes)
CREATE OR REPLACE FUNCTION cleanup_stale_sessions()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM active_sessions 
  WHERE last_heartbeat < NOW() - INTERVAL '5 minutes';
END;
$$;

SELECT cron.schedule('cleanup-sessions', '*/5 * * * *', 'SELECT cleanup_stale_sessions();');
```

### 2.3 Row Level Security (RLS) Policies

#### Profiles RLS Updates
```sql
-- Users can see organization members
ALTER POLICY profiles_select_policy ON profiles
USING (
  id = auth.uid() OR 
  organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  )
);
```

#### Organizations RLS
```sql
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY org_members_can_view ON organizations
FOR SELECT USING (
  id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
);
```

---

## Phase 3: Frontend Implementation

### 3.1 New Composables

#### Session Management Composable
- [ ] `client/src/composables/useSessionManagement.ts`
  - Handle session validation
  - Implement heartbeat system
  - Show session conflict warnings
  - Force logout functionality

#### Upload Tracking Composable  
- [ ] `client/src/composables/useUploadTracking.ts`
  - Track uploads per user
  - Validate against tier limits
  - Show upload counter/progress
  - Upgrade prompts

#### Organization Management Composable
- [ ] `client/src/composables/useOrganizationManagement.ts`
  - Create/manage organizations
  - Send invitations
  - Accept invitations
  - Member management

### 3.2 New Components

#### Session Warning Modal
- [ ] `client/src/components/auth/SessionWarningModal.vue`
  - Show active session details
  - Allow user to continue or cancel
  - Clean, professional design

#### Upload Counter Component
- [ ] `client/src/components/shared/UploadCounter.vue`
  - Show remaining uploads for Starter tier
  - Progress bar visualization
  - Upgrade CTA when approaching limits

#### Organization Dashboard
- [ ] `client/src/components/enterprise/OrganizationDashboard.vue`
  - Member management interface
  - Send invitations
  - View organization usage
  - Billing management

#### Invitation Acceptance Page
- [ ] `client/src/pages/AcceptInvitation.vue`
  - Accept organization invitations
  - Create account if needed
  - Join existing organization

### 3.3 Updated Components

#### Login/Signup Flow Updates
- [ ] Update login to check for active sessions
- [ ] Show session warning before login
- [ ] Handle organization invitations during signup

#### Dashboard Updates
- [ ] Add upload counter for Starter users
- [ ] Show organization info for Enterprise users
- [ ] Display tier-specific features

#### Profile Management Updates
- [ ] Show current subscription tier
- [ ] Display organization membership
- [ ] Upload usage statistics

---

## Phase 4: Billing Integration

### 4.1 Stripe Product Updates
- [ ] Create new Stripe products for 3-tier system
- [ ] Update pricing in Stripe dashboard
- [ ] Configure webhook handling for new tiers

### 4.2 Subscription Management Updates
- [ ] Handle organization-level subscriptions
- [ ] Update billing portal for Enterprise admins
- [ ] Implement usage-based billing alerts

---

## Phase 5: Migration Strategy

### 5.1 Existing User Migration
- [ ] Create migration script for existing users
- [ ] Assign appropriate tiers based on usage history
- [ ] Preserve existing subscription data
- [ ] Email existing users about changes

### 5.2 Data Migration
- [ ] Run database migrations in staging
- [ ] Test all new functionality
- [ ] Create rollback procedures
- [ ] Production deployment plan

---

## Phase 6: Testing & Deployment

### 6.1 Staging Testing
- [ ] Test session management with multiple devices
- [ ] Validate upload counting and limits
- [ ] Test organization creation and invitations
- [ ] Verify billing integration

### 6.2 Production Deployment
- [ ] Deploy database changes
- [ ] Deploy edge functions
- [ ] Deploy frontend updates
- [ ] Monitor for issues

---

## Implementation Priority

1. **Phase 1 & 2**: Database schema and session management (Week 1-2)
2. **Phase 3**: Frontend session management and upload tracking (Week 3)
3. **Phase 4**: Organization management features (Week 4)
4. **Phase 5**: Billing and migration (Week 5)
5. **Phase 6**: Testing and deployment (Week 6)

## Resolved Requirements

1. **User Roles**: 3 types project-wide
   - **Users**: Standard tier access (starter/professional)
   - **Admins**: Organization admins, can manage their org's users via special admin route
   - **Super Admin**: You only, manages all users globally via existing admin route

2. **Data Sharing**: None needed - all data is browser-local/client-side only

3. **Billing**: Organization-level billing
   - One bill per organization, one admin contact
   - Up to 10 seats per org (custom pricing beyond 10)
   - Admin manages seat allocation

4. **Admin Routes**: 
   - Organization admins get special admin route for user management
   - Super admin keeps existing global admin route

## Critical Refinements Before Building

### Time Zone & Reset Handling
- **Upload resets**: Always use UTC for consistency across all users
- **Display to users**: "Uploads reset on the 1st of each month (UTC)"
- **Frontend display**: Show next reset date/time in user's local timezone
- **Prevent confusion**: Clear UI showing "87/100 uploads used (resets in 5 days)"

### Enterprise Seat Enforcement Strategy
- **Hard block at limit**: Prevent new invites once seat_limit is reached
- **Clear messaging**: "Your organization has reached its 10 seat limit. Contact sales@voipaccelerator.com for additional seats."
- **Admin visibility**: Always show "7/10 seats used" in admin dashboard
- **No overage billing**: Block at limit rather than auto-charging for overages
- **Upgrade path**: "Request More Seats" button that emails sales team

### Pricing Validation
- **Consider bigger gap**: $99 → $249 → $499 for stronger upsell pressure
- **Anti-abuse mechanism**: Rate limiting on "unlimited uploads" (e.g., max 1000/day to prevent storage abuse)
- **Enterprise seat limits**: Up to 10 seats included, custom pricing beyond that

### Migration Strategy (Do First!)
- **Mock migration scripts locally** before any edge functions
- **Add all new columns nullable with defaults**, then backfill, then enforce NOT NULL
- **Test profile table changes** thoroughly in staging before production

### Session Enforcement Edge Cases
- **Laptop closure scenario**: Heartbeat kills session in 5 minutes, UI must handle "session ended remotely" gracefully
- **Network issues**: Grace period before session termination (30-60 seconds)
- **Browser crashes**: Clean session recovery on restart

### Stripe Configuration
- **Lock in Stripe Price IDs now** and store in environment config
- **Prevent pricing mismatches** across staging/production environments  
- **Enterprise billing**: Handle seat count changes via Stripe usage-based billing or flat per-seat rate

### Frontend Implementation Priority
1. **Upload limit indicator** (most visible to Starter users)
   - Show "X/100 uploads used this month"
   - Reset date clearly shown in UTC
2. **Session conflict modal** (immediate revenue protection)
3. **Organization admin dashboard** (Enterprise feature)
   - Display seat usage: "7/10 seats used"
   - Block invites at limit with clear messaging
4. **Full org management** (can be last)

---

**Estimated Timeline**: 6 weeks for full implementation
**Key Risk**: User migration and billing transition
**Success Metrics**: Session conflicts eliminated, upload limits respected, Enterprise adoption