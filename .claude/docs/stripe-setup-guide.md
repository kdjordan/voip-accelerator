# Stripe Setup Guide for VoIP Accelerator

## ✅ **BILLING SYSTEM IMPLEMENTATION STATUS**

### **COMPLETED:**
- ✅ Database migration with billing fields and usage tracking
- ✅ 4 Edge functions for Stripe integration
- ✅ Billing composable with all API interactions
- ✅ Professional billing components (SubscriptionCard, PaymentModal, TrialExpiryBanner)
- ✅ Router guards with subscription checking
- ✅ Dedicated billing page for expired trials
- ✅ Dashboard integration with trial banners and subscription management

### **NEXT STEPS:**

## 1. Stripe Dashboard Setup

### **Create Products & Prices:**
1. Log into your Stripe Dashboard
2. Go to Products → Create Product

**Monthly Product:**
```
Name: VoIP Accelerator Monthly
Description: Full access to VoIP Accelerator features
Price: $40.00 USD
Billing: Monthly recurring
```

**Annual Product:**
```
Name: VoIP Accelerator Annual  
Description: Full access to VoIP Accelerator features (17% savings)
Price: $400.00 USD
Billing: Yearly recurring
```

### **Copy Price IDs:**
After creating products, copy the price IDs (start with `price_...`) and add to your environment:

```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
VITE_STRIPE_PRICE_MONTHLY=price_...
VITE_STRIPE_PRICE_ANNUAL=price_...
```

## 2. Environment Variables Setup

**Client (.env.development):**
```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY_HERE
VITE_STRIPE_PRICE_MONTHLY=price_monthly_id_here
VITE_STRIPE_PRICE_ANNUAL=price_annual_id_here
```

**Supabase (.env):**
```env
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE
```

## 3. Deploy Functions & Run Migration

**Deploy Edge Functions:**
```bash
supabase functions deploy create-stripe-checkout
supabase functions deploy stripe-webhooks  
supabase functions deploy get-billing-portal
supabase functions deploy check-subscription-status
```

**Run Database Migration:**
```bash
supabase migration up
```

## 4. Webhook Setup

1. In Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://[your-project].supabase.co/functions/v1/stripe-webhooks`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy webhook signing secret to `STRIPE_WEBHOOK_SECRET`

## 5. Test the Integration

### **Test Flow:**
1. Create new user account
2. Navigate to `/billing` page
3. Select a plan
4. Complete test payment with Stripe test card: `4242424242424242`
5. Verify user can access protected routes
6. Test billing portal access

### **Test Cards:**
- **Success:** `4242424242424242`
- **Decline:** `4000000000000002`
- **Require Authentication:** `4000002500003155`

## 6. Usage Tracking Integration

**Add to your existing rate sheet operations:**

```typescript
// In rate comparison functions
import { useBilling } from '@/composables/useBilling';
const { trackUsageMetric } = useBilling();

// Track comparison
await trackUsageMetric('comparison', 'us', { 
  sheets_compared: 2,
  total_rows: 1500 
});

// Track bulk adjustment
await trackUsageMetric('adjustment', 'az', {
  rows_affected: 250,
  adjustment_type: 'percentage'
});
```

## 7. Production Checklist

- [ ] Replace test Stripe keys with live keys
- [ ] Update webhook endpoint to production URL
- [ ] Test complete payment flow in production
- [ ] Verify subscription status updates correctly
- [ ] Test trial expiration and hard blocking
- [ ] Verify usage metrics tracking
- [ ] Test billing portal functionality

## 🚀 **READY FOR TESTING**

Your billing system is complete and ready for testing! Users will:
- Get 7-day free trial automatically
- Be redirected to billing page when trial expires
- Have access to professional billing management
- Generate valuable usage metrics for marketing

**Next:** Set up Stripe products and test the complete flow!