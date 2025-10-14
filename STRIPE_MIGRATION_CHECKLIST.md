# Stripe Production Migration Checklist

## Overview
This document outlines all Stripe-related environment variables, configurations, and edge function settings that need to be updated when migrating from Stripe test mode (sandbox/staging) to production (live mode).

---

## Table of Contents
1. [Current Environment Variables](#current-environment-variables)
2. [Client-Side Environment Variables](#client-side-environment-variables)
3. [Edge Function Environment Variables](#edge-function-environment-variables)
4. [Price ID References](#price-id-references)
5. [Webhook Configuration](#webhook-configuration)
6. [Hardcoded Price Logic](#hardcoded-price-logic)
7. [Migration Steps](#migration-steps)
8. [Verification Checklist](#verification-checklist)

---

## Current Environment Variables

### Development (.env.development)
```bash
# Staging Supabase (odnwqnmgftgjrdkotlro)
VITE_SUPABASE_URL=https://odnwqnmgftgjrdkotlro.supabase.co
VITE_SITE_URL=http://localhost:5173/
VITE_AUTH_REDIRECT_URL=http://localhost:5173/auth/callback

# Test Mode Stripe Keys
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_[REDACTED]
VITE_STRIPE_SECRET_KEY=sk_test_[REDACTED]
VITE_STRIPE_WEBHOOK_SECRET=whsec_[REDACTED]

# Test Mode Price IDs
VITE_STRIPE_PRICE_MONTHLY_ACCELERATOR=price_1SEytpFVpXrZdlrXkdRDzwrT
VITE_STRIPE_PRICE_ANNUAL_ACCELERATOR=price_1SEyueFVpXrZdlrXbm1pHg0z
```

### Staging (.env.staging)
```bash
# Staging Supabase (odnwqnmgftgjrdkotlro) - SAME AS DEV
VITE_SUPABASE_URL=https://odnwqnmgftgjrdkotlro.supabase.co
VITE_SITE_URL=https://staging.d2fnr90mzdyqva.amplifyapp.com/
VITE_AUTH_REDIRECT_URL=https://staging.d2fnr90mzdyqva.amplifyapp.com/auth/callback

# Test Mode Stripe Keys (SAME AS DEV)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_[REDACTED]
VITE_STRIPE_SECRET_KEY=sk_test_[REDACTED]
VITE_STRIPE_WEBHOOK_SECRET=whsec_[REDACTED]

# Test Mode Price IDs (SAME AS DEV)
VITE_STRIPE_PRICE_MONTHLY_ACCELERATOR=price_1SEytpFVpXrZdlrXkdRDzwrT
VITE_STRIPE_PRICE_ANNUAL_ACCELERATOR=price_1SEyueFVpXrZdlrXbm1pHg0z
```

### Production (.env.production) - **NEEDS LIVE KEYS**
```bash
# Production Supabase (mwcvlicipocoqcdypgsy)
VITE_SUPABASE_URL=https://mwcvlicipocoqcdypgsy.supabase.co
VITE_SITE_URL=https://voipaccelerator.com/
VITE_AUTH_REDIRECT_URL=https://voipaccelerator.com/auth/callback

# ⚠️ TODO: Replace with LIVE mode Stripe keys
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_PRODUCTION_KEY_HERE
VITE_STRIPE_SECRET_KEY=sk_live_YOUR_PRODUCTION_KEY_HERE
VITE_STRIPE_WEBHOOK_SECRET=whsec_YOUR_PRODUCTION_WEBHOOK_SECRET

# ⚠️ TODO: Replace with production price IDs
VITE_STRIPE_PRICE_MONTHLY_ACCELERATOR=price_YOUR_PRODUCTION_MONTHLY_PRICE_ID
VITE_STRIPE_PRICE_ANNUAL_ACCELERATOR=price_YOUR_PRODUCTION_ANNUAL_PRICE_ID
```

---

## Client-Side Environment Variables

### Frontend Files Using VITE_STRIPE_* Variables

All files use `import.meta.env.VITE_STRIPE_*` pattern:

#### 1. **Core Service Layer**
- `/client/src/services/stripe.service.ts` (Line 5)
  - Uses: `VITE_STRIPE_PUBLISHABLE_KEY`
  - Purpose: Initialize Stripe.js for checkout

- `/client/src/composables/useBilling.ts` (Lines 7, 26-27)
  - Uses: `VITE_STRIPE_PUBLISHABLE_KEY`, `VITE_STRIPE_PRICE_MONTHLY`, `VITE_STRIPE_PRICE_ANNUAL`
  - Purpose: Billing composable with price ID mapping

#### 2. **Page Components Using Price IDs**
- `/client/src/pages/BillingPage.vue` (Lines 191-192)
  - Uses: `VITE_STRIPE_PRICE_ANNUAL_ACCELERATOR`, `VITE_STRIPE_PRICE_MONTHLY_ACCELERATOR`

- `/client/src/pages/DashBoard.vue` (Lines 583-584)
  - Uses: `VITE_STRIPE_PRICE_ANNUAL_ACCELERATOR`, `VITE_STRIPE_PRICE_MONTHLY_ACCELERATOR`

- `/client/src/pages/AzView.vue` (Lines 116-117)
  - Uses: `VITE_STRIPE_PRICE_OPTIMIZER`, `VITE_STRIPE_PRICE_ACCELERATOR`

- `/client/src/pages/UsView.vue` (Lines 137-138)
  - Uses: `VITE_STRIPE_PRICE_OPTIMIZER`, `VITE_STRIPE_PRICE_ACCELERATOR`

- `/client/src/pages/AZRateSheetView.vue` (Lines 550-551)
  - Uses: `VITE_STRIPE_PRICE_OPTIMIZER`, `VITE_STRIPE_PRICE_ACCELERATOR`

- `/client/src/pages/USRateSheetView.vue` (Lines 389-390)
  - Uses: `VITE_STRIPE_PRICE_OPTIMIZER`, `VITE_STRIPE_PRICE_ACCELERATOR`

- `/client/src/pages/RateGenUSView.vue` (Lines 98-99)
  - Uses: `VITE_STRIPE_PRICE_OPTIMIZER`, `VITE_STRIPE_PRICE_ACCELERATOR`

#### 3. **Billing Components**
- `/client/src/components/billing/SubscriptionCard.vue` (Lines 126-127)
  - Uses: `VITE_STRIPE_PRICE_ANNUAL_ACCELERATOR`, `VITE_STRIPE_PRICE_MONTHLY_ACCELERATOR`

- `/client/src/components/billing/PaymentModal.vue` (Lines 306-307)
  - Uses: `VITE_STRIPE_PRICE_ACCELERATOR`, `VITE_STRIPE_PRICE_OPTIMIZER`

- `/client/src/components/home/PricingSection.vue` (Line 137)
  - Uses: `VITE_STRIPE_PRICE_MONTHLY_ACCELERATOR`

---

## Edge Function Environment Variables

### Edge Functions Requiring Stripe Secrets

All edge functions use `Deno.env.get()` pattern:

#### 1. **create-checkout-session** (`/supabase/functions/create-checkout-session/index.ts`)
- **Line 28**: `Deno.env.get('STRIPE_SECRET_KEY')`
- **Lines 40-41**: `Deno.env.get('SUPABASE_URL')`, `Deno.env.get('SUPABASE_ANON_KEY')`
- **Purpose**: Creates Stripe checkout sessions for new subscriptions

#### 2. **create-portal-session** (`/supabase/functions/create-portal-session/index.ts`)
- **Line 29**: `Deno.env.get('STRIPE_SECRET_KEY')`
- **Lines 41-42**: `Deno.env.get('SUPABASE_URL')`, `Deno.env.get('SUPABASE_ANON_KEY')`
- **Purpose**: Creates Stripe customer portal sessions for subscription management

#### 3. **stripe-events** (`/supabase/functions/stripe-events/index.ts`) - **CRITICAL**
- **Line 12**: `Deno.env.get('STRIPE_SECRET_KEY')`
- **Line 40**: `Deno.env.get('STRIPE_WEBHOOK_SECRET')` - **MUST MATCH STRIPE DASHBOARD**
- **Lines 134-135**: `Deno.env.get('SUPABASE_URL')`, `Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')`
- **Purpose**: Validates and processes Stripe webhooks (payment events)
- **Security**: Webhook signature verification prevents fraudulent events

#### 4. **upgrade-subscription** (`/supabase/functions/upgrade-subscription/index.ts`)
- **Line 114**: `Deno.env.get('STRIPE_SECRET_KEY')`
- **Lines 128-129**: `Deno.env.get('VITE_STRIPE_PRICE_MONTHLY_ACCELERATOR')`, `Deno.env.get('VITE_STRIPE_PRICE_ANNUAL_ACCELERATOR')`
- **Lines 28-29**: `Deno.env.get('SUPABASE_URL')`, `Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')`
- **Purpose**: Handles subscription tier changes with prorating

#### 5. **get-stripe-account** (`/supabase/functions/get-stripe-account/index.ts`)
- **Line 6**: `Deno.env.get('STRIPE_SECRET_KEY')`
- **Lines 41-42**: `Deno.env.get('SUPABASE_URL')`, `Deno.env.get('SUPABASE_ANON_KEY')`
- **Purpose**: Retrieves Stripe account information (admin only)

### Required Edge Function Secrets (Set in Supabase Dashboard)

For **STAGING** (odnwqnmgftgjrdkotlro):
```bash
# Already configured with test mode keys
STRIPE_SECRET_KEY=sk_test_[REDACTED]
STRIPE_WEBHOOK_SECRET=whsec_[REDACTED]
VITE_STRIPE_PRICE_MONTHLY_ACCELERATOR=price_1SEytpFVpXrZdlrXkdRDzwrT
VITE_STRIPE_PRICE_ANNUAL_ACCELERATOR=price_1SEyueFVpXrZdlrXbm1pHg0z
```

For **PRODUCTION** (mwcvlicipocoqcdypgsy):
```bash
# ⚠️ TODO: Set these in Supabase Dashboard > Edge Functions > Secrets
STRIPE_SECRET_KEY=sk_live_YOUR_LIVE_SECRET_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_LIVE_WEBHOOK_SECRET
VITE_STRIPE_PRICE_MONTHLY_ACCELERATOR=price_YOUR_LIVE_MONTHLY_PRICE_ID
VITE_STRIPE_PRICE_ANNUAL_ACCELERATOR=price_YOUR_LIVE_ANNUAL_PRICE_ID

# Also required for edge functions
SUPABASE_URL=https://mwcvlicipocoqcdypgsy.supabase.co
SUPABASE_ANON_KEY=[YOUR_PRODUCTION_ANON_KEY]
SUPABASE_SERVICE_ROLE_KEY=[YOUR_PRODUCTION_SERVICE_ROLE_KEY]
```

---

## Price ID References

### Discovered Price ID Patterns

The application references multiple price IDs that need production equivalents:

#### 1. **Accelerator Plan (Current Active)**
- `VITE_STRIPE_PRICE_MONTHLY_ACCELERATOR` - Used in 8+ files
- `VITE_STRIPE_PRICE_ANNUAL_ACCELERATOR` - Used in 8+ files

#### 2. **Optimizer Plan (Legacy/Future)**
- `VITE_STRIPE_PRICE_OPTIMIZER` - Referenced in 7 files
- Note: Not defined in .env files currently

#### 3. **Generic Price IDs (Fallback)**
- `VITE_STRIPE_PRICE_MONTHLY` - Fallback in `useBilling.ts` (Line 26)
- `VITE_STRIPE_PRICE_ANNUAL` - Fallback in `useBilling.ts` (Line 27)

### Action Required
1. Create production products in Stripe Dashboard
2. Create production price IDs for each billing period
3. Update all environment files with live price IDs

---

## Hardcoded Price Logic

### Billing Period Detection by Amount

**⚠️ CRITICAL**: Webhook handler uses hardcoded amounts to determine billing period:

**File**: `/supabase/functions/stripe-events/index.ts`

```typescript
// Lines 119-129: Hardcoded amount detection
const amountTotal = session.amount_total;
console.log('💰 Amount total:', amountTotal);

if (amountTotal === 9900) { // $99.00
  billingPeriod = 'monthly';
} else if (amountTotal === 99900) { // $999.00
  billingPeriod = 'annual';
}

// Lines 320-322: Helper function with same logic
function determineBillingPeriod(amountInCents: number): string {
  if (amountInCents === 9900) return 'monthly';   // $99.00
  if (amountInCents === 99900) return 'annual';   // $999.00
  return 'monthly'; // default
}
```

### Action Required
**If production pricing differs from $99/month or $999/year:**
1. Update hardcoded amounts in `stripe-events/index.ts` (Lines 125, 127, 320, 321)
2. Update test helpers in `/client/tests/utils/test-helpers.ts` (Lines 59, 68)
3. Update integration tests in `/client/tests/integration/stripe-webhook.test.ts` (Lines 105-106, 161-162)

**Alternatively:** Consider refactoring to use price ID lookup instead of amount detection.

---

## Webhook Configuration

### Stripe Dashboard Configuration

#### 1. **Webhook Endpoint URL**

For **STAGING** (odnwqnmgftgjrdkotlro):
```
https://odnwqnmgftgjrdkotlro.supabase.co/functions/v1/stripe-events
```

For **PRODUCTION** (mwcvlicipocoqcdypgsy):
```
https://mwcvlicipocoqcdypgsy.supabase.co/functions/v1/stripe-events
```

#### 2. **Required Webhook Events**
Configure these events in Stripe Dashboard > Developers > Webhooks:

- `checkout.session.completed` - New subscription created
- `customer.subscription.updated` - Subscription modified (plan change, cancellation scheduled)
- `customer.subscription.deleted` - Subscription canceled/expired

#### 3. **Webhook Secret**
After creating the webhook endpoint in Stripe Dashboard:
1. Copy the webhook signing secret (starts with `whsec_`)
2. Add to Supabase Edge Function secrets as `STRIPE_WEBHOOK_SECRET`
3. Update `.env.production` with the new secret

#### 4. **Edge Function Configuration**
The webhook endpoint has special configuration in `/supabase/config.toml`:

```toml
[functions.stripe-events]
verify_jwt = false  # Webhooks authenticated via Stripe signature, not JWT
```

**Security Note**: Webhook signature verification happens in the edge function itself (Line 60 of `stripe-events/index.ts`), not via Supabase JWT.

---

## Migration Steps

### Phase 1: Stripe Dashboard Setup (Production)

1. **Switch to Live Mode** in Stripe Dashboard
   - Toggle from "Test mode" to "Live mode" in top right

2. **Create Products**
   - Navigate to Products > Add product
   - Product Name: "VoIP Accelerator - Monthly"
   - Set price: $99.00 USD
   - Billing period: Monthly
   - Save and copy Price ID (starts with `price_`)
   - Repeat for Annual plan ($999.00 USD)

3. **Create Webhook Endpoint**
   - Navigate to Developers > Webhooks > Add endpoint
   - Endpoint URL: `https://mwcvlicipocoqcdypgsy.supabase.co/functions/v1/stripe-events`
   - Events to send:
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
   - Copy webhook signing secret (starts with `whsec_`)

### Phase 2: Supabase Production Configuration

1. **Set Edge Function Secrets**
   - Go to Supabase Dashboard (mwcvlicipocoqcdypgsy)
   - Navigate to Edge Functions > Manage secrets
   - Add secrets:
     ```
     STRIPE_SECRET_KEY=sk_live_[YOUR_KEY]
     STRIPE_WEBHOOK_SECRET=whsec_[YOUR_SECRET]
     VITE_STRIPE_PRICE_MONTHLY_ACCELERATOR=price_[YOUR_MONTHLY_ID]
     VITE_STRIPE_PRICE_ANNUAL_ACCELERATOR=price_[YOUR_ANNUAL_ID]
     ```

2. **Deploy Edge Functions**
   ```bash
   cd /Users/indiedev/Desktop/CODE\ PROJECTS/voip-accelerator
   supabase functions deploy stripe-events --project-ref mwcvlicipocoqcdypgsy
   supabase functions deploy create-checkout-session --project-ref mwcvlicipocoqcdypgsy
   supabase functions deploy create-portal-session --project-ref mwcvlicipocoqcdypgsy
   supabase functions deploy upgrade-subscription --project-ref mwcvlicipocoqcdypgsy
   supabase functions deploy get-stripe-account --project-ref mwcvlicipocoqcdypgsy
   ```

### Phase 3: Frontend Production Configuration

1. **Update `/client/.env.production`**
   ```bash
   VITE_STRIPE_PUBLISHABLE_KEY=pk_live_[YOUR_KEY]
   VITE_STRIPE_SECRET_KEY=sk_live_[YOUR_KEY]
   VITE_STRIPE_WEBHOOK_SECRET=whsec_[YOUR_SECRET]
   VITE_STRIPE_PRICE_MONTHLY_ACCELERATOR=price_[YOUR_MONTHLY_ID]
   VITE_STRIPE_PRICE_ANNUAL_ACCELERATOR=price_[YOUR_ANNUAL_ID]
   ```

2. **Build Production Frontend**
   ```bash
   cd /Users/indiedev/Desktop/CODE\ PROJECTS/voip-accelerator/client
   npm run build
   ```

3. **Deploy to Production**
   - Deploy to voipaccelerator.com via your hosting provider

### Phase 4: Pricing Logic Verification

1. **Verify Hardcoded Amounts Match Production**
   - If using $99 monthly / $999 annual: No changes needed
   - If different pricing: Update `stripe-events/index.ts` Lines 125, 127, 320, 321

2. **Test Webhook Handler Locally (Optional)**
   ```bash
   # Install Stripe CLI
   brew install stripe/stripe-cli/stripe

   # Login to Stripe
   stripe login

   # Forward webhooks to local edge function
   stripe listen --forward-to https://odnwqnmgftgjrdkotlro.supabase.co/functions/v1/stripe-events

   # Trigger test events
   stripe trigger checkout.session.completed
   ```

---

## Verification Checklist

### Before Going Live

- [ ] **Stripe Dashboard - Products Created**
  - [ ] Monthly Accelerator product created with correct price
  - [ ] Annual Accelerator product created with correct price
  - [ ] Price IDs copied and documented

- [ ] **Stripe Dashboard - Webhook Configured**
  - [ ] Webhook endpoint URL points to production Supabase
  - [ ] All 3 events enabled (checkout.session.completed, customer.subscription.updated, customer.subscription.deleted)
  - [ ] Webhook secret copied

- [ ] **Supabase Production - Edge Function Secrets Set**
  - [ ] STRIPE_SECRET_KEY (sk_live_...)
  - [ ] STRIPE_WEBHOOK_SECRET (whsec_...)
  - [ ] VITE_STRIPE_PRICE_MONTHLY_ACCELERATOR
  - [ ] VITE_STRIPE_PRICE_ANNUAL_ACCELERATOR
  - [ ] SUPABASE_URL
  - [ ] SUPABASE_ANON_KEY
  - [ ] SUPABASE_SERVICE_ROLE_KEY

- [ ] **Supabase Production - Edge Functions Deployed**
  - [ ] stripe-events deployed
  - [ ] create-checkout-session deployed
  - [ ] create-portal-session deployed
  - [ ] upgrade-subscription deployed
  - [ ] get-stripe-account deployed

- [ ] **Frontend - Production Environment File Updated**
  - [ ] VITE_STRIPE_PUBLISHABLE_KEY updated
  - [ ] VITE_STRIPE_SECRET_KEY updated (note: should not be in frontend, only in edge functions)
  - [ ] VITE_STRIPE_WEBHOOK_SECRET updated
  - [ ] VITE_STRIPE_PRICE_MONTHLY_ACCELERATOR updated
  - [ ] VITE_STRIPE_PRICE_ANNUAL_ACCELERATOR updated

- [ ] **Pricing Logic - Hardcoded Amounts Verified**
  - [ ] Webhook handler amounts match production pricing ($99 / $999)
  - [ ] Or, amounts updated in stripe-events/index.ts if different

### After Deployment

- [ ] **Test Purchase Flow**
  - [ ] Can access checkout page
  - [ ] Can select monthly plan
  - [ ] Can select annual plan
  - [ ] Checkout redirects to Stripe
  - [ ] Payment succeeds
  - [ ] Redirected back to success page

- [ ] **Test Webhook Processing**
  - [ ] User profile updated with subscription_status='active'
  - [ ] billing_period set correctly (monthly or annual)
  - [ ] stripe_customer_id populated
  - [ ] subscription_id populated
  - [ ] current_period_end set correctly

- [ ] **Test Subscription Management**
  - [ ] Can access billing portal
  - [ ] Can view subscription details
  - [ ] Can change payment method
  - [ ] Can cancel subscription (verify cancellation webhook)
  - [ ] Can upgrade/downgrade plan

- [ ] **Monitor Stripe Webhooks**
  - [ ] Check Stripe Dashboard > Developers > Webhooks
  - [ ] Verify successful webhook deliveries (200 status)
  - [ ] Check edge function logs for any errors

---

## Security Notes

### Secret Management Best Practices

1. **Never commit live keys to git**
   - Production .env files should be gitignored
   - Use placeholders in committed files

2. **Webhook Secret Critical**
   - STRIPE_WEBHOOK_SECRET validates webhook authenticity
   - Without signature verification, fraudulent webhooks could grant free subscriptions
   - Current implementation: Line 60 of `stripe-events/index.ts`

3. **Service Role Key Protection**
   - SUPABASE_SERVICE_ROLE_KEY bypasses Row Level Security
   - Only use in trusted edge functions
   - Never expose in frontend code

4. **Stripe Secret Key**
   - sk_live_ keys have full account access
   - Only use in edge functions, never in frontend
   - Note: Current .env files incorrectly include VITE_STRIPE_SECRET_KEY in frontend env (should be removed)

### Recommended Changes

1. **Remove from Frontend .env Files:**
   - `VITE_STRIPE_SECRET_KEY` should NOT be in client environment variables
   - Only `VITE_STRIPE_PUBLISHABLE_KEY` should be in frontend
   - Secret keys should only exist in edge function secrets

2. **Audit Current Usage:**
   - Check if `VITE_STRIPE_SECRET_KEY` is actually used in any frontend files
   - If not used, remove from all .env files immediately

---

## Additional Resources

- **Stripe Documentation**: https://stripe.com/docs/keys
- **Stripe Webhook Testing**: https://stripe.com/docs/webhooks/test
- **Supabase Edge Function Secrets**: https://supabase.com/docs/guides/functions/secrets
- **Stripe Price API**: https://stripe.com/docs/api/prices

---

## Contact & Support

For questions about this migration:
1. Review Stripe Dashboard > Developers > Logs for API errors
2. Check Supabase Dashboard > Edge Functions > Logs for webhook processing errors
3. Use Stripe CLI for local webhook testing: `stripe listen --forward-to [URL]`

---

**Last Updated**: 2025-10-13
**Status**: Ready for production migration
**Test Mode Active In**: Development, Staging
**Production Deployment**: Pending live key configuration
