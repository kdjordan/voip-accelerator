# VoIP Accelerator: Staging to Production Migration Plan

**Version:** 1.0
**Date:** October 13, 2025
**Status:** Ready for Review
**Estimated Duration:** 7-10 days (excluding monitoring period)

---

## 🎯 Executive Summary

### Current State
- **Production Supabase**: 19 migrations, 2 tables (profiles, lerg_codes), 6 edge functions
- **Staging Supabase**: 58 migrations, 3 tables (profiles, enhanced_lerg, active_sessions), 40 edge functions
- **Production Users**: 14 beta testers (will be wiped and asked to re-register)
- **Stripe**: Staging uses sandbox mode, production will use live keys

### Migration Scope
- **39 Missing Migrations**: Need to be consolidated and applied selectively
- **1 Missing Table**: active_sessions (session management)
- **11 Missing Profile Columns**: Stripe integration, upload tracking, billing periods
- **LERG System Upgrade**: lerg_codes (440 simple) → enhanced_lerg (450 with full geographic context)
- **34 Missing Edge Functions**: Including 5 critical Stripe payment functions
- **Trigger Cleanup**: Remove duplicate signup triggers causing conflicts
- **RLS Policy Cleanup**: Remove 4 duplicate policies

### Risk Assessment
- **HIGH RISK**: Stripe integration (hardcoded price detection, secret key exposure)
- **MEDIUM RISK**: LERG data migration (table rename, data preservation)
- **MEDIUM RISK**: User data wipe (14 beta testers need clean migration)
- **LOW RISK**: Edge function deployment (tested in staging)
- **LOW RISK**: Session management (new feature, no existing data)

### Timeline Estimate
- **Phase 1**: Pre-Migration Preparation (1-2 days)
- **Phase 2**: Core Infrastructure (1 day)
- **Phase 3**: LERG System Migration (2-3 days)
- **Phase 4**: User Management & Security (1 day)
- **Phase 5**: Stripe Integration (2-3 days) ⚠️ CRITICAL
- **Phase 6**: Session & Upload Tracking (1 day)
- **Phase 7**: Final Cleanup (1 day)
- **Phase 8**: Monitoring & Validation (7 days ongoing)

---

## 📋 Pre-Migration Checklist

### 1. Backups (MANDATORY)
- [ ] Export production Supabase database to SQL dump
  ```bash
  # Via Supabase Dashboard → Database → Backups → Download
  # OR via CLI:
  supabase db dump --project-ref mwcvlicipocoqcdypgsy > production_backup_$(date +%Y%m%d_%H%M%S).sql
  ```
- [ ] Export production auth users list
  ```bash
  # Via Supabase Dashboard → Authentication → Users → Export CSV
  ```
- [ ] Backup production edge function code (already in git, verify)
- [ ] Save current production environment variables
  ```bash
  # Document all Supabase secrets:
  # - STRIPE_SECRET_KEY (current sandbox key)
  # - STRIPE_WEBHOOK_SECRET
  # - Any custom secrets
  ```

### 2. Stripe Configuration
- [ ] Create production Stripe account products (if not exists)
  - VoIP Accelerator Monthly: ~$99/month (verify exact price)
  - VoIP Accelerator Annual: ~$999/year (verify exact price)
- [ ] Get production Stripe price IDs
  ```bash
  # Save these for environment variables:
  VITE_STRIPE_PRICE_MONTHLY_ACCELERATOR=price_[PROD_MONTHLY_ID]
  VITE_STRIPE_PRICE_ANNUAL_ACCELERATOR=price_[PROD_ANNUAL_ID]
  ```
- [ ] Obtain production Stripe API keys
  ```bash
  # Publishable Key: pk_live_...
  # Secret Key: sk_live_...
  ```
- [ ] Configure production Stripe webhook endpoint
  - URL: `https://mwcvlicipocoqcdypgsy.supabase.co/functions/v1/stripe-events`
  - Events to listen for:
    - checkout.session.completed
    - customer.subscription.created
    - customer.subscription.updated
    - customer.subscription.deleted
    - invoice.payment_succeeded
    - invoice.payment_failed
  - [ ] Get webhook signing secret: `whsec_...`

### 3. Beta Tester Communication
- [ ] Send T-7 Days announcement email (see BETA_TESTER_COMMUNICATIONS.md)
- [ ] Send T-2 Days reminder email
- [ ] Prepare "Migration Day" status update template
- [ ] Prepare "Migration Complete" re-registration instructions
- [ ] Create promo code in production Stripe: `BETATESTER2025`
  - Extended 7-day trial
  - Document code for re-registration emails

### 4. Testing Environment Setup
- [ ] Verify staging is fully functional
  ```bash
  npm run build:staging
  # Test critical paths:
  # - User registration → trial setup
  # - Rate sheet upload (US/AZ)
  # - LERG data operations
  # - Stripe checkout (test mode)
  ```
- [ ] Prepare production testing checklist (see Section 7)
- [ ] Set up monitoring dashboard for production
  - Supabase Logs
  - Stripe Dashboard
  - Application health checks

### 5. Code Freeze
- [ ] Merge all staging changes to `dev` branch
- [ ] Code review of migration-critical changes
- [ ] Freeze staging branch (no new features during migration)

---

## 👥 User Data Strategy

### Current Production Users
- **14 Beta Testers** currently in production database
- **Strategy**: Complete wipe and clean re-registration

### Migration Approach: Clean Slate
**Rationale**: Given the extensive schema changes (11 new profile columns, new active_sessions table, LERG system upgrade), attempting to preserve and migrate existing user data introduces significant risk. A clean slate approach is safer and simpler.

### Steps:
1. **T-7 Days**: Send announcement email with:
   - Migration date and time
   - Expectation: All users will need to re-register
   - Benefit: Fresh start with new features
   - Promo code: `BETATESTER2025` (extended trial)
   - FAQ addressing common concerns

2. **T-2 Days**: Send reminder email with:
   - Countdown to migration
   - What to expect on migration day
   - Re-registration instructions (will be sent post-migration)

3. **Migration Day - Before Wipe**:
   - [ ] Export user email list from production
     ```sql
     SELECT
       profiles.id,
       auth.users.email,
       profiles.subscription_status,
       profiles.subscription_plan,
       profiles.plan_expires_at,
       profiles.created_at
     FROM public.profiles
     LEFT JOIN auth.users ON auth.users.id = profiles.id;
     ```
   - [ ] Save export as `production_users_backup_$(date +%Y%m%d).csv`

4. **Migration Day - User Data Wipe**:
   ```sql
   -- ⚠️ CRITICAL: Run this AFTER Phase 2 (Core Infrastructure) is complete
   -- This will cascade delete from active_sessions due to foreign key

   -- Step 1: Delete all profile records (will cascade to active_sessions)
   DELETE FROM public.profiles;

   -- Step 2: Delete all auth users
   -- Note: This must be done via Supabase Dashboard → Authentication → Users
   -- OR via Admin API (requires service role key)
   -- Supabase does not allow direct DELETE from auth.users via SQL
   ```

5. **Post-Migration**:
   - [ ] Send "Migration Complete" email to all 14 beta testers
   - [ ] Include re-registration instructions
   - [ ] Include promo code: `BETATESTER2025`
   - [ ] Provide direct support contact for any issues

### User Communication Timeline
```
T-7 Days:  Pre-announcement email
T-2 Days:  Reminder email
T-0:       Migration begins → Send "Migration in Progress" status update
T+0:       Migration complete → Send "Re-registration Instructions" email
T+1:       Monitor re-registrations, send individual support emails if needed
T+7:       Follow-up email to non-registered users
```

---

## 🚀 Phase 1: Pre-Migration Preparation (1-2 Days)

