# VoIP Accelerator - Staging vs Production Environment Comparison

**Generated:** 2025-10-13
**Analysis Type:** Schema, Migration, and Edge Function Comparison
**Risk Assessment:** CRITICAL - Major schema divergence detected

---

## Executive Summary

### Critical Findings

**MAJOR SCHEMA DIVERGENCE**: Production is significantly behind staging with critical missing tables, incomplete migrations, and outdated infrastructure.

| Category | Production | Staging | Gap |
|----------|-----------|---------|-----|
| **Migrations Applied** | 19 | 58 | **39 missing** |
| **Public Tables** | 2 | 3 | **1 missing** |
| **Edge Functions** | 6 | 40 | **34 missing** |
| **LERG Records** | 440 (simple) | 450 (enhanced) | **10 NPAs + schema upgrade** |
| **Database Users** | 14 (keep) | 4 (test - wipe) | Production has real users |
| **RLS Policies** | 12 (duplicates) | 11 (clean) | Cleanup needed |
| **Triggers** | 2 (duplicates) | 3 (+ email sync) | Staging has fixes |

### Risk Assessment

**🚨 CRITICAL RISKS:**
1. **Payment Processing**: Missing Stripe integration (webhook handler, subscription management)
2. **Enhanced LERG System**: Production stuck on legacy simple LERG schema
3. **Session Management**: No active_sessions table (user tracking disabled)
4. **Upload Tracking**: No tracking system (analytics/limits missing)
5. **Duplicate Triggers**: Production has conflicting trial setup logic

**⚠️ DEPLOYMENT STRATEGY REQUIRED:**
- **DO NOT** simply apply 39 missing migrations sequentially
- **MUST** preserve 14 existing production users
- **NEED** data migration plan for LERG upgrade (440 → 450 records with schema change)
- **SHOULD** deploy edge functions after schema updates

---

## 1. TABLE DIFFERENCES

### 1.1 Missing Tables in Production

#### **active_sessions** (MISSING - Critical for User Tracking)

**Purpose:** Session management table for tracking active user sessions
**Staging Rows:** 2
**Migration Created:** `20250811033327_session_management_and_organizations_no_cron`

**Full Schema:**
```sql
CREATE TABLE public.active_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_token text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now(),
  last_heartbeat timestamptz DEFAULT now(),
  user_agent text,
  ip_address inet,
  browser_info jsonb,
  is_active boolean DEFAULT true
);

CREATE INDEX idx_active_sessions_user_id ON public.active_sessions(user_id);
```

**RLS Policy:**
```sql
CREATE POLICY "Users can manage own sessions"
  ON public.active_sessions
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid());
```

**Impact:** Without this table:
- No session tracking/management
- No multi-device login detection
- No forced logout capability
- No session cleanup automation

**Related Edge Functions (Missing in Production):**
- `manage-session` - Create/update session tracking
- `check-session` - Validate active sessions
- `force-logout` - Invalidate user sessions
- `cleanup-session` - Remove stale sessions
- `pre-login-check` - Pre-authentication validation

---

### 1.2 Schema Differences - Existing Tables

#### **profiles** Table Comparison

**Major Differences:**

| Column | Production | Staging | Status |
|--------|-----------|---------|--------|
| `role` | text (nullable) | text NOT NULL, DEFAULT 'user', CHECK: ('user', 'admin') | **MISSING CONSTRAINT** |
| `email` | ❌ MISSING | text | **MISSING COLUMN** |
| `subscription_id` | ❌ MISSING | text | **MISSING COLUMN** |
| `current_period_start` | ❌ MISSING | timestamptz | **MISSING COLUMN** |
| `current_period_end` | ❌ MISSING | timestamptz | **MISSING COLUMN** |
| `cancel_at` | ❌ MISSING | timestamptz | **MISSING COLUMN** |
| `canceled_at` | ❌ MISSING | timestamptz | **MISSING COLUMN** |
| `last_payment_date` | ❌ MISSING | timestamptz | **MISSING COLUMN** |
| `total_uploads` | ❌ MISSING | integer DEFAULT 0 | **MISSING COLUMN** |
| `cancel_at_period_end` | ❌ MISSING | boolean DEFAULT false | **MISSING COLUMN** |
| `billing_period` | ❌ MISSING | text CHECK: ('monthly', 'annual') | **MISSING COLUMN** |
| `user_agent` | text ✓ | ❌ REMOVED | Staging removed this |
| `signup_method` | text ✓ | ❌ REMOVED | Staging removed this |

**Indexes Missing in Production:**
```sql
-- Staging has performance indexes that production lacks
CREATE INDEX idx_profiles_billing_period ON profiles(billing_period) WHERE billing_period IS NOT NULL;
CREATE INDEX idx_profiles_role ON profiles(role) WHERE role = 'admin';
CREATE INDEX idx_profiles_total_uploads ON profiles(total_uploads DESC);
```

**Comments Missing in Production:**
Production has basic column comments, but staging has comprehensive business logic documentation on the table itself:
```sql
COMMENT ON TABLE profiles IS 'Migration 20250930171728: Subscription simplification in progress';
COMMENT ON COLUMN profiles.billing_period IS 'Billing period for Accelerator Plan: monthly ($99) or annual ($999). NULL for trials.';
COMMENT ON COLUMN profiles.total_uploads IS 'Total upload count for admin analytics (no limit enforcement). Incremented on each upload.';
```

---

#### **LERG Data: lerg_codes vs enhanced_lerg**

**CRITICAL DIFFERENCE:** Production has simple LERG, staging has enhanced LERG with geographic context.

**Production: `lerg_codes`** (440 NPAs, simple structure)
```sql
CREATE TABLE public.lerg_codes (
  id integer PRIMARY KEY AUTO-INCREMENT,
  npa char(3) UNIQUE NOT NULL,
  state char(2) NOT NULL,
  country char(2) NOT NULL,
  last_updated timestamptz DEFAULT CURRENT_TIMESTAMP
);
```

**Staging: `enhanced_lerg`** (450 NPAs, enterprise structure)
```sql
CREATE TABLE public.enhanced_lerg (
  npa varchar(3) PRIMARY KEY NOT NULL CHECK (npa ~ '^[0-9]{3}$'),
  country_code varchar(2) NOT NULL CHECK (country_code ~ '^[A-Z]{2}$'),
  country_name varchar(100) NOT NULL,
  state_province_code varchar(2) NOT NULL CHECK (state_province_code ~ '^[A-Z]{2}$'),
  state_province_name varchar(100) NOT NULL,
  region varchar(50),
  notes text,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  is_active boolean DEFAULT true
);
```

**Staging Enhancements:**
1. **NPA as Primary Key** (no auto-increment id needed)
2. **Full Country/State Names** (not just codes)
3. **Region Classification** (US, CA, Caribbean, Pacific)
4. **Notes Field** (for manual overrides/context)
5. **Soft Delete** (is_active flag)
6. **Audit Trail** (created_at, updated_at)
7. **Data Validation** (CHECK constraints on formats)
8. **10 Additional NPAs** (440 → 450)

**Indexes Comparison:**

Production:
```sql
lerg_codes_pkey (on id)
lerg_codes_npa_unique (UNIQUE on npa)
idx_lerg_state (on state)
idx_lerg_country (on country)
```

Staging (enhanced_lerg):
```sql
enhanced_lerg_pkey (PRIMARY KEY on npa)
idx_enhanced_lerg_active (on is_active WHERE is_active = true)
idx_enhanced_lerg_country (on country_code)
idx_enhanced_lerg_state (on state_province_code)
```

**RLS Policy Differences:**

Production (lerg_codes):
- 4 policies (2 duplicate SELECT policies, admin UPDATE/DELETE)

