# Subscription Simplification Migration Plan

**Date:** 2025-09-30
**Objective:** Simplify from 3-tier subscription system (Optimizer/Accelerator/Enterprise) to single-plan model with monthly/annual billing options

## Business Requirements Summary

### Current System (TO BE REMOVED)
- **Optimizer**: $99/mo, 100 uploads/month, 1 user
- **Accelerator**: $249/mo, unlimited uploads, 1 user
- **Enterprise**: $499/mo, unlimited uploads, 5 users (multi-seat organization support)

### New Simplified System
- **Accelerator Plan - Monthly**: $99/month, unlimited uploads, 1 concurrent session
- **Accelerator Plan - Annual**: $999/year, unlimited uploads, 1 concurrent session
- **Trial**: 7 days free (1 week unlimited access)
- **Session Enforcement**: Only one active login at a time (existing functionality, keep)
- **Upload Tracking**: Simple total_uploads counter in profiles (admin-only visibility for marketing analytics)

## Architecture Impact Analysis

### 🎯 Core Principles
1. Remove all tier-based logic and upload limits
2. Keep session management for single-login enforcement
3. Simplify role system: Remove `super_admin`, keep only `user` and `admin`
4. Track total uploads per user (admin-only analytics, hidden from users)

---

## Work Division Strategy

### Agent #1: Backend & Infrastructure
**Focus:** Database schema, edge functions, Stripe integration, server-side logic

### Agent #2: Frontend & User Interface
**Focus:** UI components, client stores, types, user-facing logic

---

## Agent #1: Backend & Infrastructure Tasks

### Phase 1: Database Schema Migration

#### 1.1 Create New Migration File
**File:** `supabase/migrations/YYYYMMDDHHMMSS_simplify_subscription_system.sql`

**Actions:**
- [ ] Drop `subscription_tier` column from `profiles` (replace with billing_period)
- [ ] Add `billing_period` column: `'monthly' | 'annual' | null`
- [ ] Add/Keep `total_uploads` column: `INTEGER DEFAULT 0` (for marketing analytics)
- [ ] Drop `organizations` table entirely
- [ ] Drop `organization_invitations` table entirely
- [ ] Drop `organization_id` column from `profiles`
- [ ] Remove `uploads_this_month` and `uploads_reset_date` (no monthly tracking)
- [ ] Remove `selected_tier` and `trial_tier` columns
- [ ] Update `role` column constraint: Remove `'super_admin'`, keep only `'user' | 'admin'`
- [ ] Update `subscription_status` to only support: `'trial' | 'active' | 'past_due' | 'cancelled' | 'incomplete'`
- [ ] Keep session management tables (`active_sessions`) - needed for single-login enforcement
- [ ] Update all CHECK constraints to remove tier validations
- [ ] Migrate existing users:
  - All paid users → `billing_period: 'monthly'`, `subscription_status: 'active'`
  - Trial users → `billing_period: null`, `subscription_status: 'trial'`
  - All `super_admin` → `admin`

#### 1.2 Update Database Functions
**Files to modify:**
- `supabase/migrations/20250811_three_tier_system.sql` functions

**Actions:**
- [ ] Drop `check_upload_limit()` function (no more limits)
- [ ] SIMPLIFY `increment_upload_count()` function → just increment `total_uploads`, remove all limit checking
- [ ] Drop `get_upload_statistics()` function (no monthly stats)
- [ ] Drop `reset_monthly_uploads()` function (no monthly tracking)
- [ ] Update `validate_user_session()` to remove Enterprise multi-session logic
- [ ] Simplify session validation: all users get single-session enforcement

#### 1.3 Simplify Upload Tracking
**Tables to drop:**
- [ ] Drop `upload_history` table (too excessive, use simple counter instead)

**Keep simplified:**
- [ ] `total_uploads` column in `profiles` table
- [ ] Simplified `increment_upload_count()` function (just increment counter)
- [ ] `track-upload` edge function (simplified to just increment)

---

### Phase 2: Stripe Integration Updates