### Objective
Set up production environment variables, verify backups, and prepare deployment scripts.

### Steps

#### 1.1 Update Production Environment Variables

**Frontend Environment (.env.production)**
```bash
# ⚠️ SECURITY: Remove any secret keys from frontend environment
# NEVER include VITE_STRIPE_SECRET_KEY in frontend

# Stripe Publishable Key (SAFE for frontend)
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_[YOUR_PRODUCTION_KEY]

# Stripe Price IDs (SAFE for frontend)
VITE_STRIPE_PRICE_MONTHLY_ACCELERATOR=price_[YOUR_MONTHLY_PRICE_ID]
VITE_STRIPE_PRICE_ANNUAL_ACCELERATOR=price_[YOUR_ANNUAL_PRICE_ID]

# Supabase (already configured)
VITE_SUPABASE_URL=https://mwcvlicipocoqcdypgsy.supabase.co
VITE_SUPABASE_ANON_KEY=[EXISTING_ANON_KEY]

# Environment indicator
VITE_APP_ENV=production
```

**Supabase Edge Function Secrets**
```bash
# Set these via Supabase Dashboard → Edge Functions → Secrets
# OR via CLI:
supabase secrets set --project-ref mwcvlicipocoqcdypgsy STRIPE_SECRET_KEY=sk_live_[YOUR_KEY]
supabase secrets set --project-ref mwcvlicipocoqcdypgsy STRIPE_WEBHOOK_SECRET=whsec_[YOUR_SECRET]

# Verify secrets are set:
supabase secrets list --project-ref mwcvlicipocoqcdypgsy
```

#### 1.2 Fix Hardcoded Price Detection Logic ⚠️ CRITICAL

**Problem**: Staging edge functions hardcode price detection based on amount:
```typescript
// ❌ BRITTLE: In supabase/functions/stripe-events/index.ts lines 125, 127, 320, 321
if (amountTotal === 9900) { // Hardcoded $99.00
  billingPeriod = 'monthly';
} else if (amountTotal === 99900) { // Hardcoded $999.00
  billingPeriod = 'annual';
}
```

**Solution**: Update price detection to use price IDs from environment variables.

- [ ] Edit `supabase/functions/stripe-events/index.ts`
- [ ] Replace hardcoded amount checks with price ID comparison:

```typescript
// ✅ ROBUST: Use price IDs from Stripe metadata or environment
const monthlyPriceId = Deno.env.get("STRIPE_PRICE_MONTHLY_ACCELERATOR");
const annualPriceId = Deno.env.get("STRIPE_PRICE_ANNUAL_ACCELERATOR");

// In checkout.session.completed handler (around line 125):
const priceId = session.line_items?.data[0]?.price?.id;
let billingPeriod: 'monthly' | 'annual' = 'monthly';

if (priceId === annualPriceId) {
  billingPeriod = 'annual';
} else if (priceId === monthlyPriceId) {
  billingPeriod = 'monthly';
} else {
  console.error(`Unknown price ID: ${priceId}`);
  // Fallback to amount-based detection as last resort
  if (amountTotal >= 50000) { // Anything over $500 is likely annual
    billingPeriod = 'annual';
  }
}

// Similarly update the invoice.payment_succeeded handler (around line 320)
```

- [ ] Add price ID environment variables to edge function:
```bash
supabase secrets set --project-ref mwcvlicipocoqcdypgsy \
  STRIPE_PRICE_MONTHLY_ACCELERATOR=price_[YOUR_MONTHLY_ID]

supabase secrets set --project-ref mwcvlicipocoqcdypgsy \
  STRIPE_PRICE_ANNUAL_ACCELERATOR=price_[YOUR_ANNUAL_ID]
```

- [ ] Test in staging with production price IDs
- [ ] Verify webhook logs show correct billing period detection

#### 1.3 Prepare Migration SQL Scripts

Create a migration scripts directory:
```bash
mkdir -p /Users/indiedev/Desktop/CODE\ PROJECTS/voip-accelerator/migration-scripts
cd migration-scripts
```

We'll create consolidated SQL scripts in the following phases.

#### 1.4 Verification Checklist
- [ ] Production .env.production has NO secret keys
- [ ] Supabase secrets are configured for production Stripe
- [ ] Price detection logic updated and tested in staging
- [ ] Migration scripts directory created
- [ ] Beta tester T-7 days email sent
- [ ] All backups completed (database, auth users, environment vars)

---

## 🏗️ Phase 2: Core Infrastructure (1 Day)

### Objective
Create foundational schema changes: active_sessions table and new profile columns.

### 2.1 Create active_sessions Table

**File**: `migration-scripts/01_create_active_sessions.sql`

```sql
-- Create active_sessions table for session management
CREATE TABLE IF NOT EXISTS public.active_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_token text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_heartbeat timestamptz NOT NULL DEFAULT now(),
  user_agent text,
  ip_address inet,
  browser_info jsonb,
  is_active boolean NOT NULL DEFAULT true,

  -- Indexes for performance
  CONSTRAINT active_sessions_user_id_fkey FOREIGN KEY (user_id)
    REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_active_sessions_user_id
  ON public.active_sessions(user_id);

CREATE INDEX IF NOT EXISTS idx_active_sessions_token
  ON public.active_sessions(session_token);

CREATE INDEX IF NOT EXISTS idx_active_sessions_active
  ON public.active_sessions(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_active_sessions_heartbeat
  ON public.active_sessions(last_heartbeat) WHERE is_active = true;

-- Enable RLS
ALTER TABLE public.active_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only see/modify their own sessions
CREATE POLICY "Users can view their own sessions"
  ON public.active_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessions"
  ON public.active_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions"
  ON public.active_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions"
  ON public.active_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.active_sessions TO authenticated;
GRANT USAGE ON SEQUENCE active_sessions_id_seq TO authenticated;

-- Add helpful comment
COMMENT ON TABLE public.active_sessions IS
  'Tracks active user sessions for concurrent session management and security monitoring';
```

**Apply to Production**:
```bash
# Via Supabase Dashboard → SQL Editor:
# 1. Copy content of 01_create_active_sessions.sql
# 2. Paste into SQL Editor
# 3. Run query
# 4. Verify: Check "active_sessions" appears in Tables list

# OR via CLI (if configured):
supabase db execute --project-ref mwcvlicipocoqcdypgsy \
  --file migration-scripts/01_create_active_sessions.sql
```

### 2.2 Add Missing Profile Columns

**File**: `migration-scripts/02_add_profile_columns.sql`

```sql
-- Add Stripe integration columns
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS subscription_id text,
  ADD COLUMN IF NOT EXISTS current_period_start timestamptz,
  ADD COLUMN IF NOT EXISTS current_period_end timestamptz,
  ADD COLUMN IF NOT EXISTS cancel_at timestamptz,
  ADD COLUMN IF NOT EXISTS canceled_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_payment_date timestamptz,
  ADD COLUMN IF NOT EXISTS cancel_at_period_end boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS billing_period text
    CHECK (billing_period IN ('monthly', 'annual'));

-- Add upload tracking column
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS total_uploads integer DEFAULT 0;

-- Create index on subscription_id for Stripe webhook lookups
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_id
  ON public.profiles(subscription_id) WHERE subscription_id IS NOT NULL;

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email
  ON public.profiles(email);

-- Add helpful comments
COMMENT ON COLUMN public.profiles.subscription_id IS
  'Stripe subscription ID for active subscriptions';
COMMENT ON COLUMN public.profiles.billing_period IS
  'Billing cycle: monthly or annual';
COMMENT ON COLUMN public.profiles.total_uploads IS
  'Total count of rate sheet uploads for analytics';
COMMENT ON COLUMN public.profiles.cancel_at_period_end IS
  'True if subscription is scheduled to cancel at period end';
```