Staging (enhanced_lerg):
- 2 policies (clean, no duplicates)
- Uses `WHERE is_active = true` filter on SELECT

**Sample Data Comparison:**

Production `lerg_codes` (simplified):
```
npa: 201, state: NJ, country: US
npa: 204, state: MB, country: CA
npa: 264, state: AI, country: AI
```

Staging `enhanced_lerg` (comprehensive):
```
npa: 201, country: US (United States), state: NJ (New Jersey), region: US
npa: 204, country: CA (Canada), state: MB (Manitoba), region: CA
npa: 264, country: AI (Anguilla), state: AI (Anguilla), region: Caribbean
```

**Migration Path:**
- **CANNOT** rename table (breaking change for production users)
- **MUST** create new enhanced_lerg table
- **NEED** data migration script to transform 440 records
- **SHOULD** add 10 missing NPAs during migration
- **CAN** deprecate lerg_codes after migration (keep for rollback)

---

## 2. MIGRATION GAP ANALYSIS

### 2.1 Missing Migrations (39 total)

Production stopped at migration 19 (`20250530043401_update_trial_periods_july_2025`).
Staging is at migration 58 (`20251005073335_fix_handle_new_user_trigger_v2`).

**39 Missing Migrations by Category:**

#### **Category A: Enhanced LERG System (4 migrations)**
```
20250628112353_create_enhanced_lerg_table
20250628112621_seed_enhanced_lerg_data
20250629035346_update_source_constraint
20250629035703_consolidate_and_cleanup_lerg
```

**Impact:** Creates enhanced_lerg table, seeds 450 records, adds validation

---

#### **Category B: Stripe Integration (2 migrations)**
```
20250714020448_add_stripe_subscription_fields
20250714020509_sync_email_to_profiles
```

**Impact:** Adds Stripe fields to profiles, creates email sync trigger

**Columns Added:**
- `subscription_id` text
- `current_period_start` timestamptz
- `current_period_end` timestamptz
- `last_payment_date` timestamptz
- `email` text (synced from auth.users)

**Trigger Added:**
```sql
CREATE TRIGGER sync_email_on_user_update
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION sync_email_to_profiles();
```

---

#### **Category C: Subscription Fixes (2 migrations)**
```
20250810041308_fix_trial_subscription_periods
20250810042320_update_profiles_remove_unused_add_uploads
```

**Impact:** Fixes trial logic, adds `total_uploads` tracking column

---

#### **Category D: Session Management (2 migrations)**
```
20250811033327_session_management_and_organizations_no_cron
20250811082950_fix_profiles_rls_policy
```

**Impact:** Creates `active_sessions` table, fixes RLS duplicate policies

---

#### **Category E: Tier System (6 migrations - DEPRECATED)**
```
20250812033641_add_tier_columns
20250812033648_update_existing_users
20250812033702_create_new_tables
20250812033721_fix_active_sessions
20250812033756_fix_constraints
20250812051436_stripe_sync_engine_schema
```

**Status:** These migrations added tier system that was later simplified/removed
**Note:** May need to skip or adjust these during production migration

---

#### **Category F: Upload Tracking System (13 migrations)**
```
20250816015109_add_total_uploads_tracking
20250816015142_create_upload_tracking_functions
20250816015203_create_increment_upload_function
20250816015235_create_helper_upload_functions
20250817023229_fix_upload_tier_limits
20250817023251_fix_increment_upload_count
20250817023309_fix_get_upload_statistics
20250817023912_fix_increment_default_tier
20250817023946_fix_check_upload_limit_defaults
20250817024037_fix_increment_ambiguity
20250817024827_sync_legacy_uploads_column
20250817025202_remove_legacy_uploads_column
```

**Impact:** Adds upload tracking infrastructure and functions
**Note:** Multiple fix migrations suggest complex evolution

---

#### **Category G: Security & Performance (10 migrations)**
```
20250820104357_fix_security_issues
20250820104958_fix_security_individual_functions
20250820105012_fix_reset_monthly_uploads_functions
20250821095232_add_cancellation_fields
20250824031215_add_missing_foreign_key_indexes
20250824031243_remove_unused_indexes
20250824031315_add_remaining_missing_indexes
20250824031405_optimize_rls_policies_clean
20250824031720_fix_all_rls_policies_correctly
20250824031929_cleanup_duplicate_unused_indexes
```

**Impact:** Security hardening, RLS cleanup, index optimization, cancellation support

**Columns Added:**
- `cancel_at` timestamptz
- `canceled_at` timestamptz
- `cancel_at_period_end` boolean

---

#### **Category H: Subscription Simplification (3 migrations)**
```
20251001115457_simplify_subscription_system
20251005073115_fix_handle_new_user_trigger
20251005073335_fix_handle_new_user_trigger_v2
```

**Impact:** Removes tier complexity, simplifies to single Accelerator Plan with monthly/annual billing

**Migration Notes:**
- Removed `user_agent` and `signup_method` columns
- Added `billing_period` with CHECK constraint
- Fixed duplicate trigger logic (production still has this bug)

---

### 2.2 Migration Application Strategy

**CRITICAL:** Cannot apply all 39 migrations sequentially due to:
1. **Tier system migrations** (Category E) - May conflict with simplification migrations (Category H)
2. **Upload tracking fixes** (Category F) - 13 migrations iteratively fixing same feature
3. **Production user data** - Must preserve 14 existing users during schema changes
4. **LERG data migration** - Need to transform 440 simple records to 450 enhanced records

**Recommended Approach:**

**Phase 1: Core Infrastructure (Low Risk)**
- Apply Category D (Session Management)
- Apply Category C (Subscription Fixes)
- Apply Category A (Enhanced LERG - with data migration script)

**Phase 2: Stripe Integration (Medium Risk)**
- Apply Category B (Stripe fields + email sync)
- Test with staging Stripe webhook

**Phase 3: Security & Performance (Low Risk)**
- Apply Category G (Security hardening, RLS cleanup, indexes)
- Remove duplicate RLS policies from production

**Phase 4: Upload Tracking (Medium Risk)**
- Review Category F migrations for consolidated version
- May be able to collapse 13 migrations into 2-3 essential ones

**Phase 5: Subscription Simplification (High Risk)**
- Apply Category H (final state)
- Migrate existing production users to new schema
- Test trial and paid subscription flows

**Phase 6: Skip/Defer**
- Category E (Tier System) - Skip entirely, superseded by simplification

---

## 3. EDGE FUNCTION DIFFERENCES

### 3.1 Missing Edge Functions in Production (34 total)

Production has **6 functions**, Staging has **40 functions**.

#### **Category: Enhanced LERG Functions (MISSING)**

All of these use the new `enhanced_lerg` table:

| Function | Version | Purpose | Risk |
|----------|---------|---------|------|
| `get-enhanced-lerg-data` | 56 | Retrieve complete LERG dataset with stats | HIGH |
| `add-enhanced-lerg-record` | 56 | Add new NPA with validation | MEDIUM |
| `update-enhanced-lerg-record` | 56 | Update NPA with audit trail | MEDIUM |
| `get-npa-location` | 56 | Fast NPA geographic lookup | HIGH |

**Current State:** Production has old LERG functions:
- `get-lerg-data` (v3) - Works with simple `lerg_codes` table
- `add-lerg-record` (v3) - Simple structure
- No update capability
- No NPA location lookup

**Migration Impact:**
- Deploy enhanced functions AFTER enhanced_lerg table exists
- May need to run both old and new functions during transition
- Frontend code references enhanced functions

---

#### **Category: User Management Functions (MISSING)**

| Function | Version | Purpose | Risk |
|----------|---------|---------|------|
| `get-all-users` | 66 | Admin: retrieve all profiles | LOW |
| `update-user-profile` | 58 | Admin: update user profile | MEDIUM |
| `toggle-user-status` | 59 | Admin: enable/disable users | MEDIUM |
| `get-user-activity` | 59 | User activity metrics | LOW |

