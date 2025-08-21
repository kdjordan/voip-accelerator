~# VoIP Accelerator User Flow Testing Plan

## Overview
This document outlines comprehensive testing scenarios for the VoIP Accelerator application to ensure all user flows work correctly across different subscription states and upload limits.

**Testing is divided into phases for manageable implementation:**
- **Phase 1**: Core Individual Plans (Trial, Optimizer, Accelerator) 
- **Phase 2**: Enterprise Team Features (deferred until Phase 1 is complete)

## Test Environment Setup
- [ ] Fresh database state
- [ ] Test Stripe account configured
- [ ] Environment variables properly set
- [ ] Edge functions deployed and working

---

# PHASE 1: Core Individual Plan Testing

## User States to Test (Phase 1)

### 1. Trial Users (subscription_status: 'trial')
- [ ] **New Trial User**
- [ ] **Active Trial User (within limit)**
- [ ] **Trial User at Upload Limit (100/100)**
- [ ] **Trial User with Expired Trial**

### 2. Paid Individual Users
- [ ] **Optimizer User (active, under limit)**
- [ ] **Optimizer User (active, at limit 100/100)**
- [ ] **Accelerator User (unlimited)**

### 3. Inactive Users
- [ ] **Cancelled Subscription**
- [ ] **Expired Subscription**
- [ ] **No Subscription Data**

---

## Core Flow Testing Scenarios

### A. New User Registration & Trial Setup

#### A1. Trial User Signup Flow
**Test Steps:**
1. [ ] Visit signup page
2. [ ] Select "Trial" plan (or default trial)
3. [ ] Enter email/password and submit
4. [ ] Verify email confirmation sent
5. [ ] Click email confirmation link
6. [ ] Verify redirect to dashboard
7. [ ] **Expected Results:**
   - [ ] Dashboard shows "Current Plan: Trial" badge
   - [ ] Shows "0/100" upload count
   - [ ] Shows trial expiration date
   - [ ] "Choose Plan" button visible

#### A2. Paid Plan Signup Flow
**Test Steps:**
1. [ ] Visit signup page
2. [ ] Select paid plan (Optimizer/Accelerator/Enterprise)
3. [ ] Enter email/password and submit
4. [ ] Verify redirect to Stripe checkout
5. [ ] Complete Stripe payment
6. [ ] Verify redirect back to dashboard
7. [ ] **Expected Results:**
   - [ ] Dashboard shows correct plan badge
   - [ ] Shows correct upload limits
   - [ ] Shows next billing date
   - [ ] No "Choose Plan" button (shows "Change Plan" instead)

### B. Upload Limit Testing

#### B1. Trial User Upload Limits
**Test Steps:**
1. [ ] Login as trial user with 99/100 uploads
2. [ ] Navigate to any upload page (/us-rate-sheet, /az-rate-sheet, /usview, /azview, /rate-gen)
3. [ ] Upload one file to reach 100/100
4. [ ] **Expected Results:**
   - [ ] Upload succeeds
   - [ ] Dashboard shows 100/100
   - [ ] ServiceExpiryBanner appears on all upload pages
   - [ ] Banner shows "You've reached your monthly upload limit"
   - [ ] Banner has "Compare all plans" button

#### B2. Upload Limit Route Blocking
**Test Steps:**
1. [ ] As user at 100/100 upload limit, try to access:
   - [ ] `/us-rate-sheet` - should be blocked
   - [ ] `/az-rate-sheet` - should be blocked  
   - [ ] `/usview` - should be blocked
   - [ ] `/azview` - should be blocked
   - [ ] `/rate-gen` - should be blocked
2. [ ] **Expected Results:**
   - [ ] All routes redirect to dashboard
   - [ ] Dashboard shows ServiceExpiryBanner
   - [ ] URL shows `?uploadLimitReached=true`

#### B3. Optimizer User Upload Limits
**Test Steps:**
1. [ ] Login as paid Optimizer user with 99/100 uploads
2. [ ] Upload one file to reach 100/100
3. [ ] Try to access upload routes
4. [ ] **Expected Results:**
   - [ ] Same blocking behavior as trial users
   - [ ] ServiceExpiryBanner appears
   - [ ] Routes are blocked

#### B4. Unlimited Plan Upload Testing
**Test Steps:**
1. [ ] Login as Accelerator user
2. [ ] Upload multiple files (test with >100 uploads)
3. [ ] Navigate to all upload pages
4. [ ] **Expected Results:**
   - [ ] No upload limits enforced
   - [ ] No route blocking
   - [ ] Dashboard shows "X (Unlimited)" for uploads
   - [ ] No ServiceExpiryBanner

