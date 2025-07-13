# VoIP Accelerator - Stripe Billing Integration Plan

## Current Application Analysis

Based on your existing codebase, I can see:

- **Tech Stack**: Vue 3 + TypeScript + Supabase + Pinia stores
- **User Management**: Already implemented with Supabase auth (`user-store.ts`)
- **Core Features**: Rate sheet uploads, comparisons, analysis, exports
- **Architecture**: Well-structured with services, stores, and components

## Questions for Billing Strategy

### 1. Business Model
**What type of billing model do you prefer?**
- [X] Subscription-based (monthly/annual plans)
- [ ] Usage-based (pay per upload/comparison)
- [ ] Freemium (free tier + paid features)
- [ ] Hybrid (subscription + usage overages)

### 2. Current Usage Tracking
I notice you have `userStore.incrementUploadsToday()` - **what usage limits do you want to enforce?**
- File uploads per day/month?
- Rate comparisons per period?
- Export operations?
- Storage/data retention?
/// we need to add this into the user porfile and make this a metric that we track for all sessions. We want to use this as a way to show value to the customer and also for our own marketing. If we can say 'VOIP accelrator does 1000 rate comparisions a day - your competetion is eating you alove' (or something to that effect) - that will be great social proof.

### 3. Feature Tiers
**What features should be behind a paywall?**
- [ ] Basic rate comparisons (free?)
- [ ] Advanced analysis/reports (premium?)
- [ ] Export functionality (premium?)
- [ ] Bulk operations (enterprise?)
- [ ] Historical data retention (premium?)
- [ ] API access (enterprise?)

// all features are available - pay monthly or yearly - no limitations.
// 1 week free all access, then pay as you go.

### 4. Pricing Structure
**What pricing tiers are you considering?**
- Free tier: ___ uploads/month, basic features
- Professional: $___/month, ___ uploads, advanced features  
- Enterprise: $___/month, unlimited, premium support

// all features are available - pay monthly or yearly - no limitations.
// 1 week free all access, then pay as you go.

### 5. Integration Approach
**How do you want to handle billing flows?**
- [ ] Embedded Stripe Elements in your app
- [ ] Redirect to Stripe Checkout
- [ ] Customer portal for subscription management
- [X] In-app billing management

// I have never donw a Strip integration, but I want it to be as professional as possible.
//Users shoudl be able to update their billing information and download invoices from within their VOIP accelrator dashboard @Dashboard.vue

### 6. Technical Implementation
**Where should billing be handled?**
- [ ] Client-side only (Stripe Elements)
- [ ] Supabase Edge Functions (recommended for webhooks)
- [ ] Separate backend service
- [X] Hybrid approach
// Again I have never done this before, put I would like to be able to have the user set up a subscription in the app, and then have that payment information updated in Supabase. So if they pay for a month, then their Dahsboard will show when their subscription ends - same for a yearly payment.

### 7. User Experience
**When should users hit billing prompts?**
- [ ] At registration (choose plan upfront)
- [ ] When hitting usage limits (soft/hard limits)
- [ ] When accessing premium features
- [ ] Optional upgrade prompts
// When their free trial has ended

### 8. Current User Data Integration
**How should billing integrate with your existing user system?**
- Store Stripe customer ID in Supabase profiles?
- Sync subscription status with user store?
- How to handle existing users?

//I don't know - what is best practice - this is my first attempt at this.

## Technical Architecture Considerations

### Current User Store Structure
```typescript
// From user-store.ts - you already have:
- User profile management
- Upload tracking (incrementUploadsToday)
- Trial period handling
```

### Potential Integration Points
1. **User Store Enhancement** - Add subscription status, usage limits
2. **New Billing Service** - Handle Stripe operations
3. **Usage Tracking** - Enhance existing upload counting
4. **Feature Guards** - Protect premium features
5. **Billing Components** - Subscription cards, payment forms

### Supabase Integration
Your existing Supabase setup could handle:
- Webhook endpoints (Edge Functions)
- Subscription status storage
- Usage analytics
- Customer data sync

## Implementation Plan

Based on your answers, here's the complete Stripe integration roadmap:

### ✅ **BUSINESS MODEL DEFINED**
- **Simple Subscription**: Monthly ($X) / Yearly ($Y) with discount
- **All Features Available**: No usage limits or feature restrictions
- **1 Week Free Trial**: Full access, then payment required
- **Professional Experience**: In-app billing management from Dashboard.vue