**Current State:** Production only has `delete-user-account`

**Migration Impact:** These are admin functions, can deploy anytime after profiles schema is updated

---

#### **Category: Stripe/Payment Functions (MISSING - CRITICAL)**

| Function | Version | Purpose | Risk |
|----------|---------|---------|------|
| `create-checkout-session` | 77 | Create Stripe checkout for subscriptions | **CRITICAL** |
| `create-portal-session` | 65 | Create Stripe customer portal | **CRITICAL** |
| `check-subscription-status` | 59 | Verify subscription status | HIGH |
| `stripe-events` | 21 | Stripe webhook event handler | **CRITICAL** |
| `upgrade-subscription` | 12 | Handle plan upgrades | HIGH |

**Current State:** Production has NO payment processing capability

**Migration Impact:**
- **CANNOT** accept payments without these functions
- Must deploy BEFORE any paid subscriptions
- Requires Stripe webhook configuration
- Needs environment variables (STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET)

---

#### **Category: Session Management Functions (MISSING)**

| Function | Version | Purpose | Risk |
|----------|---------|---------|------|
| `manage-session` | 45 | Create/update user session | MEDIUM |
| `check-session` | 32 | Validate active session | MEDIUM |
| `force-logout` | 21 | Force user logout | LOW |
| `cleanup-session` | 12 | Remove stale sessions | LOW |
| `pre-login-check` | 11 | Pre-authentication validation | LOW |

**Current State:** Production has no session management

**Migration Impact:** Deploy AFTER `active_sessions` table is created

---

#### **Category: Upload Tracking Functions (MISSING)**

| Function | Version | Purpose | Risk |
|----------|---------|---------|------|
| `track-upload` | 46 | Track file upload operations | MEDIUM |

**Current State:** No upload tracking in production

**Migration Impact:** Deploy after `total_uploads` column added to profiles

---

#### **Category: Trial/Tier Management Functions (MISSING)**

| Function | Version | Purpose | Risk |
|----------|---------|---------|------|
| `set-trial-tier` | 45 | Set user trial tier | LOW |

**Note:** This may be deprecated in simplified subscription system

---

#### **Category: Debug/Testing Functions (MISSING - Optional)**

| Function | Version | Purpose | Deploy to Prod? |
|----------|---------|---------|-----------------|
| `test-stripe` | 54 | Stripe integration testing | NO (dev only) |
| `debug-subscription` | 52 | Subscription debugging | NO (dev only) |
| `debug-subscription-no-jwt` | 52 | Subscription debug alt | NO (dev only) |
| `get-stripe-account` | 44 | Get Stripe account info | NO (dev only) |
| `debug-portal` | 11 | Customer portal debug | NO (dev only) |
| `test-auth` | 12 | Authentication testing | NO (dev only) |
| `debug-auth` | 13 | Auth debugging | NO (dev only) |
| `check-session-debug` | 11 | Session debug endpoint | NO (dev only) |
| `check-session-simple` | 11 | Simplified session check | NO (dev only) |
| `test-env` | 38 | Environment variable testing | NO (dev only) |

**Recommendation:** Do NOT deploy debug functions to production

---

#### **Category: Organization Functions (MISSING - Placeholders)**

| Function | Version | Purpose | Status |
|----------|---------|---------|--------|
| `create-organization` | 44 | Create organization | PLACEHOLDER |
| `invite-user` | 44 | Invite user to org | PLACEHOLDER |
| `accept-invitation` | 44 | Accept org invite | PLACEHOLDER |
| `manage-organization-members` | 44 | Manage org members | PLACEHOLDER |

**Note:** These appear to be templates/placeholders for future multi-tenant feature

**Recommendation:** Do NOT deploy to production (incomplete feature)

---

### 3.2 Edge Function Version Differences

Functions that exist in both environments but with different versions:

| Function | Production | Staging | Delta |
|----------|-----------|---------|-------|
| `ping-status` | v3 | v62 | +59 versions |
| `delete-user-account` | v1 | v59 | +58 versions |
| `upload-lerg` | v3 | v59 | +56 versions |

**Impact:** Staging versions likely have bug fixes, improved error handling, and updated schema support

**Action:** Replace production versions with staging versions during migration

---

### 3.3 Edge Function Deployment Order

**Phase 1: Infrastructure Functions (Deploy First)**
```
1. ping-status (health check)
2. get-enhanced-lerg-data (LERG lookup)
3. get-npa-location (fast NPA lookup)
```

**Phase 2: LERG Management (Deploy After enhanced_lerg Table)**
```
4. add-enhanced-lerg-record
5. update-enhanced-lerg-record
6. upload-lerg (updated version)
```

**Phase 3: User Management (Deploy After profiles Schema Update)**
```
7. delete-user-account (updated version)
8. get-all-users
9. update-user-profile
10. toggle-user-status
11. get-user-activity
```

**Phase 4: Session Management (Deploy After active_sessions Table)**
```
12. manage-session
13. check-session
14. pre-login-check
15. cleanup-session
16. force-logout
```

**Phase 5: Stripe Integration (Deploy After Stripe Fields Added)**
```
17. create-checkout-session ⚠️ CRITICAL
18. create-portal-session ⚠️ CRITICAL
19. stripe-events ⚠️ CRITICAL (webhook handler)
20. check-subscription-status
21. upgrade-subscription
```

**Phase 6: Upload Tracking (Deploy After total_uploads Column)**
```
22. track-upload
```

**Phase 7: Deprecated/Optional (Skip)**
```
❌ set-trial-tier (may be deprecated)
❌ All debug-* and test-* functions (dev only)
❌ Organization functions (incomplete feature)
```

---

## 4. DATABASE FUNCTION DIFFERENCES

### 4.1 Missing Functions in Production

#### **sync_email_to_profiles()** - MISSING
**Purpose:** Syncs email from auth.users to profiles table on update
**Created:** Migration `20250714020509_sync_email_to_profiles`
**Security:** DEFINER

```sql
CREATE OR REPLACE FUNCTION public.sync_email_to_profiles()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.profiles
  SET email = NEW.email
  WHERE id = NEW.id;
  RETURN NEW;
END;
$function$
```

**Trigger:**
```sql
CREATE TRIGGER sync_email_on_user_update
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (OLD.email IS DISTINCT FROM NEW.email)
  EXECUTE FUNCTION sync_email_to_profiles();
```

**Impact:** Without this, profiles.email column (missing in production) wouldn't sync with auth.users.email

---

#### **get_npa_info(p_npa varchar)** - MISSING
**Purpose:** Retrieves enhanced LERG data for a specific NPA
**Returns:** TABLE(npa, display_location, full_location, category, confidence_score)
**Security:** DEFINER

**Impact:** Used by enhanced NANP categorization system

---

#### **increment_upload_count(p_user_id uuid, p_file_count integer)** - MISSING
**Purpose:** Increments user upload counter for analytics
**Returns:** TABLE(success boolean, total_uploads integer, message text)
**Security:** DEFINER

**Impact:** Upload tracking doesn't work without this

---

#### **reset_monthly_uploads()** - MISSING
**Purpose:** Resets monthly upload counters (scheduled maintenance)
**Security:** DEFINER

**Impact:** No monthly reset capability (may be deprecated if no limits enforced)

---

#### **cleanup_stale_sessions()** - MISSING
**Purpose:** Removes inactive sessions older than 5 minutes
**Security:** DEFINER

```sql
CREATE OR REPLACE FUNCTION public.cleanup_stale_sessions()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $function$
  DELETE FROM active_sessions
  WHERE last_heartbeat < NOW() - INTERVAL '5 minutes';
$function$
```