### C. Plan Upgrade Flows

#### C1. Trial User Upgrade from Dashboard
**Test Steps:**
1. [ ] Login as trial user
2. [ ] Click "Choose Plan" button in dashboard
3. [ ] Select plan in PlanSelectorModal
4. [ ] Complete Stripe checkout
5. [ ] Return to dashboard
6. [ ] **Expected Results:**
   - [ ] Dashboard updates to show new plan
   - [ ] Upload limits updated accordingly
   - [ ] Billing information displayed

#### C2. Trial User Upgrade from Expiry Banner
**Test Steps:**
1. [ ] Login as expired trial user
2. [ ] See ServiceExpiryBanner on dashboard
3. [ ] Click "Choose Plan" button
4. [ ] Select plan and complete checkout
5. [ ] **Expected Results:**
   - [ ] Plan activated immediately
   - [ ] Upload access restored
   - [ ] Banner disappears

#### C3. Upload Limit Upgrade Flow
**Test Steps:**
1. [ ] Login as user at 100/100 upload limit
2. [ ] Try to access upload page (should redirect to dashboard)
3. [ ] Click "Compare all plans" in ServiceExpiryBanner
4. [ ] Select Accelerator plan
5. [ ] Complete Stripe checkout
6. [ ] **Expected Results:**
   - [ ] Upload limits immediately removed
   - [ ] Can access upload pages
   - [ ] Banner disappears

#### C4. Plan Change for Existing Paid Users
**Test Steps:**
1. [ ] Login as Optimizer user
2. [ ] Click "Change Plan" button
3. [ ] Select Accelerator plan
4. [ ] Complete Stripe checkout
5. [ ] **Expected Results:**
   - [ ] Plan upgraded in dashboard
   - [ ] Prorated billing handled by Stripe
   - [ ] Upload limits updated

### D. Trial Expiration Testing

#### D1. Expired Trial User
**Test Steps:**
1. [ ] Set trial user's plan_expires_at to past date
2. [ ] Login and navigate to dashboard
3. [ ] Try to access upload pages
4. [ ] **Expected Results:**
   - [ ] ServiceExpiryBanner shows "trial has expired"
   - [ ] Upload routes may be blocked (verify current behavior)
   - [ ] "Choose Plan" button available

#### D2. Trial User Near Expiration
**Test Steps:**
1. [ ] Set trial user's plan_expires_at to 2 days from now
2. [ ] Login and check dashboard
3. [ ] **Expected Results:**
   - [ ] Warning banner shows "expires in 2 days"
   - [ ] "Upgrade" button available
   - [ ] Upload access still available

### E. Billing Management

#### E1. Billing Portal Access
**Test Steps:**
1. [ ] Login as paid user
2. [ ] Click "Manage Billing" button
3. [ ] **Expected Results:**
   - [ ] Redirected to Stripe billing portal
   - [ ] Can view invoices and payment methods
   - [ ] Can cancel subscription

#### E2. Subscription Cancellation
**Test Steps:**
1. [ ] Cancel subscription via Stripe portal
2. [ ] Return to app and refresh
3. [ ] **Expected Results:**
   - [ ] Dashboard updates to show cancelled status
   - [ ] ServiceExpiryBanner appears
   - [ ] Upload access behavior (verify current implementation)

### F. Edge Cases & Error Handling

#### F1. Network Errors During Checkout
**Test Steps:**
1. [ ] Start checkout process
2. [ ] Simulate network failure during Stripe redirect
3. [ ] **Expected Results:**
   - [ ] Error message displayed
   - [ ] Modal reopens for retry
   - [ ] User can try again

#### F2. Webhook Delays
**Test Steps:**
1. [ ] Complete Stripe checkout
2. [ ] Return to app before webhook processes
3. [ ] **Expected Results:**
   - [ ] Dashboard shows "Updating subscription..." state
   - [ ] Refreshes automatically after webhook
   - [ ] Correct plan displayed

#### F3. Invalid Subscription States
**Test Steps:**
1. [ ] User with subscription_status: null
2. [ ] User with malformed date fields
3. [ ] **Expected Results:**
   - [ ] Graceful degradation
   - [ ] Default to trial or unauthenticated state
   - [ ] No application crashes

### G. Cross-Route Upload Limit Consistency

#### G1. All Upload Pages Show Consistent Limits
**Test Steps:**
1. [ ] Login as user at various upload counts
2. [ ] Check all upload pages for consistent display:
   - [ ] `/us-rate-sheet`
   - [ ] `/az-rate-sheet`
   - [ ] `/usview`
   - [ ] `/azview`
   - [ ] `/rate-gen`