**Apply to Production**:
```bash
# Via Supabase Dashboard → SQL Editor
supabase db execute --project-ref mwcvlicipocoqcdypgsy \
  --file migration-scripts/02_add_profile_columns.sql
```

### 2.3 Update Trial Setup Trigger (Fix Duplicate Issue)

**Problem**: Production has TWO triggers firing on user signup:
1. `on_auth_user_created` → `handle_new_user()` (basic profile creation)
2. `on_auth_user_created_set_trial` → `handle_new_user_trial()` (trial setup with EXPIRED hardcoded date)

**Solution**: Drop the second trigger and update `handle_new_user()` to staging version.

**File**: `migration-scripts/03_fix_trial_triggers.sql`

```sql
-- Drop the duplicate trial setup trigger
DROP TRIGGER IF EXISTS on_auth_user_created_set_trial ON auth.users;

-- Drop the old trial function
DROP FUNCTION IF EXISTS public.handle_new_user_trial();

-- Update handle_new_user() to staging version
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  trial_days integer := 7; -- Default 7-day trial
  trial_end timestamptz;
BEGIN
  -- Calculate trial end date (7 days from now)
  trial_end := now() + (trial_days || ' days')::interval;

  -- Insert new profile with trial settings
  INSERT INTO public.profiles (
    id,
    email,
    subscription_status,
    subscription_plan,
    plan_expires_at,
    total_uploads,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    'trial', -- Start as trial
    'accelerator', -- Default plan
    trial_end, -- Dynamic trial end date
    0, -- Initial upload count
    now(),
    now()
  );

  -- Log the trial setup
  RAISE NOTICE 'New user created: % with trial ending at %', NEW.email, trial_end;

  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- Log error but don't fail user creation
    RAISE WARNING 'Error in handle_new_user for %: %', NEW.email, SQLERRM;
    RETURN NEW;
END;
$$;

-- Verify the trigger exists (should be created by earlier migration, but ensure it's there)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'on_auth_user_created'
    AND tgrelid = 'auth.users'::regclass
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

COMMENT ON FUNCTION public.handle_new_user() IS
  'Creates profile and sets up 7-day trial for new users. Single source of truth for user onboarding.';
```

**Apply to Production**:
```bash
supabase db execute --project-ref mwcvlicipocoqcdypgsy \
  --file migration-scripts/03_fix_trial_triggers.sql
```

### 2.4 Phase 2 Verification

**Test Checklist**:
- [ ] `active_sessions` table exists with correct schema
  ```sql
  \d public.active_sessions
  ```
- [ ] All 11 new columns exist in `profiles` table
  ```sql
  SELECT column_name, data_type
  FROM information_schema.columns
  WHERE table_name = 'profiles' AND table_schema = 'public'
  ORDER BY ordinal_position;
  ```
- [ ] Only ONE trigger fires on auth.users insert
  ```sql
  SELECT tgname, tgtype, tgenabled
  FROM pg_trigger
  WHERE tgrelid = 'auth.users'::regclass;
  -- Should show only: on_auth_user_created
  ```
- [ ] Test user signup in production:
  ```bash
  # Create test user via Supabase Dashboard → Authentication
  # Verify profile is created with trial_end = now() + 7 days
  # Verify NO hardcoded '2025-05-23' date
  ```

---

## 📊 Phase 3: LERG System Migration (2-3 Days)

### Objective
Upgrade from simple `lerg_codes` (440 records) to enhanced `enhanced_lerg` (450 records with full geographic context).