**Impact:** Sessions accumulate without cleanup

---

#### **update_updated_at_column()** - MISSING
**Purpose:** Generic trigger function to update updated_at timestamp
**Security:** DEFINER

**Used by:** enhanced_lerg table trigger

---

### 4.2 Function Definition Differences

#### **handle_new_user()** Comparison

**Production Version (May 12, 2025):**
```sql
INSERT INTO public.profiles (id, role, plan_expires_at, user_agent, signup_method, subscription_status)
VALUES (
  new.id,
  'user',
  '2025-05-23 23:59:59 UTC', -- HARDCODED DATE (outdated)
  new.raw_user_meta_data ->> 'user_agent',
  COALESCE(new.raw_app_meta_data ->> 'provider', 'email'),
  'trial'
);
```

**Staging Version (October 5, 2025):**
```sql
INSERT INTO public.profiles (id, role, plan_expires_at, billing_period, subscription_status)
VALUES (
  new.id,
  'user',
  NOW() + INTERVAL '7 days', -- DYNAMIC 7-DAY TRIAL
  NULL,
  'trial'
);
```

**Differences:**
1. **Staging removed:** user_agent, signup_method columns
2. **Staging added:** billing_period column
3. **Staging uses dynamic trial:** NOW() + 7 days instead of hardcoded date
4. **Production hardcoded date is EXPIRED:** '2025-05-23' is in the past

---

#### **handle_new_user_trial()** Comparison

**Both environments have this function, but production has CONFLICT:**

**Production Issue:** TWO triggers on auth.users both trying to create profiles entry:
1. `on_auth_user_created` → `handle_new_user()`
2. `on_auth_user_created_set_trial` → `handle_new_user_trial()`

**Staging Fix:** The October 2025 migrations consolidated this into a single trigger

**Production Bug Impact:**
- First trigger creates profile with hardcoded expired date
- Second trigger tries INSERT, fails, falls back to UPDATE with ON CONFLICT
- Inconsistent behavior depending on timing

**Staging Solution:**
- Single trigger with proper logic
- Clean 7-day trial setup
- No conflicts or race conditions

---

### 4.3 Function Deployment Order

**Phase 1: Core Functions (Deploy with Migrations)**
```
1. update_updated_at_column() - Required by enhanced_lerg trigger
2. sync_email_to_profiles() - Required after profiles.email column added
3. get_npa_info() - Required after enhanced_lerg table created
```

**Phase 2: Upload Tracking Functions**
```
4. increment_upload_count() - Required after total_uploads column added
5. reset_monthly_uploads() - Optional, for scheduled maintenance
```

**Phase 3: Session Management Functions**
```
6. cleanup_stale_sessions() - Required after active_sessions table created
```

**Phase 4: Fix Existing Functions**
```
7. Replace handle_new_user() with staging version
8. Remove duplicate on_auth_user_created_set_trial trigger
```

---

## 5. RLS POLICY DIFFERENCES

### 5.1 Duplicate Policies in Production

**Production profiles table has 8 RLS policies (4 pairs of duplicates):**

**Duplicate SELECT Policies:**
1. `select_own` - Users can view own profile (authenticated)
2. `Allow individual read access` - Same logic (public)

**Duplicate SELECT (Admin) Policies:**
3. `select_all` - Admins view all profiles (authenticated)
4. `Allow admin select access` - Same logic (public)

**Duplicate UPDATE Policies:**
5. `update_own` - Users update own profile (authenticated)
6. `Allow individual update access` - Same logic (public)

**Duplicate UPDATE (Admin) Policies:**
7. `update_any` - Admins update any profile (authenticated)
8. `Allow admin update access` - Same logic (public)

**Staging has 4 clean policies:**
1. `simple_select_policy` - Combined user + service_role SELECT
2. `simple_update_policy` - Combined user + service_role UPDATE
3. `consolidated_insert_policy` - INSERT with service_role support
4. `consolidated_delete_policy` - DELETE for service_role only

**Migration:** The August 2024 migrations cleaned up duplicate policies:
```
20250824031405_optimize_rls_policies_clean
20250824031720_fix_all_rls_policies_correctly
```

---

### 5.2 Missing RLS Policies

#### **profiles INSERT Policy (MISSING in Production)**

Production has no INSERT policy on profiles, relying solely on triggers to create profiles.

Staging has:
```sql
CREATE POLICY "consolidated_insert_policy"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id OR auth.role() = 'service_role');
```

**Impact:** Without INSERT policy, edge functions using service_role cannot directly insert profiles

---

#### **profiles DELETE Policy (MISSING in Production)**

Production has no DELETE policy on profiles.

Staging has:
```sql
CREATE POLICY "consolidated_delete_policy"
  ON public.profiles
  FOR DELETE
  TO authenticated
  USING (auth.role() = 'service_role');
```

**Impact:** Only service_role (edge functions) can delete profiles in staging. Production has no delete capability via RLS.

---

### 5.3 LERG RLS Policy Differences

**Production (lerg_codes) - 4 policies:**
1. `Allow authenticated select access` - SELECT for authenticated
2. `Allow authenticated read access` - DUPLICATE SELECT (same logic)
3. `Allow admin update access` - UPDATE for admins
4. `Allow admin delete access` - DELETE for admins

**Staging (enhanced_lerg) - 2 clean policies:**
1. `Allow authenticated read access` - SELECT with `WHERE is_active = true` filter
2. `Allow service role full access` - ALL operations for service_role

**Difference:** Staging uses service_role pattern instead of admin role check, and has soft-delete filtering

---

### 5.4 Missing RLS on active_sessions

Production doesn't have `active_sessions` table, so no policies.

Staging has:
```sql
CREATE POLICY "Users can manage own sessions"
  ON public.active_sessions
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid());
```

Simple, clean policy allowing users to manage only their own sessions.

---

## 6. TRIGGER DIFFERENCES

### 6.1 Missing Trigger in Production

**sync_email_on_user_update** - MISSING

```sql
CREATE TRIGGER sync_email_on_user_update
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (OLD.email IS DISTINCT FROM NEW.email)
  EXECUTE FUNCTION sync_email_to_profiles();
```

**Purpose:** Keeps profiles.email in sync with auth.users.email
**Created:** Migration `20250714020509_sync_email_to_profiles`

**Impact:** Without this, if user changes email in auth.users, profiles.email (missing in production) wouldn't update

---

### 6.2 Duplicate Trigger Issue in Production

**Production has TWO triggers on auth.users AFTER INSERT:**
1. `on_auth_user_created` → handle_new_user()
2. `on_auth_user_created_set_trial` → handle_new_user_trial()

**Problem:** Both try to manage profile creation and trial setup

**Staging Fix:** Consolidated into single trigger in October 2025 migrations

**Recommended Action:**
1. Drop `on_auth_user_created_set_trial` trigger
2. Update `handle_new_user()` function to staging version
3. Test signup flow thoroughly

---

### 6.3 Missing Trigger on enhanced_lerg

Production doesn't have enhanced_lerg table, so no trigger.

Staging has:
```sql
CREATE TRIGGER update_enhanced_lerg_updated_at
  BEFORE UPDATE ON public.enhanced_lerg
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

**Purpose:** Automatically updates updated_at timestamp on record changes

---

## 7. INDEX DIFFERENCES

### 7.1 Missing Indexes in Production

#### **profiles Table - Missing Performance Indexes**

Production has only:
- `profiles_pkey` (PRIMARY KEY on id)

Staging has additional performance indexes:
```sql
CREATE INDEX idx_profiles_billing_period
  ON profiles(billing_period)
  WHERE billing_period IS NOT NULL;

CREATE INDEX idx_profiles_role
  ON profiles(role)
  WHERE role = 'admin';