### 🔧 **TECHNICAL ARCHITECTURE**

#### **Phase 1: Stripe Setup & Configuration**
1. **Stripe Account Configuration**
   - Create products (Monthly/Yearly subscriptions)
   - Set up webhooks for subscription events
   - Configure customer portal settings
   - Test with your existing test API key

2. **Database Schema Updates**
   - Update Profile interface to include:
     - `stripe_customer_id: string | null`
     - `plan_expires_at: string | null` (already exists)
     - `subscription_status: 'trial' | 'monthly' | 'annual' | 'cancelled'` (already exists)
     - `stripe_subscription_id: string | null`
     - `trial_started_at: string | null`

#### **Phase 2: Supabase Edge Functions**
3. **Create Billing Edge Functions**
   - `create-stripe-customer` - Initialize customer on signup
   - `create-subscription` - Handle subscription creation
   - `stripe-webhooks` - Process Stripe events (payment success, cancellation, etc.)
   - `get-billing-portal-url` - Generate customer portal URLs
   - `get-invoice-download-url` - Direct invoice downloads

#### **Phase 3: Frontend Billing Components**
4. **Billing Management in Dashboard.vue**
   - Subscription status card
   - Plan upgrade/downgrade options
   - Payment method management
   - Invoice download history
   - Trial countdown display

5. **Payment Flow Components**
   - `SubscriptionModal.vue` - Stripe Checkout integration
   - `BillingCard.vue` - Current plan display
   - `TrialBanner.vue` - Trial expiration warnings

#### **Phase 4: Usage Tracking for Marketing**
6. **Enhanced Analytics System**
   - Track rate comparisons performed
   - Upload statistics
   - Export operations
   - Session duration
   - Data processed metrics

### ✅ **PRICING & REQUIREMENTS CONFIRMED**

1. **Pricing Structure**: 
   - Monthly: $40/month
   - Yearly: $400/year (17% discount)

2. **Trial Behavior**:
   - **Hard Stop**: App becomes unusable after 1-week trial expires
   - No grace period - immediate payment required

3. **Usage Tracking for Marketing**:
   - **Rate Comparisons**: Track total comparisons performed (US + AZ)
   - **Rate Adjustments**: Track bulk adjustments made (US + AZ)
   - Display metrics in user dashboard for value demonstration

### 📋 **IMPLEMENTATION CHECKLIST**

#### **Step 1: Stripe Product Setup** ✅ Ready
```javascript
// Products to create in Stripe Dashboard:
{
  name: "VoIP Accelerator Monthly",
  price: "$40.00",
  recurring: "monthly",
  product_id: "prod_voip_monthly"
}
{
  name: "VoIP Accelerator Annual", 
  price: "$400.00",
  recurring: "yearly",
  product_id: "prod_voip_annual"
}
```

#### **Step 2: Database Schema Updates**
```sql
-- Add to profiles table:
ALTER TABLE profiles ADD COLUMN stripe_customer_id text;
ALTER TABLE profiles ADD COLUMN stripe_subscription_id text;
ALTER TABLE profiles ADD COLUMN trial_started_at timestamptz DEFAULT now();

-- Create usage_metrics table:
CREATE TABLE usage_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  metric_type text NOT NULL, -- 'comparison' or 'adjustment'
  source text NOT NULL, -- 'us' or 'az'
  created_at timestamptz DEFAULT now(),
  metadata jsonb -- Store additional context
);
```

#### **Step 3: Edge Functions to Create**
1. `create-stripe-checkout` - Generate checkout session
2. `stripe-webhooks` - Handle subscription events
3. `get-billing-portal` - Customer portal access
4. `check-subscription-status` - Verify active subscription

#### **Step 4: Frontend Components**
1. `SubscriptionCard.vue` - Show current plan in Dashboard
2. `PaymentModal.vue` - Stripe checkout integration
3. `TrialExpiryBanner.vue` - Trial countdown warning
4. `UsageMetrics.vue` - Display comparisons/adjustments count

#### **Step 5: App Access Control**
- Modify router guards to check subscription status
- Block all routes except billing when trial expired
- Show payment required screen

### 🚀 **STARTING IMPLEMENTATION NOW**