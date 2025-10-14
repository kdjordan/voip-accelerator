# Production Supabase Database Analysis
**VoIP Accelerator - Production Environment**

**Generated:** 2025-10-13
**Project ID:** mwcvlicipocoqcdypgsy
**Project Name:** voip-accelerator-prod
**Region:** us-west-1
**Status:** ACTIVE_HEALTHY
**Database Version:** PostgreSQL 15.8.1.085

---

## Table of Contents
1. [Overview](#overview)
2. [Database Schema](#database-schema)
3. [Tables Detail](#tables-detail)
4. [RLS Policies](#rls-policies)
5. [Custom Functions](#custom-functions)
6. [Triggers](#triggers)
7. [Edge Functions](#edge-functions)
8. [Extensions](#extensions)
9. [Migrations Applied](#migrations-applied)
10. [Indexes](#indexes)
11. [Custom Types & Enums](#custom-types--enums)

---

## Overview

The production database consists of:
- **2 Public Tables** (profiles, lerg_codes)
- **14 Auth Tables** (Supabase auth schema)
- **8 Storage Tables** (Supabase storage schema)
- **6 Edge Functions** deployed
- **3 Custom Functions** (get_my_role, handle_new_user, handle_new_user_trial)
- **2 Custom Triggers** on auth.users
- **19 Migrations** applied
- **12 RLS Policies** (8 on profiles, 4 on lerg_codes)

---

## Database Schema

### Public Schema Tables

#### 1. `profiles` - User Profile Information
**Purpose:** Stores user profile information, extending auth.users
**RLS Enabled:** Yes
**Row Count:** 14 users

**Columns:**
- `id` (uuid, PRIMARY KEY) - References auth.users.id
- `created_at` (timestamptz, DEFAULT now())
- `updated_at` (timestamptz, nullable)
- `role` (text, nullable) - User role (e.g., admin, user, editor)
- `user_agent` (text, nullable)
- `signup_method` (text, nullable) - Method used for signup (email, google, github)
- `stripe_customer_id` (text, nullable) - Stripe customer ID for billing
- `subscription_status` (text, nullable) - Current subscription status (trial, monthly, annual)
- `plan_expires_at` (timestamptz, nullable, DEFAULT '2025-06-01 23:59:59+00') - Plan expiration timestamp

**Foreign Keys:**
- `profiles_id_fkey`: id → auth.users.id (CASCADE DELETE)

**Comments:**
- `id`: References the user ID from auth.users
- `role`: User role, e.g., admin, user, editor
- `signup_method`: Method used for signup, e.g., email, google, github
- `stripe_customer_id`: Stripe customer ID for billing
- `subscription_status`: Current status of the user's subscription (trial, monthly, annual)
- `plan_expires_at`: Timestamp when the user's current plan (trial or paid) expires

---

#### 2. `lerg_codes` - LERG Data Storage
**Purpose:** Stores LERG (Local Exchange Routing Guide) data, primarily NPA information
**RLS Enabled:** Yes
**Row Count:** 440 NPAs

**Columns:**
- `id` (integer, PRIMARY KEY, AUTO-INCREMENT)
- `npa` (char(3), UNIQUE, NOT NULL) - Numbering Plan Area code (area code)
- `state` (char(2), NOT NULL) - State or province abbreviation
- `country` (char(2), NOT NULL) - Country code
- `last_updated` (timestamptz, nullable, DEFAULT CURRENT_TIMESTAMP) - Last update timestamp

**Indexes:**
- `lerg_codes_pkey` - PRIMARY KEY on id
- `lerg_codes_npa_unique` - UNIQUE constraint on npa
- `idx_lerg_state` - Index on state
- `idx_lerg_country` - Index on country

**Comments:**
- `npa`: Numbering Plan Area code (e.g., area code)
- `state`: State or province abbreviation
- `country`: Country code
- `last_updated`: Timestamp of when this record was last updated

---

## RLS Policies

### Profiles Table (8 Policies)

1. **select_own** (SELECT, authenticated)
   - **Purpose:** Users can view their own profile
   - **Condition:** `auth.uid() = id`

2. **select_all** (SELECT, authenticated)
   - **Purpose:** Admins can view all profiles
   - **Condition:** `get_my_role() = 'admin'`

3. **update_own** (UPDATE, authenticated)
   - **Purpose:** Users can update their own profile
   - **Condition:** `auth.uid() = id`

4. **update_any** (UPDATE, authenticated)
   - **Purpose:** Admins can update any profile
   - **Condition:** `get_my_role() = 'admin'`

5. **Allow individual read access** (SELECT, public)
   - **Purpose:** Individual user read access
   - **Condition:** `auth.uid() = id`

6. **Allow individual update access** (UPDATE, public)
   - **Purpose:** Individual user update access
   - **Condition:** `auth.uid() = id`
   - **With Check:** `auth.uid() = id`

7. **Allow admin select access** (SELECT, public)
   - **Purpose:** Admin read access to all profiles
   - **Condition:** `get_my_role() = 'admin'`

8. **Allow admin update access** (UPDATE, public)
   - **Purpose:** Admin update access to all profiles
   - **Condition:** `get_my_role() = 'admin'`
   - **With Check:** `get_my_role() = 'admin'`

### LERG Codes Table (4 Policies)

1. **Allow authenticated select access** (SELECT, authenticated)
   - **Purpose:** Authenticated users can read LERG data
   - **Condition:** `auth.role() = 'authenticated'`

2. **Allow authenticated read access** (SELECT, authenticated)
   - **Purpose:** Authenticated users can read LERG data
   - **Condition:** `true`

3. **Allow admin update access** (UPDATE, public)
   - **Purpose:** Admins can update LERG data
   - **Condition:** `get_my_role() = 'admin'`
   - **With Check:** `get_my_role() = 'admin'`

4. **Allow admin delete access** (DELETE, public)
   - **Purpose:** Admins can delete LERG records
   - **Condition:** `get_my_role() = 'admin'`

---

## Custom Functions

### 1. `get_my_role()` → text
**Purpose:** Returns the role of the current authenticated user
**Security:** SECURITY DEFINER
**Language:** SQL

```sql
CREATE OR REPLACE FUNCTION public.get_my_role()
 RETURNS text
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$function$
```

**Usage:** Used extensively in RLS policies to determine user permissions

---

### 2. `handle_new_user()` → trigger
**Purpose:** Creates a profile entry when a new user signs up
**Security:** SECURITY DEFINER
**Language:** plpgsql

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, role, plan_expires_at, user_agent, signup_method, subscription_status)
  VALUES (
    new.id,
    'user', -- Default role
    '2025-05-23 23:59:59 UTC', -- Fixed plan expiration date for new users
    new.raw_user_meta_data ->> 'user_agent', -- Extract user_agent
    COALESCE(new.raw_app_meta_data ->> 'provider', 'email'), -- Extract provider or default to 'email'
    'trial' -- Set subscription_status to 'trial' for new users
  );
  RETURN new;
END;
$function$
```

**Trigger:** `on_auth_user_created` (AFTER INSERT on auth.users)

---

### 3. `handle_new_user_trial()` → trigger
**Purpose:** Sets up trial period for new users (7 days)
**Security:** SECURITY DEFINER
**Language:** plpgsql

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user_trial()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.profiles (id, plan_expires_at, subscription_status, updated_at)
  VALUES (
    NEW.id,
    NOW() + interval '7 days',  -- 1 week trial
    'trial',
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET
    plan_expires_at = CASE
                        WHEN public.profiles.plan_expires_at IS NULL OR public.profiles.plan_expires_at < NOW()
                        THEN NOW() + interval '7 days'
                        ELSE public.profiles.plan_expires_at
                      END,
    subscription_status = CASE
                            WHEN public.profiles.plan_expires_at IS NULL OR public.profiles.plan_expires_at < NOW()
                            THEN 'trial'
                            ELSE public.profiles.subscription_status
                          END,
    updated_at = NOW()
  ;
  RETURN NEW;
END;
$function$
```

**Trigger:** `on_auth_user_created_set_trial` (AFTER INSERT on auth.users)

**Note:** There appears to be redundancy between `handle_new_user()` and `handle_new_user_trial()`. Both triggers fire on user creation and both attempt to manage the trial period.

---

## Triggers

### Custom Triggers (Public Schema)

1. **on_auth_user_created**
   - **Table:** auth.users
   - **Event:** AFTER INSERT
   - **Function:** handle_new_user()
   - **Purpose:** Creates profile with default role and trial period

2. **on_auth_user_created_set_trial**
   - **Table:** auth.users
   - **Event:** AFTER INSERT
   - **Function:** handle_new_user_trial()
   - **Purpose:** Sets up 7-day trial period for new users

### System Triggers (Storage/Realtime)

- `tr_check_filters` - Realtime subscription filter validation
- `enforce_bucket_name_length_trigger` - Storage bucket name validation
- `objects_delete_delete_prefix` - Storage prefix cleanup on object deletion
- `objects_insert_create_prefix` - Storage prefix creation on object insertion
- `objects_update_create_prefix` - Storage prefix update on object name change
- `update_objects_updated_at` - Storage updated_at timestamp maintenance
- `prefixes_create_hierarchy` - Storage prefix hierarchy creation
- `prefixes_delete_hierarchy` - Storage prefix hierarchy deletion

---

## Edge Functions

### 1. add-lerg-record
**Version:** 3
**Status:** ACTIVE
**JWT Verification:** Enabled
**Purpose:** Add individual LERG records to database
**Entry Point:** /supabase/functions/add-lerg-record/index.ts

### 2. clear-lerg
**Version:** 3
**Status:** ACTIVE
**JWT Verification:** Enabled
**Purpose:** Clear all LERG data from database
**Entry Point:** /supabase/functions/clear-lerg/index.ts

### 3. get-lerg-data
**Version:** 3
**Status:** ACTIVE
**JWT Verification:** Enabled
**Purpose:** Retrieve LERG data from database
**Entry Point:** /supabase/functions/get-lerg-data/index.ts

### 4. upload-lerg
**Version:** 3
**Status:** ACTIVE
**JWT Verification:** Enabled
**Purpose:** Bulk upload LERG data
**Entry Point:** /supabase/functions/upload-lerg/index.ts

### 5. ping-status
**Version:** 3
**Status:** ACTIVE
**JWT Verification:** Enabled
**Purpose:** Database connectivity and health checks
**Entry Point:** /supabase/functions/ping-status/index.ts

### 6. delete-user-account
**Version:** 1
**Status:** ACTIVE
**JWT Verification:** Enabled
**Purpose:** User account deletion functionality
**Entry Point:** /supabase/functions/delete-user-account/index.ts

---

## Extensions

### Installed Extensions

1. **pg_graphql** (v1.5.11) - schema: graphql
   - GraphQL support for PostgreSQL

2. **pgcrypto** (v1.3) - schema: extensions
   - Cryptographic functions

3. **pg_stat_statements** (v1.10) - schema: extensions
   - Track planning and execution statistics of SQL statements

4. **pgjwt** (v0.2.0) - schema: extensions
   - JSON Web Token API for PostgreSQL

5. **uuid-ossp** (v1.1) - schema: extensions
   - Generate universally unique identifiers (UUIDs)

6. **plpgsql** (v1.0) - schema: pg_catalog
   - PL/pgSQL procedural language

7. **supabase_vault** (v0.3.1) - schema: vault
   - Supabase Vault Extension for secrets management

### Available But Not Installed (Notable)

- postgis (v3.3.7) - Spatial/geographic data support
- timescaledb (v2.16.1) - Time-series data optimization
- pg_cron (v1.6) - Job scheduler
- vector (v0.8.0) - Vector data type and similarity search
- http (v1.6) - HTTP client for API calls

---

## Migrations Applied

Total migrations: **19**

1. `20250512013647_profiles_migration` - Initial profiles table
2. `20250512014422_lerg_migration` - Initial LERG codes table
3. `20250512014701_add_admin_rls_to_profiles` - Admin RLS policies
4. `20250512043440_create_profile_on_signup_manual_apply` - Profile creation trigger
5. `20250512044630_update_trial_period_to_fixed_date` - Fixed trial expiration date
6. `20250512053739_set_trial_plan_for_new_users` - Trial plan setup
7. `20250512055114_consolidate_plan_expiration_date` - Plan expiration consolidation
8. `20250516023246_update_trial_expiry_to_june_1_2025` - Trial expiry update to June 1, 2025
9. `20250530043043_rls_profiles_select_own` - RLS: Users select own profile
10. `20250530043048_rls_profiles_update_own` - RLS: Users update own profile
11. `20250530043054_create_get_my_role_function` - get_my_role() function
12. `20250530043059_rls_profiles_admin_select_all` - RLS: Admin select all profiles
13. `20250530043105_rls_profiles_admin_update_any` - RLS: Admin update any profile
14. `20250530043127_rls_for_lerg_codes` - RLS policies for LERG codes
15. `20250530043137_ensure_on_auth_user_created_trigger` - Ensure user creation trigger
16. `20250530043144_update_trial_status_to_trial` - Update trial status field
17. `20250530043151_set_fixed_trial_end_date_june_2025` - Set fixed trial end date
18. `20250530043201_revise_trial_trigger_logic_june_2025` - Revise trial trigger logic
19. `20250530043401_update_trial_periods_july_2025` - Update trial periods to July 2025

**Migration Timeline:**
- Initial setup: May 12, 2025
- RLS policies added: May 30, 2025
- Trial period updates: May-July 2025

---

## Indexes

### Public Schema Indexes

#### profiles Table
- `profiles_pkey` (UNIQUE) - PRIMARY KEY on id

#### lerg_codes Table
- `lerg_codes_pkey` (UNIQUE) - PRIMARY KEY on id
- `lerg_codes_npa_unique` (UNIQUE) - UNIQUE constraint on npa
- `idx_lerg_state` - Index on state (for fast state lookups)
- `idx_lerg_country` - Index on country (for fast country lookups)

### Auth Schema Indexes (Notable)

- `users_pkey` - PRIMARY KEY on auth.users.id
- `users_email_partial_key` - UNIQUE on email (WHERE is_sso_user = false)
- `users_phone_key` - UNIQUE on phone
- `identities_user_id_idx` - Index on user_id for identity lookups
- `sessions_user_id_idx` - Index on user_id for session lookups
- `refresh_tokens_session_id_revoked_idx` - Index for active token lookups

### Storage Schema Indexes (Notable)

- `buckets_pkey` - PRIMARY KEY on storage.buckets.id
- `bname` (UNIQUE) - UNIQUE constraint on bucket name
- `objects_pkey` - PRIMARY KEY on storage.objects.id
- `bucketid_objname` (UNIQUE) - UNIQUE constraint on bucket_id + name

---

## Custom Types & Enums

### Auth Schema Enums

1. **aal_level** - Authentication Assurance Level
   - Values: `aal1`, `aal2`, `aal3`

2. **code_challenge_method** - PKCE code challenge method
   - Values: `s256`, `plain`

3. **factor_type** - MFA factor types
   - Values: `totp`, `webauthn`, `phone`

4. **factor_status** - MFA factor status
   - Values: `unverified`, `verified`

5. **one_time_token_type** - One-time token types
   - Values: `confirmation_token`, `reauthentication_token`, `recovery_token`, `email_change_token_new`, `email_change_token_current`, `phone_change_token`

6. **oauth_client_type** - OAuth client types
   - Values: `public`, `confidential`

7. **oauth_authorization_status** - OAuth authorization status
   - Values: `pending`, `approved`, `denied`, `expired`

8. **oauth_registration_type** - OAuth registration type
   - Values: `dynamic`, `manual`

9. **oauth_response_type** - OAuth response type
   - Values: `code`

### Storage Schema Enums

1. **buckettype** - Storage bucket type
   - Values: `STANDARD`, `ANALYTICS`

### Realtime Schema Enums

1. **action** - Realtime actions
   - Values: `INSERT`, `UPDATE`, `DELETE`, `TRUNCATE`, `ERROR`

2. **equality_op** - Equality operators for filtering
   - Values: `eq`, `neq`, `lt`, `lte`, `gt`, `gte`, `in`

---

## Key Observations & Notes

### 1. Redundant Triggers
There are TWO triggers on `auth.users` for new user creation:
- `on_auth_user_created` → `handle_new_user()`
- `on_auth_user_created_set_trial` → `handle_new_user_trial()`

Both attempt to insert/update the profiles table with trial information. This could cause conflicts or unexpected behavior.

### 2. Trial Period Configuration
Multiple migrations updated the trial period:
- Originally set to fixed date: '2025-05-23 23:59:59 UTC'
- Updated to: '2025-06-01 23:59:59+00'
- `handle_new_user_trial()` uses dynamic 7-day trial: `NOW() + interval '7 days'`

**Current State:** Conflicting trial configurations exist between the two trigger functions.

### 3. RLS Policy Duplication
The profiles table has duplicate RLS policies:
- `select_own` and `Allow individual read access` (same purpose)
- `update_own` and `Allow individual update access` (same purpose)
- `select_all` and `Allow admin select access` (same purpose)
- `update_any` and `Allow admin update access` (same purpose)

This suggests RLS policies were added incrementally without removing old ones.

### 4. LERG Data Structure
The current LERG implementation is **simplified**:
- Only stores: NPA, State, Country
- Missing: City, Latitude, Longitude, Rate Center, OCN, Company
- Total records: 440 NPAs

**Note:** The codebase references an "enhanced LERG" system with more fields, but this is NOT present in production.

### 5. Missing Tables
Based on the codebase documentation, these tables are **NOT** in production:
- `enhanced_lerg` - Enhanced LERG data with geographic details
- `stripe_subscriptions` - Stripe subscription tracking
- `usage_logs` - Usage tracking for upload limits
- `rate_sheets` - Rate sheet storage

**Current State:** User subscription data is stored in the `profiles` table via `stripe_customer_id` and `subscription_status` fields.

### 6. Edge Functions
All 6 edge functions use JWT verification (secure). Notable:
- LERG operations: `add-lerg-record`, `clear-lerg`, `upload-lerg`, `get-lerg-data`
- User management: `delete-user-account`
- Health check: `ping-status`

### 7. Storage Buckets
No storage buckets are configured (0 rows in `storage.buckets`). This suggests file uploads are handled client-side or via external storage.

### 8. User Count
Production has **14 active users** with profiles.

---

## Database Health & Status

**Overall Status:** HEALTHY ✓

- Database Version: PostgreSQL 15.8.1.085 (current stable)
- Region: us-west-1 (US West - Oregon)
- Connection Status: Active
- RLS Enabled: Yes (all public tables)
- Extensions: 7 installed, 82 available
- Migrations: 19 applied successfully

---

## Comparison Readiness

This analysis provides the baseline for comparison with staging environment. Key areas to compare:

1. **Schema Differences** - Table structures, columns, types
2. **Data Differences** - LERG records, migration history
3. **RLS Policy Differences** - Security policy configurations
4. **Function Differences** - Custom function definitions
5. **Trigger Differences** - Trigger logic and configurations
6. **Extension Differences** - Installed vs available extensions
7. **Edge Function Differences** - Deployed functions and versions
8. **Migration Differences** - Applied migrations between environments

---

**End of Production Analysis**