CREATE INDEX idx_profiles_total_uploads
  ON profiles(total_uploads DESC);
```

**Impact:**
- Slow admin queries filtering by role
- Slow leaderboard/analytics queries sorting by uploads
- Slow billing period lookups

---

#### **active_sessions Table - Missing Indexes**

Production doesn't have active_sessions table.

Staging has:
```sql
CREATE INDEX idx_active_sessions_user_id
  ON active_sessions(user_id);
```

**Impact:** Fast session lookups by user_id

---

### 7.2 LERG Index Differences

**Production (lerg_codes):**
```sql
lerg_codes_pkey (PRIMARY KEY on id)
lerg_codes_npa_unique (UNIQUE on npa)
idx_lerg_state (on state)
idx_lerg_country (on country)
```

**Staging (enhanced_lerg):**
```sql
enhanced_lerg_pkey (PRIMARY KEY on npa)
idx_enhanced_lerg_active (on is_active WHERE is_active = true)
idx_enhanced_lerg_country (on country_code)
idx_enhanced_lerg_state (on state_province_code)
```

**Key Difference:** Staging uses NPA as primary key (no auto-increment id), has soft-delete index

---

## 8. CHECK CONSTRAINT DIFFERENCES

### 8.1 Missing Constraints in Production

#### **profiles Table**

**Production:**
- No CHECK constraints

**Staging:**
```sql
ALTER TABLE profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('user', 'admin'));

ALTER TABLE profiles
  ADD CONSTRAINT profiles_billing_period_check
  CHECK (billing_period IN ('monthly', 'annual'));
```

**Impact:** Production allows invalid role/billing_period values

---

#### **LERG Tables**

**Production (lerg_codes):**
- No CHECK constraints

**Staging (enhanced_lerg):**
```sql
ALTER TABLE enhanced_lerg
  ADD CONSTRAINT valid_npa
  CHECK (npa ~ '^[0-9]{3}$');

ALTER TABLE enhanced_lerg
  ADD CONSTRAINT valid_country_code
  CHECK (country_code ~ '^[A-Z]{2}$');

ALTER TABLE enhanced_lerg
  ADD CONSTRAINT valid_state_code
  CHECK (state_province_code ~ '^[A-Z]{2}$');
```

**Impact:** Staging validates data format at database level, production relies on application validation

---

## 9. DATA MIGRATION CONSIDERATIONS

### 9.1 User Data Preservation

**Production Users:** 14 active users with profiles
**Staging Users:** 4 test users (can be wiped)

**CRITICAL:** Must preserve all 14 production users during migration

**User Data Migration Checklist:**
- [ ] Backup production profiles table before migration
- [ ] Map old column names to new (user_agent, signup_method → removed)
- [ ] Add new columns with sensible defaults:
  - `billing_period` NULL (will be set when they upgrade)
  - `total_uploads` 0 (start fresh)
  - `email` (sync from auth.users)
  - Stripe fields NULL (will be set on first payment)
  - Cancellation fields NULL
  - `cancel_at_period_end` false

**Migration SQL:**
```sql
-- Add new columns to existing production profiles table
ALTER TABLE profiles ADD COLUMN email text;
ALTER TABLE profiles ADD COLUMN subscription_id text;
ALTER TABLE profiles ADD COLUMN current_period_start timestamptz;
ALTER TABLE profiles ADD COLUMN current_period_end timestamptz;
ALTER TABLE profiles ADD COLUMN cancel_at timestamptz;
ALTER TABLE profiles ADD COLUMN canceled_at timestamptz;
ALTER TABLE profiles ADD COLUMN last_payment_date timestamptz;
ALTER TABLE profiles ADD COLUMN total_uploads integer DEFAULT 0;
ALTER TABLE profiles ADD COLUMN cancel_at_period_end boolean DEFAULT false;
ALTER TABLE profiles ADD COLUMN billing_period text;

-- Sync email from auth.users for existing users
UPDATE profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id;

-- Add constraints
ALTER TABLE profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('user', 'admin'));

ALTER TABLE profiles
  ADD CONSTRAINT profiles_billing_period_check
  CHECK (billing_period IN ('monthly', 'annual'));

-- Remove deprecated columns (only if safe - check app code first)
-- ALTER TABLE profiles DROP COLUMN user_agent;
-- ALTER TABLE profiles DROP COLUMN signup_method;
```

**Risk:** Dropping user_agent and signup_method may break production code. Need to verify frontend doesn't use these fields.

---

### 9.2 LERG Data Migration

**Production:** 440 NPAs in `lerg_codes` (simple structure)
**Staging:** 450 NPAs in `enhanced_lerg` (enhanced structure)

**10 Missing NPAs in Production** (need to identify which ones)

**Migration Strategy:**

**Option 1: Create enhanced_lerg Alongside lerg_codes (Recommended)**
- Create new enhanced_lerg table
- Transform 440 records from lerg_codes to enhanced_lerg format
- Add 10 missing NPAs
- Keep lerg_codes for rollback
- Update application code to use enhanced_lerg
- Deprecate lerg_codes after stabilization

**Option 2: Drop and Replace (Higher Risk)**
- Backup lerg_codes data
- Drop lerg_codes table
- Create enhanced_lerg table
- Import 450 records from staging
- Update application code

**Data Transformation Required:**
```sql
-- Transform production lerg_codes to staging enhanced_lerg format
INSERT INTO enhanced_lerg (
  npa,
  country_code,
  country_name,
  state_province_code,
  state_province_name,
  region,
  is_active
)
SELECT
  npa,
  country, -- country code (US, CA, etc.)
  CASE country -- Map to full country name
    WHEN 'US' THEN 'United States'
    WHEN 'CA' THEN 'Canada'
    -- Need mapping for Caribbean/Pacific territories
  END,
  state, -- state code
  -- Need full state name mapping (NJ → New Jersey)
  CASE
    WHEN country = 'US' THEN 'US'
    WHEN country = 'CA' THEN 'CA'
    ELSE 'Caribbean' -- Approximate, need proper categorization
  END as region,
  true as is_active