3. [ ] **Expected Results:**
   - [ ] All pages show same upload count
   - [ ] ServiceExpiryBanner consistent across pages
   - [ ] Upload functionality blocked consistently

#### G2. Route Guard Consistency
**Test Steps:**
1. [ ] As user at upload limit, test all protected routes
2. [ ] Verify redirect behavior is consistent
3. [ ] **Expected Results:**
   - [ ] All routes redirect to dashboard
   - [ ] Dashboard shows appropriate banner
   - [ ] URL parameters consistent

---

## Test Data Setup Requirements (Phase 1)

### Trial Users
```sql
-- User at 0/100 uploads, trial active
-- User at 50/100 uploads, trial active  
-- User at 100/100 uploads, trial active
-- User with expired trial
-- User with trial expiring in 1-2 days
```

### Paid Individual Users
```sql
-- Optimizer user at 0/100 uploads
-- Optimizer user at 100/100 uploads
-- Accelerator user with various upload counts
-- User with cancelled subscription
-- User with expired subscription
```

---

## Automated Testing Checklist

### Unit Tests Needed
- [ ] Upload limit calculations
- [ ] Route guard logic
- [ ] Plan tier determination
- [ ] Banner state computation

### Integration Tests Needed  
- [ ] Stripe webhook processing
- [ ] Database upload count updates
- [ ] Route protection middleware
- [ ] Plan upgrade flows

### E2E Tests Priority
- [ ] Complete signup → upload → limit → upgrade flow
- [ ] Trial expiration → upgrade flow
- [ ] Plan changes between tiers

---

## Success Criteria

### Performance
- [ ] Dashboard loads in <2 seconds
- [ ] Plan upgrades complete in <30 seconds
- [ ] Upload limit checks are instant

### User Experience
- [ ] Clear messaging for all states
- [ ] Consistent UI across all pages
- [ ] No confusing or contradictory information
- [ ] Smooth upgrade flows without errors

### Business Logic
- [ ] Upload limits enforced correctly
- [ ] Billing calculations accurate
- [ ] Plan benefits applied immediately
- [ ] No unauthorized access to features

---

## Known Issues to Verify Fixed
- [x] Optimizer plan showing $249 instead of $99
- [x] Trial users showing as "Optimizer" instead of "Free Trial"
- [ ] Any remaining route blocking inconsistencies
- [ ] Upload count synchronization across pages

---

## Testing Progress Tracking

Use this section to track testing progress:

```
□ = Not Started
◐ = In Progress  
✓ = Completed
✗ = Failed (needs fix)
```

### Phase 1 Current Status
- Registration Flows: □
- Upload Limits: □
- Plan Upgrades: ◐ (basic flow tested, needs comprehensive testing)
- Trial Expiration: □
- Billing Management: □
- Edge Cases: □
- Cross-Route Consistency: □

---

# PHASE 2: Enterprise Team Features (Future)

> **Note**: Phase 2 testing will be planned after Phase 1 is complete and stable.

## Enterprise Features to Test (Phase 2 Scope)

### Team Management
- [ ] Enterprise admin can invite up to 5 team members
- [ ] Team invitation flow via edge function + Supabase
- [ ] Team member onboarding
- [ ] Seat management (add/remove team members)

### Role-Based Access
- [ ] Super Admin capabilities (app owner)
- [ ] Enterprise Admin role (billing, team management)
- [ ] User role (team members)
- [ ] Permission enforcement across features

### Enterprise Dashboard
- [ ] Dedicated admin dashboard for team management
- [ ] Team member listing and status
- [ ] Usage analytics across team
- [ ] Billing management for entire team

### Upload & Data Sharing
- [ ] Unlimited uploads for all team members
- [ ] Data visibility/sharing between team members
- [ ] Team workspace concepts (if applicable)

### Integration Testing
- [ ] Enterprise + Individual plan interactions
- [ ] Billing transitions (Individual → Enterprise)
- [ ] Data migration for existing users joining teams

## Phase 2 Success Criteria
- [ ] Seamless team invitation process
- [ ] Clear role-based permissions
- [ ] Intuitive admin dashboard
- [ ] Stable billing for team accounts
- [ ] No conflicts between individual and team features

---

## Overall Testing Progress

### Phase 1 (In Progress)
Focus: Core individual user flows must be bulletproof before adding team complexity.

### Phase 2 (Future)  
Focus: Enterprise team features build on stable Phase 1 foundation.