### Strategy
1. Create new `enhanced_lerg` table (don't drop `lerg_codes` yet)
2. Migrate data from `lerg_codes` to `enhanced_lerg`
3. Deploy enhanced LERG edge functions
4. Update frontend to use new table
5. Deprecate `lerg_codes` after stabilization (future cleanup)

### 3.1 Create enhanced_lerg Table

**File**: `migration-scripts/04_create_enhanced_lerg.sql`

```sql
-- Create enhanced_lerg table with full geographic context
CREATE TABLE IF NOT EXISTS public.enhanced_lerg (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  npa text NOT NULL UNIQUE,
  country_code text NOT NULL,
  country_name text NOT NULL,
  state_province_code text,
  state_province_name text,
  category text NOT NULL CHECK (category IN (
    'us-domestic',
    'canadian',
    'caribbean',
    'us-territory'
  )),
  confidence_score integer NOT NULL DEFAULT 100 CHECK (
    confidence_score >= 0 AND confidence_score <= 100
  ),
  source text NOT NULL DEFAULT 'lerg' CHECK (source IN (
    'lerg',
    'manual',
    'inferred'
  )),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- Ensure NPA is 3 digits
  CONSTRAINT npa_format CHECK (npa ~ '^[0-9]{3}$')
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_enhanced_lerg_npa
  ON public.enhanced_lerg(npa);

CREATE INDEX IF NOT EXISTS idx_enhanced_lerg_country
  ON public.enhanced_lerg(country_code);

CREATE INDEX IF NOT EXISTS idx_enhanced_lerg_category
  ON public.enhanced_lerg(category);

CREATE INDEX IF NOT EXISTS idx_enhanced_lerg_active
  ON public.enhanced_lerg(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_enhanced_lerg_confidence
  ON public.enhanced_lerg(confidence_score);

-- Enable RLS
ALTER TABLE public.enhanced_lerg ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Read-only for authenticated users, write for service role
CREATE POLICY "Authenticated users can view enhanced LERG data"
  ON public.enhanced_lerg FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Service role can insert enhanced LERG data"
  ON public.enhanced_lerg FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can update enhanced LERG data"
  ON public.enhanced_lerg FOR UPDATE
  TO service_role
  USING (true);

CREATE POLICY "Service role can delete enhanced LERG data"
  ON public.enhanced_lerg FOR DELETE
  TO service_role
  USING (true);

-- Grant permissions
GRANT SELECT ON public.enhanced_lerg TO authenticated;
GRANT ALL ON public.enhanced_lerg TO service_role;

-- Add helpful comment
COMMENT ON TABLE public.enhanced_lerg IS
  'Enhanced LERG data with full geographic context and confidence scoring for NANP categorization';

COMMENT ON COLUMN public.enhanced_lerg.confidence_score IS
  '0-100 score indicating data quality: 100=authoritative LERG, 80-99=inferred from reliable source, <80=low confidence';

COMMENT ON COLUMN public.enhanced_lerg.source IS
  'Data source: lerg (authoritative), manual (admin override), inferred (programmatic deduction)';
```

**Apply to Production**:
```bash
supabase db execute --project-ref mwcvlicipocoqcdypgsy \
  --file migration-scripts/04_create_enhanced_lerg.sql
```

### 3.2 Migrate Data from lerg_codes to enhanced_lerg

**File**: `migration-scripts/05_migrate_lerg_data.sql`

```sql
-- Migrate existing lerg_codes to enhanced_lerg with enhanced metadata
INSERT INTO public.enhanced_lerg (
  npa,
  country_code,
  country_name,
  state_province_code,
  state_province_name,
  category,
  confidence_score,
  source,
  is_active,
  created_at,
  updated_at
)
SELECT
  npa_nxx AS npa, -- Assuming lerg_codes stores as npa_nxx (e.g., "212")

  -- Country code (default to US if not specified)
  COALESCE(country, 'US') AS country_code,

  -- Country name (map codes to names)
  CASE
    WHEN COALESCE(country, 'US') = 'US' THEN 'United States'
    WHEN COALESCE(country, 'US') = 'CA' THEN 'Canada'
    ELSE 'Unknown'
  END AS country_name,

  -- State/province code (may need to be extracted or mapped)
  state AS state_province_code,

  -- State/province name (may need mapping)
  state AS state_province_name, -- TODO: Add state name mapping if needed

  -- Category (infer from country)
  CASE
    WHEN COALESCE(country, 'US') = 'US' THEN 'us-domestic'
    WHEN COALESCE(country, 'US') = 'CA' THEN 'canadian'
    ELSE 'us-domestic' -- Default assumption
  END AS category,

  -- Confidence score (lower for migrated data, as it lacks full context)
  85 AS confidence_score, -- Moderate confidence for migrated data

  -- Source
  'lerg' AS source,

  -- Active status
  true AS is_active,

  -- Timestamps (preserve original if available, or use now())
  COALESCE(created_at, now()) AS created_at,
  now() AS updated_at

FROM public.lerg_codes
WHERE LENGTH(npa_nxx) = 3 -- Only migrate 3-digit NPAs (not NPA-NXX combinations)
ON CONFLICT (npa) DO NOTHING; -- Skip duplicates if re-running script

-- Log migration results
DO $$
DECLARE
  migrated_count integer;
  total_count integer;
BEGIN
  SELECT COUNT(*) INTO migrated_count FROM public.enhanced_lerg;
  SELECT COUNT(*) INTO total_count FROM public.lerg_codes WHERE LENGTH(npa_nxx) = 3;

  RAISE NOTICE 'LERG Migration Complete: % records migrated from % total NPAs',
    migrated_count, total_count;
END $$;
```

**IMPORTANT**: Review `lerg_codes` schema before running this migration:
```sql
-- Check current lerg_codes structure
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'lerg_codes' AND table_schema = 'public';

-- Preview data to understand format
SELECT * FROM public.lerg_codes LIMIT 10;
```

**Adjust Migration Script** based on actual `lerg_codes` schema. The script above makes assumptions about column names.

**Apply to Production**:
```bash
# First, verify lerg_codes schema
# Then adjust migration script if needed
supabase db execute --project-ref mwcvlicipocoqcdypgsy \
  --file migration-scripts/05_migrate_lerg_data.sql
```

### 3.3 Load Staging LERG Data to Production

**Option A: Export from Staging and Import to Production**

```bash
# Export from staging
supabase db dump --project-ref odnwqnmgftgjrdkotlro \
  --table enhanced_lerg > staging_enhanced_lerg.sql

# Import to production
supabase db execute --project-ref mwcvlicipocoqcdypgsy \
  --file staging_enhanced_lerg.sql
```

**Option B: Use Supabase MCP to Copy Data**

Use the enhanced LERG edge functions to bulk load data (after deploying edge functions in next step).

**Option C: Manual CSV Export/Import**

```sql
-- In Staging: Export to CSV
COPY (
  SELECT * FROM public.enhanced_lerg ORDER BY npa
) TO '/tmp/enhanced_lerg_export.csv' WITH CSV HEADER;

-- Download CSV from staging, then upload to production

-- In Production: Import from CSV
COPY public.enhanced_lerg(
  id, npa, country_code, country_name, state_province_code,
  state_province_name, category, confidence_score, source,
  is_active, created_at, updated_at
)
FROM '/tmp/enhanced_lerg_export.csv' WITH CSV HEADER;
```

**Recommended**: Use Option A (database dump) for accuracy and completeness.

### 3.4 Deploy Enhanced LERG Edge Functions

**Edge Functions to Deploy** (4 total):
1. `get-enhanced-lerg-data` - Fetch complete LERG data with statistics
2. `add-enhanced-lerg-record` - Manual NPA addition with validation
3. `update-enhanced-lerg-record` - Update existing NPAs
4. `get-npa-location` - Fast NPA lookup service

**Deployment Commands**:
```bash
cd /Users/indiedev/Desktop/CODE\ PROJECTS/voip-accelerator

# Deploy all enhanced LERG functions to production
supabase functions deploy get-enhanced-lerg-data \
  --project-ref mwcvlicipocoqcdypgsy

supabase functions deploy add-enhanced-lerg-record \
  --project-ref mwcvlicipocoqcdypgsy

supabase functions deploy update-enhanced-lerg-record \
  --project-ref mwcvlicipocoqcdypgsy

supabase functions deploy get-npa-location \
  --project-ref mwcvlicipocoqcdypgsy

# Verify deployment
supabase functions list --project-ref mwcvlicipocoqcdypgsy
```

**Test Edge Functions**:
```bash
# Test get-enhanced-lerg-data
curl -X POST \
  https://mwcvlicipocoqcdypgsy.supabase.co/functions/v1/get-enhanced-lerg-data \
  -H "Authorization: Bearer [ANON_KEY]" \
  -H "Content-Type: application/json"

# Expected response:
# {
#   "npas": [...450 records...],
#   "statistics": { "total": 450, "usDomestic": X, "canadian": Y, ... }
# }

# Test get-npa-location (example: NPA 212 - New York)
curl -X POST \
  https://mwcvlicipocoqcdypgsy.supabase.co/functions/v1/get-npa-location \
  -H "Authorization: Bearer [ANON_KEY]" \
  -H "Content-Type: application/json" \
  -d '{"npa": "212"}'

# Expected response:
# {
#   "npa": "212",
#   "country_code": "US",
#   "country_name": "United States",
#   "state_province_code": "NY",
#   "state_province_name": "New York",
#   "category": "us-domestic",
#   "confidence_score": 100
# }
```

### 3.5 Phase 3 Verification

**Test Checklist**:
- [ ] `enhanced_lerg` table exists with 450 records (or close)
  ```sql
  SELECT COUNT(*) FROM public.enhanced_lerg;
  -- Expected: ~450
  ```
- [ ] All NPAs are 3 digits
  ```sql
  SELECT COUNT(*) FROM public.enhanced_lerg WHERE LENGTH(npa) != 3;
  -- Expected: 0
  ```
- [ ] Category distribution looks correct
  ```sql
  SELECT category, COUNT(*)
  FROM public.enhanced_lerg
  GROUP BY category;
  -- Expected:
  --   us-domestic: ~300
  --   canadian: ~50
  --   caribbean: ~50
  --   us-territory: ~50
  ```
- [ ] Enhanced LERG edge functions deployed and responding
- [ ] Test NPA lookup for known values:
  - 212 (New York, US)
  - 416 (Toronto, Canada)
  - 787 (Puerto Rico, US Territory)
  - 264 (Anguilla, Caribbean)
- [ ] Admin NANP Management interface loads without errors (test after frontend deployment)

---

## 👤 Phase 4: User Management & Security (1 Day)

### Objective
Clean up RLS policies, fix permissions, and ensure secure user data access.

### 4.1 Remove Duplicate RLS Policies

**File**: `migration-scripts/06_cleanup_rls_policies.sql`

```sql
-- Check for duplicate policies on profiles table
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'profiles'
ORDER BY policyname;

-- ⚠️ IMPORTANT: Review the output above before running DROP commands
-- Identify which policies are duplicates and which are the "correct" versions

-- Example cleanup (ADJUST based on your actual duplicate policy names):
-- If you have duplicate "Users can view own profile" policies:

-- Drop old/duplicate policies (example names - verify first!)
DROP POLICY IF EXISTS "Users can view own profile OLD" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile OLD" ON public.profiles;

-- Keep the correct policies (example - verify these exist):
-- "Users can view own profile"
-- "Users can update own profile"
-- "Users can insert own profile"
-- "Users can delete own profile"

-- Ensure correct policies exist (if not, create them)
DO $$
BEGIN
  -- SELECT policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'profiles'
    AND policyname = 'Users can view own profile'
  ) THEN
    CREATE POLICY "Users can view own profile"
      ON public.profiles FOR SELECT
      USING (auth.uid() = id);
  END IF;

  -- UPDATE policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'profiles'
    AND policyname = 'Users can update own profile'
  ) THEN
    CREATE POLICY "Users can update own profile"
      ON public.profiles FOR UPDATE
      USING (auth.uid() = id);
  END IF;

  -- No INSERT policy needed (profile created by trigger on signup)
  -- No DELETE policy needed (users shouldn't delete their own profiles)
END $$;

-- Verify final policy state
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'profiles'
ORDER BY policyname;

-- Expected result: 2 policies
-- 1. "Users can view own profile" - SELECT
-- 2. "Users can update own profile" - UPDATE
```

**Apply to Production**:
```bash
# ⚠️ IMPORTANT: Run the SELECT query first to see current policies
# Then adjust the DROP commands based on actual duplicate names

supabase db execute --project-ref mwcvlicipocoqcdypgsy \
  --file migration-scripts/06_cleanup_rls_policies.sql
```

### 4.2 User Data Wipe (After Phase 2 Complete)

**File**: `migration-scripts/07_wipe_production_users.sql`

```sql
-- ⚠️⚠️⚠️ CRITICAL: This will DELETE ALL user data
-- Only run this AFTER:
-- 1. Phase 2 (Core Infrastructure) is complete
-- 2. Beta testers have been notified via T-7 and T-2 emails
-- 3. User email list has been exported and saved
-- 4. Backups are verified

-- Step 1: Verify you're in the correct database
DO $$
BEGIN
  IF current_database() != 'postgres' THEN
    RAISE EXCEPTION 'Safety check: Expected database name "postgres" but got "%"', current_database();
  END IF;

  -- Additional safety: Check project ref via a custom check
  -- (This assumes you've set a custom application_name or similar)
  RAISE NOTICE 'Running user wipe on database: %', current_database();
END $$;

-- Step 2: Delete all profile records (will cascade to active_sessions)
DO $$
DECLARE
  profile_count integer;
  session_count integer;
BEGIN
  -- Count before deletion
  SELECT COUNT(*) INTO profile_count FROM public.profiles;
  SELECT COUNT(*) INTO session_count FROM public.active_sessions;

  RAISE NOTICE 'About to delete % profiles and % active sessions', profile_count, session_count;

  -- Delete profiles (cascades to active_sessions due to foreign key)
  DELETE FROM public.profiles;

  -- Verify deletion
  SELECT COUNT(*) INTO profile_count FROM public.profiles;
  SELECT COUNT(*) INTO session_count FROM public.active_sessions;

  IF profile_count = 0 AND session_count = 0 THEN
    RAISE NOTICE 'User data wipe successful: All profiles and sessions deleted';
  ELSE
    RAISE WARNING 'User data wipe incomplete: % profiles and % sessions remain',
      profile_count, session_count;
  END IF;
END $$;

-- Step 3: Delete all auth users
-- ⚠️ NOTE: This CANNOT be done via SQL - must use Supabase Dashboard or Admin API
-- Instructions:
-- 1. Go to Supabase Dashboard → Authentication → Users
-- 2. Select all users (checkbox at top)
-- 3. Click "Delete" button
-- 4. Confirm deletion

-- Alternative: Use Supabase Admin API (requires service_role key)
-- See: https://supabase.com/docs/reference/javascript/auth-admin-deleteuser
```

**Apply to Production**:
```bash
# ⚠️ CRITICAL: Triple-check you're targeting production ONLY
# ⚠️ Ensure beta testers have been notified
# ⚠️ Ensure user email list is exported and saved

supabase db execute --project-ref mwcvlicipocoqcdypgsy \
  --file migration-scripts/07_wipe_production_users.sql

# Then manually delete auth users via Dashboard:
# https://supabase.com/dashboard/project/mwcvlicipocoqcdypgsy/auth/users
```

### 4.3 Test User Registration Flow

After wipe, immediately test that new user registration works:

```bash
# Test via production app:
# 1. Go to production URL
# 2. Click "Sign Up"
# 3. Register with test email: test-migration@yourdomain.com
# 4. Verify:
#    - Profile created in public.profiles
#    - subscription_status = 'trial'
#    - plan_expires_at = now() + 7 days (NOT hardcoded expired date)
#    - total_uploads = 0
#    - All new columns exist and are populated correctly

# SQL verification:
SELECT
  id,
  email,
  subscription_status,
  subscription_plan,
  plan_expires_at,
  total_uploads,
  created_at
FROM public.profiles
WHERE email = 'test-migration@yourdomain.com';

-- Expected:
-- subscription_status: 'trial'
-- subscription_plan: 'accelerator'
-- plan_expires_at: ~7 days in future
-- total_uploads: 0
```

### 4.4 Phase 4 Verification

**Test Checklist**:
- [ ] Only 2 RLS policies on profiles table (view, update)
- [ ] No duplicate triggers on auth.users
- [ ] All production users wiped (profiles and auth.users)
- [ ] Test user registration creates profile with correct trial dates
- [ ] Test user can log in successfully
- [ ] Test user can access dashboard without route guard errors
- [ ] active_sessions table is empty (fresh start)

---

## 💳 Phase 5: Stripe Integration (2-3 Days) ⚠️ CRITICAL

### Objective
Deploy Stripe payment edge functions, configure production webhook, and test end-to-end payment flow.

### 5.1 Deploy Stripe Edge Functions

**Edge Functions to Deploy** (5 critical + 1 optional):
1. `create-checkout-session` - Generate Stripe Checkout for subscriptions
2. `create-portal-session` - Customer portal for managing subscriptions
3. `stripe-events` - Webhook handler for Stripe events (MOST CRITICAL)
4. `check-subscription-status` - Verify subscription status
5. `upgrade-subscription` - Handle plan changes
6. (Optional) `cancel-subscription` - Handle cancellations

**Pre-Deployment Checklist**:
- [ ] Production Stripe API keys configured in Supabase secrets
- [ ] Production Stripe price IDs configured in Supabase secrets
- [ ] Price detection logic updated (see Phase 1.2)
- [ ] Webhook endpoint URL ready: `https://mwcvlicipocoqcdypgsy.supabase.co/functions/v1/stripe-events`

**Deployment Commands**:
```bash
cd /Users/indiedev/Desktop/CODE\ PROJECTS/voip-accelerator

# Deploy Stripe functions to production
supabase functions deploy create-checkout-session \
  --project-ref mwcvlicipocoqcdypgsy

supabase functions deploy create-portal-session \
  --project-ref mwcvlicipocoqcdypgsy

supabase functions deploy stripe-events \
  --project-ref mwcvlicipocoqcdypgsy

supabase functions deploy check-subscription-status \
  --project-ref mwcvlicipocoqcdypgsy

supabase functions deploy upgrade-subscription \
  --project-ref mwcvlicipocoqcdypgsy

# Verify deployment
supabase functions list --project-ref mwcvlicipocoqcdypgsy
```

### 5.2 Configure Production Stripe Webhook

**Steps**:

1. **Log into Stripe Production Dashboard**: https://dashboard.stripe.com/

2. **Navigate to Webhooks**: Developers → Webhooks → Add endpoint

3. **Configure Endpoint**:
   - **Endpoint URL**: `https://mwcvlicipocoqcdypgsy.supabase.co/functions/v1/stripe-events`
   - **Description**: VoIP Accelerator Production Webhook
   - **Events to send**:
     ```
     checkout.session.completed
     customer.subscription.created
     customer.subscription.updated
     customer.subscription.deleted
     invoice.payment_succeeded
     invoice.payment_failed
     ```
   - **API Version**: Use latest (or match staging: 2024-04-10)

4. **Save and Get Signing Secret**:
   - After creating webhook, copy the **Signing secret** (starts with `whsec_`)
   - Save this for Supabase secrets configuration

5. **Update Supabase Secrets**:
   ```bash
   supabase secrets set --project-ref mwcvlicipocoqcdypgsy \
     STRIPE_WEBHOOK_SECRET=whsec_[YOUR_PRODUCTION_SECRET]
   ```

6. **Test Webhook Connectivity**:
   - In Stripe Dashboard → Webhooks → [Your endpoint]
   - Click "Send test webhook"
   - Choose event: `checkout.session.completed`
   - Verify response: 200 OK

### 5.3 End-to-End Payment Testing ⚠️ CRITICAL

**Test Scenario 1: New Subscription (Monthly)**

1. **Initiate Checkout**:
   ```bash
   # Via production app:
   # 1. Log in as test user
   # 2. Click "Upgrade to Pro" or similar
   # 3. Select "Monthly Plan"
   # 4. Click "Checkout"
   ```

2. **Complete Payment in Stripe**:
   - Use Stripe test card: `4242 4242 4242 4242`
   - Expiry: Any future date
   - CVC: Any 3 digits
   - Complete checkout

3. **Verify Webhook Processing**:
   ```sql
   -- Check profile updated correctly
   SELECT
     email,
     subscription_status,
     subscription_id,
     billing_period,
     current_period_start,
     current_period_end,
     plan_expires_at
   FROM public.profiles
   WHERE email = 'test-migration@yourdomain.com';

   -- Expected:
   -- subscription_status: 'active'
   -- subscription_id: sub_[STRIPE_SUB_ID]
   -- billing_period: 'monthly'
   -- current_period_end: ~30 days in future
   ```

4. **Check Stripe Dashboard**:
   - Go to Stripe → Customers
   - Find test customer
   - Verify subscription is active
   - Check metadata for user_id

5. **Check Supabase Edge Function Logs**:
   ```bash
   # Via Supabase Dashboard → Edge Functions → stripe-events → Logs
   # Look for:
   # - "Processing checkout.session.completed"
   # - "Subscription activated for user: [USER_ID]"
   # - No errors
   ```

**Test Scenario 2: Subscription Renewal**

1. **Trigger Invoice Payment Succeeded Event**:
   - In Stripe Dashboard → Webhooks → Send test webhook
   - Event: `invoice.payment_succeeded`
   - Verify profile `current_period_end` is extended

**Test Scenario 3: Subscription Cancellation**

1. **Cancel via Customer Portal**:
   ```bash
   # Via production app:
   # 1. Log in as test user with active subscription
   # 2. Go to "Manage Subscription" (should open Stripe portal)
   # 3. Click "Cancel subscription"
   # 4. Choose "Cancel at period end"
   ```

2. **Verify Profile Update**:
   ```sql
   SELECT
     subscription_status,
     cancel_at_period_end,
     cancel_at,
     current_period_end
   FROM public.profiles
   WHERE email = 'test-migration@yourdomain.com';

   -- Expected:
   -- subscription_status: 'active' (still active until period end)
   -- cancel_at_period_end: true
   -- cancel_at: [timestamp at period end]
   ```

**Test Scenario 4: Failed Payment**

1. **Simulate Payment Failure**:
   - In Stripe Dashboard → Webhooks → Send test webhook
   - Event: `invoice.payment_failed`

2. **Verify Profile Update**:
   ```sql
   SELECT subscription_status
   FROM public.profiles
   WHERE email = 'test-migration@yourdomain.com';

   -- Expected: 'past_due' or 'canceled' depending on webhook logic
   ```

3. **Check User Access**:
   - Verify route guards restrict access to dashboard for users with failed payments
   - Check that user sees appropriate error message or payment prompt

### 5.4 Stripe Integration Verification ⚠️ CRITICAL

**This is the MOST CRITICAL phase. Do not proceed without passing ALL tests.**

**Checklist**:
- [ ] All 5 Stripe edge functions deployed successfully
- [ ] Production webhook configured in Stripe Dashboard
- [ ] Webhook signing secret set in Supabase secrets
- [ ] Test webhook sends return 200 OK
- [ ] Test Scenario 1 (New Subscription - Monthly) passed
- [ ] Test Scenario 2 (Subscription Renewal) passed
- [ ] Test Scenario 3 (Subscription Cancellation) passed
- [ ] Test Scenario 4 (Failed Payment) passed
- [ ] Edge function logs show no errors
- [ ] Billing period detection works correctly (monthly vs annual)
- [ ] Route guards correctly restrict access for inactive subscriptions
- [ ] Customer portal link works and shows correct subscription details

**If ANY test fails**:
1. Check edge function logs for errors
2. Verify Supabase secrets are set correctly
3. Verify Stripe webhook secret matches production endpoint
4. Check price detection logic (Phase 1.2)
5. DO NOT proceed to Phase 6 until all tests pass

---

## 📊 Phase 6: Session & Upload Tracking (1 Day)

### Objective
Deploy session management and upload tracking edge functions.

### 6.1 Deploy Session Management Edge Functions

**Edge Functions to Deploy** (5 total):
1. `manage-session` - Create/update user sessions
2. `check-session` - Verify active sessions
3. `cleanup-inactive-sessions` - Remove stale sessions
4. `get-active-sessions` - List user's active sessions
5. `revoke-session` - Force logout specific sessions

**Deployment Commands**:
```bash
cd /Users/indiedev/Desktop/CODE\ PROJECTS/voip-accelerator

# Deploy session management functions
supabase functions deploy manage-session \
  --project-ref mwcvlicipocoqcdypgsy

supabase functions deploy check-session \
  --project-ref mwcvlicipocoqcdypgsy

supabase functions deploy cleanup-inactive-sessions \
  --project-ref mwcvlicipocoqcdypgsy

supabase functions deploy get-active-sessions \
  --project-ref mwcvlicipocoqcdypgsy

supabase functions deploy revoke-session \
  --project-ref mwcvlicipocoqcdypgsy

# Verify deployment
supabase functions list --project-ref mwcvlicipocoqcdypgsy
```

### 6.2 Test Session Management

**Test Scenario 1: Session Creation on Login**

1. **Log in via production app**
2. **Verify session created**:
   ```sql
   SELECT
     id,
     user_id,
     session_token,
     created_at,
     last_heartbeat,
     is_active,
     user_agent,
     ip_address
   FROM public.active_sessions
   ORDER BY created_at DESC
   LIMIT 5;

   -- Should show new session for logged-in user
   ```

**Test Scenario 2: Session Heartbeat Updates**

1. **Stay logged in and interact with app**
2. **Verify last_heartbeat updates**:
   ```sql
   SELECT
     session_token,
     last_heartbeat,
     extract(epoch from (now() - last_heartbeat)) as seconds_since_heartbeat
   FROM public.active_sessions
   WHERE user_id = '[TEST_USER_ID]';

   -- last_heartbeat should be recent (< 5 minutes)
   ```

**Test Scenario 3: Session Cleanup**

1. **Manually trigger cleanup** (or wait for scheduled run):
   ```bash
   curl -X POST \
     https://mwcvlicipocoqcdypgsy.supabase.co/functions/v1/cleanup-inactive-sessions \
     -H "Authorization: Bearer [SERVICE_ROLE_KEY]"
   ```

2. **Verify stale sessions marked inactive**:
   ```sql
   SELECT COUNT(*)
   FROM public.active_sessions
   WHERE is_active = false;

   -- Should show stale sessions (last_heartbeat > 24 hours ago)
   ```

### 6.3 Test Upload Tracking

**Test Scenario: Rate Sheet Upload Increments Counter**

1. **Upload rate sheet via production app**:
   - Log in as test user
   - Go to US or AZ rate sheet upload
   - Upload a CSV file

2. **Verify total_uploads incremented**:
   ```sql
   SELECT
     email,
     total_uploads,
     subscription_plan
   FROM public.profiles
   WHERE email = 'test-migration@yourdomain.com';

   -- total_uploads should increment by 1 after each upload
   ```

3. **Test Upload Limit Enforcement**:
   - If user is on trial or has upload limits
   - Verify app blocks upload after limit reached
   - Verify error message shown to user

### 6.4 Phase 6 Verification

**Checklist**:
- [ ] All 5 session management edge functions deployed
- [ ] Session created on user login
- [ ] Session heartbeat updates during app usage
- [ ] Stale sessions cleaned up correctly
- [ ] total_uploads counter increments on rate sheet upload
- [ ] Upload limits enforced correctly (if applicable)
- [ ] No errors in edge function logs

---

## 🧹 Phase 7: Final Cleanup (1 Day)

### Objective
Deploy remaining edge functions, clean up obsolete data, and finalize production environment.

### 7.1 Deploy Remaining Edge Functions

**Non-Critical Edge Functions** (deploy as needed):
- Utility functions (ping-status, health checks)
- Admin functions (delete-user-account, etc.)
- Any custom business logic functions

**Deployment Commands**:
```bash
cd /Users/indiedev/Desktop/CODE\ PROJECTS/voip-accelerator

# Deploy ping-status (health check)
supabase functions deploy ping-status \
  --project-ref mwcvlicipocoqcdypgsy

# Deploy delete-user-account (user management)
supabase functions deploy delete-user-account \
  --project-ref mwcvlicipocoqcdypgsy

# Deploy any other remaining functions
# (Exclude debug functions - do NOT deploy to production)

# Verify all functions deployed
supabase functions list --project-ref mwcvlicipocoqcdypgsy
# Expected: 40 functions (matching staging, minus debug functions)
```

### 7.2 Deprecate lerg_codes Table (Optional Future Cleanup)

**Note**: Do NOT delete `lerg_codes` immediately. Keep it as backup for 30 days to ensure `enhanced_lerg` is stable.

**After 30 days of stable production**:

```sql
-- Optional: Rename for clarity
ALTER TABLE public.lerg_codes RENAME TO lerg_codes_deprecated;

-- Add comment
COMMENT ON TABLE public.lerg_codes_deprecated IS
  'DEPRECATED: Replaced by enhanced_lerg. Safe to drop after [DATE + 60 days].';

-- Optional: After 60 days, drop entirely
-- DROP TABLE public.lerg_codes_deprecated;
```

### 7.3 Clean Up Migration Scripts

**Organize Migration Artifacts**:
```bash
cd /Users/indiedev/Desktop/CODE\ PROJECTS/voip-accelerator

# Create archive directory
mkdir -p migration-scripts/archive

# Move completed scripts to archive
mv migration-scripts/*.sql migration-scripts/archive/

# Keep only the master migration plan
# (This document: docs/MIGRATION.md)
```

### 7.4 Update Frontend for Production

**Build and Deploy Production Frontend**:

```bash
cd /Users/indiedev/Desktop/CODE\ PROJECTS/voip-accelerator

# Verify production environment variables
cat .env.production
# Ensure:
# - VITE_STRIPE_PUBLISHABLE_KEY = pk_live_...
# - VITE_SUPABASE_URL = https://mwcvlicipocoqcdypgsy.supabase.co
# - No VITE_STRIPE_SECRET_KEY (security issue)

# Build for production
npm run build

# Test production build locally
npm run preview
# Open http://localhost:4173
# Verify:
# - Stripe checkout uses production keys
# - Supabase connects to production project
# - No console errors

# Deploy to production hosting (e.g., Vercel, Netlify, etc.)
# (Deployment method depends on your hosting setup)
```

### 7.5 Phase 7 Verification

**Checklist**:
- [ ] All 40 edge functions deployed (excluding debug functions)
- [ ] `lerg_codes` table remains as backup (will deprecate in 30 days)
- [ ] Migration scripts archived
- [ ] Production frontend built without errors
- [ ] Production frontend deployed to hosting
- [ ] Production app loads without console errors
- [ ] All Supabase environment variables correct
- [ ] All Stripe environment variables correct

---

## 📈 Phase 8: Monitoring & Validation (7 Days Ongoing)

### Objective
Monitor production system, validate all features work correctly, and support beta tester re-registration.

### 8.1 Send "Migration Complete" Email to Beta Testers

**Template**: See `BETA_TESTER_COMMUNICATIONS.md` → "Migration Complete: Welcome Back!"

**Key Points**:
- Migration is complete
- Instructions to re-register at production URL
- Promo code: `BETATESTER2025` (extended 7-day trial)
- Priority support contact
- Thank you for beta testing

**Send immediately after Phase 7 complete**.

### 8.2 Monitoring Checklist (Daily for 7 Days)

**Day 1-7: Active Monitoring**

- [ ] **User Registration Rate**:
  ```sql
  SELECT DATE(created_at), COUNT(*) as new_users
  FROM public.profiles
  WHERE created_at >= now() - interval '7 days'
  GROUP BY DATE(created_at)
  ORDER BY DATE(created_at);
  ```
  - Expected: 14 beta testers re-register within 7 days

- [ ] **Subscription Status Distribution**:
  ```sql
  SELECT subscription_status, COUNT(*)
  FROM public.profiles
  GROUP BY subscription_status;
  ```
  - Expected: Most users on 'trial', some may upgrade to 'active'

- [ ] **Stripe Webhook Success Rate**:
  - Check Supabase → Edge Functions → stripe-events → Logs
  - All webhook events should return 200 OK
  - No errors in processing

- [ ] **Edge Function Error Rate**:
  - Check Supabase → Edge Functions → Logs
  - Look for 500 errors, timeouts, or crashes
  - Investigate and fix any recurring errors

- [ ] **LERG Data Integrity**:
  ```sql
  SELECT COUNT(*) FROM public.enhanced_lerg;
  -- Expected: 450 (should not decrease)

  SELECT category, COUNT(*)
  FROM public.enhanced_lerg
  GROUP BY category;
  -- Verify distribution looks correct
  ```

- [ ] **Active Sessions Health**:
  ```sql
  SELECT
    COUNT(*) as total_sessions,
    COUNT(*) FILTER (WHERE is_active = true) as active_sessions,
    COUNT(*) FILTER (WHERE last_heartbeat > now() - interval '1 hour') as recent_sessions
  FROM public.active_sessions;
  ```

- [ ] **Upload Tracking**:
  ```sql
  SELECT
    AVG(total_uploads) as avg_uploads,
    MAX(total_uploads) as max_uploads,
    COUNT(*) FILTER (WHERE total_uploads > 0) as users_with_uploads
  FROM public.profiles;
  ```

### 8.3 User Support Protocol

**For Beta Testers with Issues**:

1. **Registration Issues**:
   - Verify user's email not blocked
   - Check Supabase auth logs for errors
   - Manually create profile if trigger failed

2. **Stripe Checkout Issues**:
   - Verify production Stripe keys are correct
   - Check edge function logs for checkout-session errors
   - Test checkout flow yourself to reproduce

3. **Access/Route Guard Issues**:
   - Verify subscription_status is correct in database
   - Check edge function `check-subscription-status` logs
   - Manually update subscription_status if webhook failed

4. **Data Migration Issues**:
   - Remind users this is a fresh start (no old data)
   - Provide instructions for re-uploading rate sheets
   - Offer 1-on-1 onboarding call if needed

### 8.4 Success Metrics (End of 7 Days)

**Migration Success Criteria**:

- [ ] **User Re-Registration**: ≥10 of 14 beta testers (71%) re-registered
- [ ] **Zero Critical Bugs**: No showstopper bugs preventing core functionality
- [ ] **Stripe Integration**: 100% webhook success rate (no failed payments due to integration)
- [ ] **LERG Data Stability**: No data loss or corruption in enhanced_lerg table
- [ ] **System Uptime**: ≥99% uptime (no extended outages)
- [ ] **Edge Function Health**: <1% error rate across all functions
- [ ] **User Satisfaction**: ≥8/10 average satisfaction from beta tester feedback

**If Success Criteria Met**:
- [ ] Send "Thank You" follow-up email to beta testers
- [ ] Document lessons learned in this migration plan (for future reference)
- [ ] Schedule `lerg_codes` deprecation for 30 days from now
- [ ] Begin planning for public launch (if applicable)

**If Success Criteria NOT Met**:
- [ ] Identify root cause of failures
- [ ] Implement fixes
- [ ] Extend monitoring period another 7 days
- [ ] Communicate delays to beta testers with transparency

---

## 🚨 Rollback Procedures

### Emergency Rollback Scenarios

**Scenario 1: Critical Stripe Integration Failure**

**Symptoms**:
- Webhooks failing (not returning 200 OK)
- Subscriptions not activating after payment
- Billing period detection broken

**Rollback Steps**:
1. Immediately revert edge functions to previous version:
   ```bash
   # Rollback stripe-events function
   supabase functions deploy stripe-events \
     --project-ref mwcvlicipocoqcdypgsy \
     --version [PREVIOUS_VERSION_ID]
   ```
2. Switch back to Stripe sandbox mode temporarily:
   ```bash
   supabase secrets set --project-ref mwcvlicipocoqcdypgsy \
     STRIPE_SECRET_KEY=sk_test_[SANDBOX_KEY]
   ```
3. Email beta testers: "Temporary payment processing issue, working on fix"
4. Investigate logs, fix issue in staging first
5. Re-deploy after thorough testing

**Scenario 2: Database Schema Corruption**

**Symptoms**:
- Queries failing with "column does not exist" errors
- User registration broken
- Data inconsistencies

**Rollback Steps**:
1. Restore database from backup:
   ```bash
   # Via Supabase Dashboard → Database → Backups → Restore
   # Choose backup from before migration started
   ```
2. Re-apply only known-good migrations one at a time
3. Verify each step before proceeding
4. Do NOT skip verification steps

**Scenario 3: LERG Data Loss**

**Symptoms**:
- enhanced_lerg table has <400 records (should be 450)
- NPA lookups failing
- Missing geographic data

**Rollback Steps**:
1. Do NOT drop enhanced_lerg
2. Re-import from staging:
   ```bash
   supabase db dump --project-ref odnwqnmgftgjrdkotlro \
     --table enhanced_lerg > staging_lerg_backup.sql

   # Clear corrupted data
   TRUNCATE TABLE public.enhanced_lerg;

   # Re-import
   supabase db execute --project-ref mwcvlicipocoqcdypgsy \
     --file staging_lerg_backup.sql
   ```
3. Verify record count: `SELECT COUNT(*) FROM public.enhanced_lerg;` (should be 450)

**General Rollback Principles**:
- Always rollback in REVERSE order of phases (Phase 8 → 7 → 6 → ... → 1)
- Test each rollback step in staging first if time permits
- Communicate proactively with beta testers about any issues
- Document what went wrong for future prevention

---

## 📝 Post-Migration Checklist

### Final Verification (Complete Before Declaring Success)

**Technical Verification**:
- [ ] All 40 edge functions deployed and responding
- [ ] Database schema matches staging
- [ ] All migrations applied successfully
- [ ] RLS policies clean (no duplicates)
- [ ] Triggers correct (no duplicates)
- [ ] Production Stripe integration working
- [ ] Webhook endpoint verified in Stripe Dashboard
- [ ] Enhanced LERG data complete (450 records)
- [ ] Session management functional
- [ ] Upload tracking working

**User Verification**:
- [ ] Test user registration → trial setup flow
- [ ] Test rate sheet upload (US and AZ)
- [ ] Test Stripe checkout (monthly and annual)
- [ ] Test subscription management via customer portal
- [ ] Test LERG/NANP categorization features
- [ ] Test session management (login/logout)
- [ ] Test route guards (trial vs active subscription)
- [ ] Test failed payment handling

**Business Verification**:
- [ ] ≥10 beta testers re-registered
- [ ] Zero revenue-impacting bugs
- [ ] Stripe production webhooks processing successfully
- [ ] All critical paths functional
- [ ] No data loss or corruption

**Communication Verification**:
- [ ] T-7 days email sent ✅
- [ ] T-2 days email sent ✅
- [ ] Migration day status updates sent ✅
- [ ] Migration complete email sent ✅
- [ ] Support available for beta testers ✅

---

## 📚 Reference Documents

- **STAGING_SUPABASE_ANALYSIS.md** - Complete staging environment analysis
- **PRODUCTION_SUPABASE_ANALYSIS.md** - Complete production environment analysis
- **STAGING_VS_PRODUCTION_COMPARISON.md** - Detailed 62-page comparison (gaps and differences)
- **STRIPE_MIGRATION_CHECKLIST.md** - Comprehensive Stripe integration guide (400+ lines)
- **BETA_TESTER_COMMUNICATIONS.md** - Email templates and timing guidelines

---

## 🎓 Lessons Learned (To Be Updated Post-Migration)

### What Went Well
- (To be documented after migration complete)

### What Could Be Improved
- (To be documented after migration complete)

### Future Migration Best Practices
- (To be documented after migration complete)

---

## 📞 Support Contacts

**Technical Issues**:
- Supabase Support: https://supabase.com/dashboard/support
- Stripe Support: https://support.stripe.com/

**Beta Tester Support**:
- Email: [YOUR_SUPPORT_EMAIL]
- Priority support for BETATESTER2025 users

**Emergency Contacts**:
- Database issues: [DBA_CONTACT]
- Payment issues: [BILLING_CONTACT]
- Critical bugs: [ENGINEERING_CONTACT]

---

## ✅ Migration Sign-Off

**Date Completed**: _______________

**Completed By**: _______________

**Verified By**: _______________

**Success Criteria Met**: [ ] Yes [ ] No

**Notes**:
```
(Add any final notes, issues encountered, or deviations from plan)
```

---

**END OF MIGRATION PLAN**

**Version**: 1.0
**Last Updated**: October 13, 2025
**Status**: Ready for Execution

---

## Quick Reference: Phase Summary

| Phase | Duration | Critical? | Key Tasks |
|-------|----------|-----------|-----------|
| 1. Preparation | 1-2 days | ⚠️ HIGH | Environment setup, Stripe config, backups |
| 2. Core Infrastructure | 1 day | ⚠️ HIGH | active_sessions table, profile columns, trigger fixes |
| 3. LERG Migration | 2-3 days | MEDIUM | enhanced_lerg table, data migration, edge functions |
| 4. User Management | 1 day | ⚠️ HIGH | RLS cleanup, user wipe, registration testing |
| 5. Stripe Integration | 2-3 days | ⚠️ CRITICAL | Payment functions, webhook config, end-to-end testing |
| 6. Session/Upload | 1 day | MEDIUM | Session management, upload tracking |
| 7. Final Cleanup | 1 day | LOW | Remaining functions, frontend deployment |
| 8. Monitoring | 7 days | HIGH | User support, metrics tracking, validation |

**Total Timeline**: 7-10 days active work + 7 days monitoring = **14-17 days total**