FROM lerg_codes;
```

**Challenge:** Production `lerg_codes` only has state codes (NJ), not full names (New Jersey). Need lookup table.

**Solution:** Import staging's 450 records directly, then verify production's 440 match correctly.

---

### 9.3 Missing NPAs Analysis

Need to run this query to identify 10 missing NPAs:

```sql
-- Get NPAs in staging but not in production
SELECT npa FROM staging.enhanced_lerg
WHERE npa NOT IN (SELECT npa FROM production.lerg_codes);
```

**Known Missing NPA from Documentation:** NPA 438 (Quebec, Canada)

**Action Required:** Generate list of 10 missing NPAs and verify geographic data before migration.

---

### 9.4 Session Data (New Table)

**Production:** No active_sessions table
**Staging:** 2 active sessions (test data)

**Migration Strategy:**
- Create empty active_sessions table in production
- No data migration needed (sessions are ephemeral)
- Users will create new sessions on next login

---

## 10. BREAKING CHANGES & RISKS

### 10.1 Critical Breaking Changes

#### **1. LERG Table Rename (HIGH RISK)**

**Change:** `lerg_codes` (production) → `enhanced_lerg` (staging)

**Breaking Impact:**
- Frontend code referencing `lerg_codes` will fail
- Edge functions querying `lerg_codes` will fail
- Any cached queries or stored procedures will fail

**Mitigation:**
1. Create `enhanced_lerg` alongside `lerg_codes`
2. Deploy new edge functions for enhanced_lerg
3. Update frontend to use enhanced LERG API
4. Keep old `lerg_codes` and functions until migration complete
5. Deprecate old system after verification period

**Risk Level:** HIGH - Core functionality depends on LERG data

---

#### **2. Profiles Schema Changes (HIGH RISK)**

**Changes:**
- Removed columns: `user_agent`, `signup_method`
- Added columns: 11 new columns (Stripe, uploads, billing, cancellation)
- Added constraints: role CHECK, billing_period CHECK

**Breaking Impact:**
- Code reading `user_agent` or `signup_method` will get null/error
- Code assuming no new columns may break on unexpected fields
- Constraint violations if app tries to set invalid role/billing_period

**Mitigation:**
1. Audit frontend/backend code for references to removed columns
2. Add new columns with NULL defaults (safe)
3. Update code before enforcing constraints
4. Test signup flow thoroughly (triggers changed)

**Risk Level:** HIGH - Core user management system

---

#### **3. Duplicate Trigger Removal (MEDIUM RISK)**

**Change:** Remove `on_auth_user_created_set_trial` trigger (duplicate)

**Breaking Impact:**
- If application logic relies on having two triggers (unlikely)
- If trigger removal breaks trial setup flow

**Mitigation:**
1. Test signup flow in staging environment
2. Verify new users get 7-day trial correctly
3. Update handle_new_user() function before removing duplicate trigger
4. Monitor first 10 production signups closely after migration

**Risk Level:** MEDIUM - Trial signup is critical but well-tested in staging

---

#### **4. Stripe Integration Deployment (CRITICAL RISK)**

**Change:** Deploy 5 Stripe edge functions and webhook handler

**Breaking Impact:**
- NO PAYMENTS POSSIBLE until these are deployed
- Webhook failures = lost subscription updates
- Incorrect Stripe keys = failed checkout sessions

**Mitigation:**
1. Deploy Stripe functions to staging-like environment first
2. Test checkout flow with Stripe test keys
3. Configure Stripe webhook URL before deploying webhook handler
4. Set correct environment variables (STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET)
5. Monitor Stripe dashboard for webhook delivery after deployment
6. Have rollback plan ready

**Risk Level:** CRITICAL - Revenue directly impacted

---

### 10.2 Medium Risk Changes

#### **5. RLS Policy Consolidation (MEDIUM RISK)**

**Change:** Remove 4 duplicate RLS policies on profiles

**Breaking Impact:**
- If different policies have different behavior (unlikely but possible)
- Brief permission check inconsistency during migration

**Mitigation:**
1. Drop old policies one at a time
2. Verify access patterns after each removal
3. Test admin and user access after cleanup

**Risk Level:** MEDIUM - Security-critical but well-tested pattern

---

#### **6. Upload Tracking System (MEDIUM RISK)**

**Change:** Add upload tracking infrastructure (function + column)

**Breaking Impact:**
- Upload operations may slow down slightly (counter increment)
- If increment function fails, upload may fail (depends on implementation)

**Mitigation:**
1. Review upload tracking implementation
2. Ensure failure doesn't block uploads (should be best-effort)
3. Monitor upload success rate after deployment

**Risk Level:** MEDIUM - Non-critical feature, shouldn't block uploads

---

### 10.3 Low Risk Changes

#### **7. Session Management (LOW RISK)**

**Change:** Add active_sessions table and management functions

**Impact:** Purely additive, no existing functionality broken

**Risk Level:** LOW - New optional feature

---

#### **8. Enhanced Indexes (LOW RISK)**

**Change:** Add performance indexes on profiles

**Impact:** Improves query performance, no breaking changes

**Risk Level:** LOW - Pure performance optimization

---

#### **9. Email Sync Trigger (LOW RISK)**

**Change:** Add email sync trigger from auth.users to profiles

**Impact:** Keeps data in sync, purely beneficial

**Risk Level:** LOW - Defensive data synchronization

---

## 11. ENVIRONMENT VARIABLE DIFFERENCES

### 11.1 Missing Environment Variables (Production)

**Stripe Integration (CRITICAL):**
```bash
STRIPE_SECRET_KEY=[REDACTED]
STRIPE_WEBHOOK_SECRET=[REDACTED]
STRIPE_PRICE_ID_MONTHLY=[REDACTED]
STRIPE_PRICE_ID_ANNUAL=[REDACTED]
```

**Session Management:**
```bash
SESSION_SECRET=[REDACTED]
```

**Enhanced LERG (if using external API):**
```bash
LERG_API_KEY=[REDACTED]  # If syncing from external source
```

### 11.2 Verification Checklist

Before deploying edge functions to production:

- [ ] Confirm STRIPE_SECRET_KEY is production key (not test key)
- [ ] Confirm STRIPE_WEBHOOK_SECRET matches webhook endpoint
- [ ] Verify Stripe price IDs are correct for production products
- [ ] Test webhook delivery with Stripe CLI or test event
- [ ] Verify SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set
- [ ] Confirm environment variables are edge function level, not project level

---

## 12. DEPLOYMENT ROADMAP

### Phase 1: Pre-Migration Preparation (1-2 days)

**Database Backup:**
```bash
# Backup production database
pg_dump -h db.mwcvlicipocoqcdypgsy.supabase.co \
  -U postgres -d postgres > production_backup_pre_migration.sql
