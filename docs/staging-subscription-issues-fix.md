# Staging Subscription Issues - Analysis and Fixes

## Issues Identified

### 1. Subscription Status Shows "Inactive"
**Problem**: The UI shows "Inactive" for paid subscriptions
**Root Cause**: The `AccountBillingCard` component expects subscription_status values of 'trial', 'monthly', or 'annual' but defaults to 'Inactive' for any other value
**Location**: client/src/components/dashboard/AccountBillingCard.vue:82

### 2. Monthly Plan Shows as Annual  
**Problem**: User signed up for monthly but UI shows annual pricing ($400/year)
**Root Cause**: The subscription_status might not be correctly set during Stripe webhook processing
**Location**: supabase/functions/stripe-webhook/index.ts

### 3. Billing Date Shows Wrong Year
**Problem**: Annual subscription shows next billing as 2025 instead of 2026
**Root Cause**: The current_period_end from Stripe might be set incorrectly or there's a display issue
**Location**: Date formatting or data storage issue

## SQL Scripts Created

### 1. Reset User to Trial
**File**: `/supabase/scripts/reset-user-to-trial.sql`
**Usage**: Run in Supabase SQL editor to reset k.dean.jordan@gmail.com to trial status

### 2. Diagnose Subscription Data
**File**: `/supabase/scripts/diagnose-user-subscription.sql`
**Usage**: Run to see exact database values and identify data discrepancies

## Edge Function Updates

### 1. Stripe Webhook Enhanced Logging
**File**: `supabase/functions/stripe-webhook/index.ts`
- Added detailed logging for subscription details
- Log price intervals and subscription periods
- Log database update results

### 2. Check Subscription Status Enhanced Logging  
**File**: `supabase/functions/check-subscription-status/index.ts`
- Added profile email to logs
- Log subscription status checks
- Log final response data

## Deployment Steps

1. First, run the diagnostic SQL to understand current data state
2. Deploy the updated edge functions with logging
3. Reset the test user to trial status
4. Test the subscription flow again
5. Check edge function logs for detailed information
6. Make any additional fixes based on log data

## Testing Checklist

- [ ] Run diagnostic SQL to see current subscription data
- [ ] Deploy stripe-webhook function v2
- [ ] Deploy check-subscription-status function v5  
- [ ] Reset k.dean.jordan@gmail.com to trial
- [ ] Purchase monthly subscription
- [ ] Verify subscription_status = 'monthly' in database
- [ ] Verify UI shows "Monthly" not "Inactive"
- [ ] Verify billing date is correct
- [ ] Check edge function logs for any errors

## Additional Monitoring

After deployment, monitor these logs:
- Stripe webhook logs for subscription creation
- Check subscription status logs for status checks
- Database update confirmations

## Next Steps

Based on the logging data, we may need to:
1. Adjust how we determine monthly vs annual from Stripe data
2. Fix any timezone issues with billing dates
3. Ensure subscription_status values match UI expectations