#### 2.1 Create New Stripe Products
**Actions:**
- [ ] Create Stripe product: "Accelerator Plan - Monthly" at $99/month
- [ ] Create Stripe product: "Accelerator Plan - Annual" at $999/year
- [ ] Note price IDs for both products
- [ ] Archive old products (don't delete - preserve historical data):
  - Optimizer ($99/mo)
  - Old Accelerator ($249/mo)
  - Enterprise ($499/mo)

#### 2.2 Update Edge Functions

**File:** `supabase/functions/stripe-events/index.ts`
**Actions:**
- [ ] Remove tier determination logic (lines 89-103)
- [ ] Replace with billing period detection:
  ```typescript
  let billingPeriod = 'monthly';
  if (amountTotal === 9900) billingPeriod = 'monthly';   // $99
  if (amountTotal === 99900) billingPeriod = 'annual';   // $999
  ```
- [ ] Update `handleCheckoutCompleted()`:
  - Remove `subscription_tier` field
  - Add `billing_period` field
  - Remove upload reset logic (no limits)
- [ ] Update `handleSubscriptionUpdated()`:
  - Remove tier change detection
  - Add billing period change detection (upgrade/downgrade between monthly/annual)
- [ ] Update `handleSubscriptionDeleted()`:
  - Remove `subscription_tier: 'trial'` fallback
  - Set `billing_period: null` on cancellation
  - Remove upload reset

**File:** `supabase/functions/create-checkout-session/index.ts`
**Actions:**
- [ ] Read and update to only accept monthly/annual price IDs
- [ ] Remove tier parameter from request body
- [ ] Add billing_period parameter

**File:** `supabase/functions/upgrade-subscription/index.ts`
**Actions:**
- [ ] Simplify to only handle monthly ↔ annual switches
- [ ] Remove tier upgrade logic
- [ ] Update to use billing_period instead of tier

**Files to SIMPLIFY (remove limit logic, keep increment):**
- [ ] `supabase/functions/track-upload/index.ts` - Keep but simplify to just increment `total_uploads`

**Files to DELETE (no longer needed):**
- [ ] `supabase/functions/set-trial-tier/index.ts` (no tier selection)
- [ ] `supabase/functions/create-organization/index.ts`
- [ ] `supabase/functions/invite-user/index.ts`
- [ ] `supabase/functions/accept-invitation/index.ts`
- [ ] `supabase/functions/manage-organization-members/index.ts`
- [ ] `supabase/functions/apply-upload-tracking-migration/index.ts`

---

### Phase 3: Environment Configuration

#### 3.1 Update Environment Variables
**Files:** `.env.development`, `.env.staging`, `.env.production`

**Actions:**
- [ ] Add new Stripe price IDs:
  ```
  VITE_STRIPE_PRICE_MONTHLY_ACCELERATOR=price_xxx
  VITE_STRIPE_PRICE_ANNUAL_ACCELERATOR=price_yyy
  ```
- [ ] Remove old price ID variables:
  - `VITE_STRIPE_PRICE_OPTIMIZER`
  - `VITE_STRIPE_PRICE_ACCELERATOR`
  - `VITE_STRIPE_PRICE_ENTERPRISE`
- [ ] Remove: `VITE_OPTIMIZER_UPLOAD_LIMIT` (no limits)

---

### Phase 4: Session Management Simplification

**File:** `supabase/functions/check-session/index.ts`
**File:** `supabase/functions/force-logout/index.ts`

**Actions:**
- [ ] Remove Enterprise exemption from session checks
- [ ] All users get single-session enforcement
- [ ] Keep existing heartbeat and cleanup logic

---

## Agent #2: Frontend & User Interface Tasks

### Phase 1: Type System Updates

#### 1.1 Update Core Types
**File:** `client/src/types/user-types.ts`

**Actions:**
- [ ] Remove `SubscriptionTier` type (`'accelerator' | 'optimizer' | 'enterprise'`)
- [ ] Add `BillingPeriod` type: `'monthly' | 'annual' | null`
- [ ] Update `PlanTierType` to only: `'trial' | 'active'`
- [ ] Remove tier-related constants:
  - `PlanTier.OPTIMIZER`
  - `PlanTier.ACCELERATOR`
  - `PlanTier.ENTERPRISE`
- [ ] Remove `TierOption` interface (no tier selection)
- [ ] Update `Profile` interface:
  - Remove `subscription_tier` field
  - Add `billing_period: BillingPeriod`
  - Remove `uploads_this_month`
  - Remove `uploads_reset_date`
  - Remove `organization_id`
  - Add/Keep `total_uploads: number` (for admin analytics)
  - Update `role` type: Remove `'super_admin'`, keep only `'user' | 'admin'`
- [ ] Remove `PlanFeatures` interface (all features same now)
- [ ] Remove `PlanLimits` interface (no limits)

---

### Phase 2: Pinia Store Updates

#### 2.1 User Store Simplification
**File:** `client/src/stores/user-store.ts`

**Actions:**
- [ ] Remove `getCurrentPlanTier` getter (lines 71-79)
- [ ] Remove `getSubscriptionTier` getter (lines 81-83)
- [ ] Remove `getTrialTier` getter (lines 85-91)
- [ ] Remove `getUploadUsage` getter (lines 93-102) - no limits
- [ ] Simplify `getServiceExpiryBanner`:
  - Remove upload limit checking (lines 182-199)
  - Keep trial expiry logic
  - Keep subscription expiry logic
  - Keep cancellation logic
- [ ] Remove `shouldRedirectToBilling` logic for tiers (lines 216-220)
- [ ] Update `signUp()` method:
  - Remove `selectedTier` parameter
  - Remove `isTrialSignup` parameter
  - All signups start as trial
- [ ] Remove tier setting logic from `initializeAuthListener` (lines 398-454)
- [ ] Add billing period tracking if needed

#### 2.2 Add Billing Period Helpers
**New getters to add:**
- [ ] `getBillingPeriod`: returns `'monthly' | 'annual' | null`
- [ ] `isAnnualBilling`: boolean computed from billing_period
- [ ] `getCurrentPrice`: returns $99 or $999 based on billing period

---

### Phase 3: Composable Updates

#### 3.1 Simplify Upload Tracking Composable
**File:** `client/src/composables/useUploadTracking.ts`

**Actions:**
- [ ] SIMPLIFY THIS FILE (remove all limit checking, keep only increment logic)
- [ ] Remove limit validation methods
- [ ] Keep simple `incrementUploadCount()` method
- [ ] Remove UI-related methods (no user display)
- [ ] Admin will access `total_uploads` directly from user profile data

#### 3.2 Simplify Billing Composable
**File:** `client/src/composables/useBilling.ts`

**Actions:**
- [ ] Read file and update to only handle monthly/annual selection
- [ ] Remove tier upgrade logic
- [ ] Simplify to billing period changes only

#### 3.3 Update Session Management
**File:** `client/src/composables/useSessionManagement.ts`

**Actions:**
- [ ] Keep as-is (single-session logic still needed)
- [ ] Remove any Enterprise-specific exemptions if present

---

### Phase 4: Component Updates

#### 4.1 Remove/Simplify Plan Selection Components

**File:** `client/src/components/billing/PlanSelectorModal.vue`
**Actions:**
- [ ] Complete rewrite: Show monthly vs annual toggle instead of 3 tiers
- [ ] Single plan card with billing period toggle
- [ ] Show $99/mo or $999/yr based on toggle
- [ ] Remove tier selection logic
- [ ] Keep trial messaging

**File:** `client/src/components/auth/TierSelectionStep.vue`
**Actions:**
- [ ] DELETE THIS FILE (no tier selection during signup)
- [ ] Remove from signup flow

**File:** `client/src/components/billing/PaymentModal.vue`
**Actions:**
- [ ] Update to pass billing_period instead of tier
- [ ] Remove tier references

**File:** `client/src/components/billing/UpgradeModal.vue`
**Actions:**
- [ ] Simplify to only show monthly → annual upgrade option
- [ ] Remove 3-tier comparison
- [ ] Focus on annual savings ($99×12=$1188 vs $999 = save $189/year)

**File:** `client/src/components/shared/PlanSelectionModal.vue`
**Actions:**
- [ ] Same as PlanSelectorModal - simplify to billing period selection

#### 4.2 Remove Upload Limit UI

**Files to DELETE:**
- [ ] `client/src/components/shared/UploadLimitBanner.vue`
- [ ] `client/src/components/shared/UploadLimitModal.vue`
- [ ] `client/src/composables/useGlobalUploadLimit.ts`

**Files to UPDATE (remove upload limit checks):**
- [ ] `client/src/components/az/AZFileUploads.vue`
- [ ] `client/src/components/us/USFileUploads.vue`
- [ ] `client/src/components/rate-gen/RateGenFileUploads.vue`

**Actions:**
- [ ] Remove upload limit checking before file upload
- [ ] Remove upload limit warnings/banners
- [ ] Remove upload count displays

#### 4.3 Update Billing/Profile Pages

**File:** `client/src/pages/BillingPage.vue`
**Actions:**
- [ ] Remove tier display
- [ ] Show billing period (Monthly/Annual)
- [ ] Show plan name: "Accelerator Plan"
- [ ] Remove upload usage display (hidden from users)
- [ ] Keep subscription status, renewal date, cancellation options

**File:** `client/src/components/profile/SubscriptionManagement.vue`
**Actions:**
- [ ] Remove tier information
- [ ] Add billing period display
- [ ] Simplify to show: Monthly or Annual
- [ ] Keep cancel/reactivate functionality

**File:** `client/src/components/billing/SubscriptionCard.vue`
**Actions:**
- [ ] Update to show billing period instead of tier
- [ ] Remove upload limit display

#### 4.4 Update Marketing/Home Pages

**File:** `client/src/components/home/PricingSection.vue`
**Actions:**
- [ ] Already has monthly/annual toggle - keep structure
- [ ] Update pricing:
  - Monthly: $99/month
  - Annual: $999/year (show savings: "Save $189/year!")
- [ ] Update features list (same for both):
  - Unlimited uploads
  - Unlimited rate sheet comparisons
  - Single user access
  - 7-day free trial
- [ ] Remove tier comparison

**File:** `client/src/pages/HomeView.vue`
**Actions:**
- [ ] Update any pricing references
- [ ] Ensure consistent messaging

#### 4.5 Remove Enterprise Features

**File:** `client/src/pages/EnterpriseView.vue`
**Actions:**
- [ ] DELETE THIS FILE (no enterprise tier)

**File:** `client/src/components/admin/UserManagement.vue`
**Actions:**
- [ ] Remove tier assignment functionality
- [ ] Remove organization management
- [ ] Remove `super_admin` role references
- [ ] Update role dropdown to only `'user' | 'admin'`
- [ ] Add `total_uploads` display column (admin analytics)
- [ ] Keep basic user admin functionality

---

### Phase 5: Router & Navigation Updates

**File:** `client/src/router/index.ts`
**Actions:**
- [ ] Remove enterprise route
- [ ] Remove tier-based route guards
- [ ] Simplify to trial vs active subscription checks

**File:** `client/src/router/admin-routes.ts`
**Actions:**
- [ ] Remove enterprise/organization management routes

**File:** `client/src/constants/navigation.ts`
**Actions:**
- [ ] Remove enterprise nav items
- [ ] Update billing/pricing links

**File:** `client/src/components/shared/SideNav.vue`
**Actions:**
- [ ] Remove enterprise menu items
- [ ] Remove tier badges/indicators

---

### Phase 6: Service Layer Updates

**File:** `client/src/services/stripe.service.ts`
**Actions:**
- [ ] Update `createCheckoutSession()` to use billing_period instead of tier
- [ ] Update `upgradeSubscription()` to handle monthly ↔ annual only
- [ ] Remove tier-specific logic

---

### Phase 7: Test Updates

#### 7.1 Update Test Helpers
**File:** `client/tests/utils/test-helpers.ts`

**Actions:**
- [ ] Remove tier-related mock data
- [ ] Add billing_period to mock profiles
- [ ] Remove upload limit test data

#### 7.2 Update Integration Tests

**File:** `client/tests/integration/stripe-webhook.test.ts`
**Actions:**
- [ ] Update tier determination tests
- [ ] Test monthly vs annual webhook handling
- [ ] Remove optimizer/enterprise test cases
- [ ] Update to test billing_period assignment

**File:** `client/tests/integration/paid-signup-flow.test.ts`
**Actions:**
- [ ] Remove tier selection tests
- [ ] Update to test billing period selection
- [ ] Simplify flow (no tier step)

**File:** `client/tests/integration/stripe-cancellation.test.ts`
**Actions:**
- [ ] Update to test billing_period handling
- [ ] Remove tier-specific cancellation tests

---

### Phase 8: Documentation Updates

**File:** `.claude/CLAUDE.md`
**Actions:**
- [ ] Update subscription system description
- [ ] Remove references to 3-tier system
- [ ] Update to reflect simplified billing
- [ ] Remove upload limit documentation
- [ ] Update testing documentation for new structure

**Files to DELETE:**
- [ ] `.claude/docs/PRICING_TIERS_IMPLEMENTATION.md`
- [ ] Any other tier-specific documentation

---

## Testing Checklist

### Backend Testing (Agent #1)
- [ ] Database migration runs without errors
- [ ] Existing user data migrates correctly
- [ ] Stripe webhook handles monthly checkout ($99)
- [ ] Stripe webhook handles annual checkout ($999)
- [ ] Session management still enforces single-login
- [ ] Trial users can sign up
- [ ] Paid users can subscribe
- [ ] Subscription cancellation works
- [ ] Monthly → Annual upgrade works
- [ ] Annual → Monthly downgrade works

### Frontend Testing (Agent #2)
- [ ] Signup flow works without tier selection
- [ ] Billing page shows correct period (monthly/annual)
- [ ] Pricing page displays $99/mo and $999/yr correctly
- [ ] No upload limit warnings appear
- [ ] Users can upload unlimited files
- [ ] Session conflict modal still works (single-login enforcement)
- [ ] Trial expiry banner works
- [ ] Subscription expiry banner works
- [ ] Plan comparison removed from UI
- [ ] All tier references removed from UI
- [ ] TypeScript compilation succeeds (no type errors)

### Integration Testing (Both Agents)
- [ ] End-to-end signup → trial → payment → active subscription
- [ ] Monthly subscription checkout flow
- [ ] Annual subscription checkout flow
- [ ] Billing period change (monthly ↔ annual)
- [ ] Subscription cancellation flow
- [ ] Stripe webhook → database update → UI refresh
- [ ] Session management across multiple devices

---

## Rollback Plan

### If Migration Fails
1. **Database:** Keep backup of pre-migration schema, restore if needed
2. **Stripe:** Old products remain archived, can reactivate
3. **Code:** Git revert to tagged release before migration
4. **Edge Functions:** Supabase allows rollback to previous deployments

### Risk Mitigation
- Deploy to staging environment first
- Test with real Stripe test mode webhooks
- Verify existing paid users maintain access during migration
- Keep old Stripe products archived (don't delete) for data integrity

---

## Timeline Estimates

### Agent #1 (Backend): ~6-8 hours
- Database migration: 2 hours
- Edge function updates: 2-3 hours
- Stripe configuration: 1 hour
- Testing: 2 hours

### Agent #2 (Frontend): ~8-10 hours
- Type updates: 1 hour
- Store refactoring: 2 hours
- Component updates: 3-4 hours
- Remove upload tracking: 1 hour
- Testing: 2 hours

### Combined Integration & Testing: ~2-3 hours

**Total Estimated Time: 16-21 hours**

---

## Success Criteria

✅ All tier-based logic removed
✅ Single plan model: Accelerator Plan
✅ Billing periods: Monthly ($99) or Annual ($999)
✅ Trial period: 7 days free
✅ Unlimited uploads for all paid users
✅ Session management: Single concurrent login enforced
✅ No upload limits (simple total_uploads tracking for admin analytics only)
✅ Role system simplified: user and admin only (super_admin removed)
✅ Stripe integration handles monthly/annual correctly
✅ All tests pass
✅ TypeScript compiles without errors
✅ No console errors in production build
✅ Existing users migrated without service interruption

---

## Notes & Decisions

### Why Keep Session Management?
Even though we're removing Enterprise (multi-user), we still want to enforce single-session login for all users. This prevents account sharing and is a reasonable security measure.

### Why Keep Simple Upload Tracking?
While all paid plans are unlimited (no limits enforced), we keep a simple `total_uploads` counter in the profiles table for:
- Admin analytics and marketing metrics
- Usage monitoring per user (admin-only visibility)
- Tracking application adoption and growth
- Zero impact on user experience (completely hidden from users)

### Handling Existing Customers
Existing paid users on old tiers will be automatically migrated to monthly billing at their current renewal. They'll see no price change ($99 remains $99), but will now have access to unlimited uploads if they were on Optimizer.

### Trial Period Standardization
Standardize to 7-day free trial (1 week unlimited access) throughout the application.

### Role System Simplification
Remove `super_admin` role entirely. Only two roles needed:
- `user` - Regular customers
- `admin` - Single admin user (owner) with full access to user management and analytics

---

## File Reference Summary

### Files to SIMPLIFY (keep but remove limit logic)
- `client/src/composables/useUploadTracking.ts` - Remove limits, keep increment
- `supabase/functions/track-upload/index.ts` - Simplify to just increment counter

### Files to DELETE (28 files)
- `client/src/composables/useGlobalUploadLimit.ts`
- `client/src/components/auth/TierSelectionStep.vue`
- `client/src/components/shared/UploadLimitBanner.vue`
- `client/src/components/shared/UploadLimitModal.vue`
- `client/src/pages/EnterpriseView.vue`
- `supabase/functions/set-trial-tier/index.ts`
- `supabase/functions/create-organization/index.ts`
- `supabase/functions/invite-user/index.ts`
- `supabase/functions/accept-invitation/index.ts`
- `supabase/functions/manage-organization-members/index.ts`
- `supabase/functions/apply-upload-tracking-migration/index.ts`
- `.claude/docs/PRICING_TIERS_IMPLEMENTATION.md`
- Any other enterprise/tier documentation

### Files to MODIFY (40+ files)
See detailed action items in phases above.

### Files to CREATE (2 files)
- `supabase/migrations/YYYYMMDDHHMMSS_simplify_subscription_system.sql`
- Updated environment variable files with new Stripe price IDs