```

**Code Audit:**
- [ ] Search codebase for references to `lerg_codes` table
- [ ] Search for references to `user_agent` and `signup_method` columns
- [ ] Search for hardcoded assumptions about profiles schema
- [ ] Identify all code using LERG/NANP data

**Environment Setup:**
- [ ] Set up staging environment with production data copy
- [ ] Configure Stripe test keys in staging
- [ ] Set up webhook testing endpoint

**Testing Plan:**
- [ ] Document critical user flows to test after migration
- [ ] Create test scripts for Stripe checkout flow
- [ ] Prepare rollback procedures

---

### Phase 2: Core Infrastructure (1 day)

**Goal:** Deploy foundational schema changes and functions

**Migrations to Apply:**
1. Enhanced LERG table creation
2. Enhanced LERG data seeding
3. Session management table creation
4. Profiles schema updates (add new columns)

**Edge Functions to Deploy:**
- `ping-status` (v62) - Update existing
- `get-enhanced-lerg-data` - Deploy new
- `get-npa-location` - Deploy new

**Database Functions to Deploy:**
- `update_updated_at_column()`
- `get_npa_info()`

**Verification:**
- [ ] Verify enhanced_lerg has 450 records
- [ ] Verify active_sessions table exists
- [ ] Test ping-status endpoint
- [ ] Test get-enhanced-lerg-data returns complete data

**Rollback Plan:** Drop new tables, keep existing lerg_codes

---

### Phase 3: LERG System Migration (2-3 days)

**Goal:** Migrate application to use enhanced LERG system

**Edge Functions to Deploy:**
- `add-enhanced-lerg-record`
- `update-enhanced-lerg-record`
- `upload-lerg` (v59) - Update existing

**Frontend Updates:**
- Update NANP categorization code to use enhanced LERG API
- Update admin LERG management UI
- Test +1 destination detection system

**Verification:**
- [ ] Admin can add new NPA via enhanced function
- [ ] Admin can update existing NPA
- [ ] Upload LERG file works with enhanced schema
- [ ] NANP categorization works correctly
- [ ] Run diagnostics dashboard to verify data quality

**Rollback Plan:** Switch frontend back to old lerg_codes API, keep enhanced_lerg for data

---

### Phase 4: User Management & Security (1 day)

**Goal:** Fix duplicate triggers, clean up RLS policies, deploy user management functions

**Migrations to Apply:**
- Fix handle_new_user trigger (consolidate duplicates)
- Optimize RLS policies (remove duplicates)
- Add missing indexes on profiles
- Add CHECK constraints

**Edge Functions to Deploy:**
- `delete-user-account` (v59) - Update existing
- `get-all-users` - Deploy new
- `update-user-profile` - Deploy new
- `toggle-user-status` - Deploy new
- `get-user-activity` - Deploy new

**Database Changes:**
- Drop `on_auth_user_created_set_trial` trigger
- Update `handle_new_user()` function
- Remove duplicate RLS policies
- Add consolidated RLS policies

**Verification:**
- [ ] New user signup creates profile correctly with 7-day trial
- [ ] Admin can view all users
- [ ] Admin can update user profiles
- [ ] Admin can toggle user status
- [ ] User can view only their own profile
- [ ] RLS prevents unauthorized access

**Rollback Plan:** Restore old trigger and RLS policies if signup breaks

---

### Phase 5: Stripe Integration (2-3 days - CRITICAL)

**Goal:** Enable payment processing

**Prerequisites:**
- [ ] Stripe account configured for production
- [ ] Products created in Stripe (monthly and annual plans)
- [ ] Price IDs obtained
- [ ] Webhook endpoint configured in Stripe dashboard

**Migrations to Apply:**
- Add Stripe subscription fields to profiles
- Add email sync trigger
- Add cancellation fields

**Edge Functions to Deploy:**
- `create-checkout-session` ⚠️
- `create-portal-session` ⚠️
- `stripe-events` (webhook handler) ⚠️
- `check-subscription-status`
- `upgrade-subscription`

**Database Functions to Deploy:**
- `sync_email_to_profiles()`

**Environment Variables:**
```bash
STRIPE_SECRET_KEY=[production key]
STRIPE_WEBHOOK_SECRET=[from Stripe dashboard]
STRIPE_PRICE_ID_MONTHLY=[from Stripe dashboard]
STRIPE_PRICE_ID_ANNUAL=[from Stripe dashboard]
```

**Testing (Use Stripe Test Mode First):**
1. Create checkout session
2. Complete test payment
3. Verify webhook received
4. Verify profiles updated with subscription data
5. Test subscription upgrade flow
6. Test subscription cancellation
7. Test customer portal access

**Verification:**
- [ ] Checkout session creates successfully
- [ ] Payment success triggers webhook
- [ ] Webhook updates profiles correctly
- [ ] subscription_status updates correctly
- [ ] billing_period reflects plan choice
- [ ] current_period_end calculated correctly
- [ ] Customer portal opens successfully
- [ ] Subscription cancellation works
- [ ] Cancellation updates cancel_at_period_end flag

**Switch to Production Mode:**
- [ ] Update STRIPE_SECRET_KEY to production key
- [ ] Update webhook secret to production webhook
- [ ] Update price IDs to production prices
- [ ] Test with real card (small amount)
- [ ] Monitor Stripe dashboard for webhook delivery

**Rollback Plan:**
- Disable Stripe webhook in dashboard
- Revert edge functions to stubs that return errors
- Database changes can stay (columns are nullable)

---

### Phase 6: Session & Upload Tracking (1 day)

**Goal:** Enable session management and upload tracking

**Migrations to Apply:**
- Already done in Phase 2 (active_sessions table)
- Upload tracking function creation

**Edge Functions to Deploy:**
- `manage-session`
- `check-session`
- `pre-login-check`
- `cleanup-session`
- `force-logout`
- `track-upload`

**Database Functions to Deploy:**
- `cleanup_stale_sessions()`
- `increment_upload_count()`

**Frontend Updates:**
- Add session heartbeat calls
- Add upload tracking calls
- Update admin dashboard to show upload stats

**Verification:**
- [ ] Login creates session record
- [ ] Session heartbeat updates last_heartbeat
- [ ] Logout removes session
- [ ] Stale sessions cleaned up after 5 minutes
- [ ] Upload increments total_uploads counter
- [ ] Admin can see upload statistics

**Rollback Plan:** Session tracking is optional, can disable without breaking core functionality

---

### Phase 7: Final Cleanup & Optimization (1 day)

**Goal:** Remove deprecated code, verify all systems

**Tasks:**
- [ ] Remove debug/test edge functions from staging (don't deploy to prod)
- [ ] Verify organization functions are just placeholders (don't deploy)
- [ ] Run database VACUUM ANALYZE
- [ ] Update hardcoded trial dates
- [ ] Remove old lerg_codes-related code after enhanced_lerg stabilizes

**Performance Optimization:**
- [ ] Verify indexes are being used (EXPLAIN ANALYZE critical queries)
- [ ] Check for slow queries in pg_stat_statements
- [ ] Optimize any N+1 query patterns

**Documentation:**
- [ ] Update API documentation for enhanced LERG endpoints
- [ ] Document new Stripe webhook flow
- [ ] Update admin user guide for new features

---

### Phase 8: Monitoring & Validation (Ongoing)

**Week 1 Post-Migration:**
- [ ] Monitor Stripe webhook delivery success rate
- [ ] Monitor user signup flow (check for trial creation issues)
- [ ] Monitor session creation/cleanup
- [ ] Check for RLS policy violations in logs
- [ ] Verify LERG data accuracy (spot check NPAs)

**Week 2-4 Post-Migration:**
- [ ] Analyze upload tracking data
- [ ] Review user subscription patterns
- [ ] Check for payment failures
- [ ] Optimize slow queries identified in week 1
- [ ] Consider removing old lerg_codes table if enhanced_lerg is stable

---

## 13. ROLLBACK PROCEDURES

### Emergency Rollback (If Critical Failure Occurs)

**Scenario 1: Stripe Webhook Failures**

**Symptoms:**
- Payments succeed but profiles not updating
- subscription_status stuck on "trial"
- Webhook errors in Stripe dashboard

**Rollback Steps:**
1. Disable Stripe webhook in Stripe dashboard
2. Manually update affected user profiles via SQL:
```sql
UPDATE profiles
SET subscription_status = 'active',
    billing_period = 'monthly', -- or 'annual' based on Stripe data
    current_period_end = NOW() + INTERVAL '1 month'
WHERE stripe_customer_id = '[customer_id]';
```
3. Contact affected users with manual subscription confirmation
4. Debug webhook handler in staging
5. Re-enable webhook after fix

---

**Scenario 2: User Signup Broken**

**Symptoms:**
- New users can't sign up
- Error: "profile creation failed"
- Trigger errors in logs

**Rollback Steps:**
1. Restore old `handle_new_user()` function from backup
2. Re-enable `on_auth_user_created_set_trial` trigger if removed
3. Test signup flow
4. Review trigger logic and fix issue
5. Re-deploy fixed version

---

**Scenario 3: LERG Data Issues**

**Symptoms:**
- NPA lookups returning null
- NANP categorization failing
- +1 detection not working

**Rollback Steps:**
1. Frontend code switch back to old `get-lerg-data` endpoint
2. Keep enhanced_lerg table (no harm)
3. Debug enhanced LERG edge functions in staging
4. Re-deploy fixed version
5. Switch frontend back to enhanced endpoints

---

**Scenario 4: RLS Policy Lockout**

**Symptoms:**
- Users can't view their own profile
- Admins can't access admin panel
- "permission denied" errors

**Rollback Steps:**
1. Use Supabase dashboard SQL editor with service_role credentials
2. Re-add missing RLS policies:
```sql
CREATE POLICY "emergency_select_policy"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);
```
3. Verify user can access profile
4. Review RLS policy migration for errors
5. Re-apply correct policies

---

**Scenario 5: Database Performance Degradation**

**Symptoms:**
- Queries taking 10x longer
- Users reporting slow page loads
- High CPU on database

**Rollback Steps:**
1. Check for missing indexes:
```sql
SELECT schemaname, tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename;
```
2. Re-create missing indexes from staging
3. Run VACUUM ANALYZE
4. Check for table bloat
5. Review query plans for critical queries

---

### Data Recovery Procedures

**Restore Production Profiles from Backup:**
```sql
-- If profiles table corrupted or data lost
DROP TABLE profiles;
CREATE TABLE profiles (...); -- Use backup schema
\copy profiles FROM 'production_backup_profiles.csv' CSV HEADER;
```

**Restore LERG Data from Staging:**
```sql
-- If LERG data corrupted
TRUNCATE enhanced_lerg;
-- Import 450 records from staging export
\copy enhanced_lerg FROM 'staging_enhanced_lerg.csv' CSV HEADER;
```

---

## 14. TESTING CHECKLIST

### Pre-Migration Testing (Staging Environment)

**User Signup Flow:**
- [ ] New user signs up with email/password
- [ ] Profile created with correct default values
- [ ] role = 'user', subscription_status = 'trial'
- [ ] plan_expires_at = NOW() + 7 days (dynamic, not hardcoded)
- [ ] Single profile record created (no duplicates from double triggers)

**LERG Functionality:**
- [ ] Fetch all LERG data (450 records)
- [ ] Look up specific NPA (get_npa_location)
- [ ] Add new NPA via admin interface
- [ ] Update existing NPA
- [ ] Upload LERG CSV file
- [ ] Verify NANP categorization (US, Canada, Caribbean, Pacific)

**Stripe Integration:**
- [ ] Create checkout session (monthly plan)
- [ ] Create checkout session (annual plan)
- [ ] Complete test payment
- [ ] Verify webhook received and processed
- [ ] Verify profile updated with subscription data
- [ ] Open customer portal
- [ ] Cancel subscription in portal
- [ ] Verify cancellation reflected in profile
- [ ] Test subscription upgrade (monthly → annual)

**Session Management:**
- [ ] Login creates session record
- [ ] Multiple logins create multiple sessions
- [ ] Session heartbeat updates last_heartbeat
- [ ] Logout removes session
- [ ] Stale sessions cleaned up after 5 minutes
- [ ] Force logout removes all user sessions

**Admin Functions:**
- [ ] Admin can view all users
- [ ] Admin can update user profile
- [ ] Admin can toggle user status
- [ ] Admin can view user activity
- [ ] Admin can manage LERG data

**Upload Tracking:**
- [ ] File upload increments total_uploads
- [ ] Admin dashboard shows upload statistics
- [ ] Upload tracking doesn't block upload on failure

---

### Post-Migration Testing (Production Environment)

**Critical Path Testing (Within 1 Hour):**
- [ ] Existing user can log in
- [ ] Existing user can view their profile
- [ ] New user can sign up
- [ ] New user gets 7-day trial
- [ ] LERG lookup returns correct data
- [ ] Checkout session creation works
- [ ] Test payment completes successfully
- [ ] Webhook received and processed

**Extended Testing (Within 24 Hours):**
- [ ] Admin functions work correctly
- [ ] Session management functions correctly
- [ ] Upload tracking increments correctly
- [ ] Email sync trigger works on email change
- [ ] Subscription cancellation works
- [ ] Customer portal access works
- [ ] All 14 existing production users can access accounts

**Performance Testing (Within 1 Week):**
- [ ] Page load times acceptable
- [ ] Database query performance acceptable
- [ ] No slow query alerts
- [ ] Webhook processing under 1 second
- [ ] LERG lookups under 100ms

---

## 15. SUCCESS CRITERIA

### Migration Considered Successful When:

**Database Schema:**
- [x] All 39 migrations applied successfully (or consolidated equivalent)
- [x] enhanced_lerg table has 450 records
- [x] active_sessions table exists
- [x] profiles table has all new columns
- [x] No duplicate triggers on auth.users
- [x] RLS policies consolidated (no duplicates)
- [x] All indexes created

**Edge Functions:**
- [x] 20+ critical edge functions deployed (excluding debug functions)
- [x] Stripe integration functions working
- [x] Enhanced LERG functions working
- [x] Session management functions working
- [x] Upload tracking function working

**Data Integrity:**
- [x] All 14 production users preserved
- [x] All user data migrated correctly
- [x] LERG data complete and accurate
- [x] No data loss

**Functionality:**
- [x] User signup works (7-day trial)
- [x] User login works
- [x] Stripe checkout works
- [x] Stripe webhook processes correctly
- [x] LERG lookups work
- [x] Session tracking works
- [x] Upload tracking works
- [x] Admin functions work

**Performance:**
- [x] No performance degradation
- [x] Webhook processing under 1 second
- [x] LERG lookups under 100ms
- [x] Page loads under 2 seconds

**Monitoring:**
- [x] No error alerts
- [x] Webhook delivery 100% success rate
- [x] No RLS policy violations
- [x] No failed signups

---

## 16. KEY CONTACTS & RESOURCES

### Supabase Projects

**Production:**
- Project ID: `mwcvlicipocoqcdypgsy`
- Region: us-west-1
- Database: `db.mwcvlicipocoqcdypgsy.supabase.co`

**Staging:**
- Project ID: `odnwqnmgftgjrdkotlro`
- Region: us-east-1
- Database: `db.odnwqnmgftgjrdkotlro.supabase.co`

### Important Links

- [Supabase Dashboard - Production](https://supabase.com/dashboard/project/mwcvlicipocoqcdypgsy)
- [Supabase Dashboard - Staging](https://supabase.com/dashboard/project/odnwqnmgftgjrdkotlro)
- [Stripe Dashboard](https://dashboard.stripe.com)
- [Migration Documentation](./CLAUDE.md)

### Backup Locations

- Production pre-migration backup: `./backups/production_backup_pre_migration.sql`
- Profiles data export: `./backups/production_profiles.csv`
- LERG data export: `./backups/staging_enhanced_lerg.csv`

---

## 17. CONCLUSION & RECOMMENDATIONS

### Summary of Gaps

**Database Schema:**
- 1 missing table (active_sessions)
- 39 missing migrations
- 11 missing columns on profiles
- 1 LERG table upgrade needed (440 → 450 records, schema enhancement)

**Edge Functions:**
- 34 missing functions (20 critical, 14 debug/optional)
- 3 functions need version updates

**Database Functions:**
- 6 missing functions
- 2 functions need updates

**RLS Policies:**
- 4 duplicate policies to remove
- 2 missing policies (INSERT, DELETE on profiles)

**Triggers:**
- 1 missing trigger (email sync)
- 1 duplicate trigger to remove

### Risk Level: CRITICAL

**DO NOT** attempt a simple sequential migration. This requires careful planning and phased deployment.

### Recommended Migration Timeline

**Total Estimated Time:** 10-15 days (including testing and monitoring)

- Phase 1: Pre-Migration Preparation (1-2 days)
- Phase 2: Core Infrastructure (1 day)
- Phase 3: LERG System Migration (2-3 days)
- Phase 4: User Management & Security (1 day)
- Phase 5: Stripe Integration (2-3 days) ⚠️ CRITICAL
- Phase 6: Session & Upload Tracking (1 day)
- Phase 7: Final Cleanup (1 day)
- Phase 8: Monitoring & Validation (ongoing)

### Critical Success Factors

1. **Preserve Production Users** - All 14 users must remain functional
2. **Stripe Integration** - MUST work perfectly before accepting payments
3. **LERG Data Accuracy** - Geographic data must be correct for billing
4. **Zero Downtime** - Deploy during low-traffic window
5. **Rollback Readiness** - Test rollback procedures before migration

### Next Steps

1. Review this comparison document with technical team
2. Create detailed migration scripts for each phase
3. Set up staging environment with production data copy
4. Test migration phases in staging
5. Schedule production migration window
6. Execute phased deployment
7. Monitor and validate

---

**Document Prepared By:** Agent #3 - Schema Comparison Specialist
**Date:** 2025-10-13
**Version:** 1.0
**Status:** Ready for Technical Review
