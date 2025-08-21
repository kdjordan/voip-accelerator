# VoIP Accelerator - Mission Critical User Flows

## Overview
This document defines the mission-critical user flows and business acceptance criteria for the VoIP Accelerator application. These flows are protected by automated testing but require manual verification during major releases.

**Automated Protection Status**: ✅ **PROTECTED**
- Critical Stripe webhook logic: `npm run test:integration`
- Business logic validation: `npm run test:regression`
- Deployment confidence: `npm run regression-check`

---

## Mission Critical Flows

### 🎯 **Critical Path 1: Trial → Paid Conversion**
**Business Impact**: Primary revenue driver
**Automated Coverage**: ✅ Stripe webhook integration tests

**Success Criteria**:
- Trial users can seamlessly upgrade to paid plans
- All Stripe metadata is correctly stored (`stripe_customer_id`, `subscription_id`, billing periods)
- Upload limits are immediately reset upon payment
- `total_uploads` lifetime count is preserved
- Users regain access to blocked upload routes instantly

**Manual Verification Required**:
- Stripe payment UI displays correctly
- Post-payment redirect works from Stripe back to dashboard
- Email confirmations are sent

---

### 🎯 **Critical Path 2: Upload Limit Enforcement**
**Business Impact**: Prevents resource abuse, drives upgrades
**Automated Coverage**: ✅ User store tests, banner component tests

**Success Criteria**:
- Trial/Optimizer users blocked at 100 uploads
- Accelerator users have unlimited access
- Upload count displays consistently across all pages
- ServiceExpiryBanner appears with correct styling and messaging
- Route blocking redirects properly to dashboard

**Manual Verification Required**:
- Upload pages actually block file uploads (UI level)
- Banner styling matches across different screen sizes

---

### 🎯 **Critical Path 3: Subscription State Management**
**Business Impact**: Core billing and access control
**Automated Coverage**: ✅ Webhook tests, user store logic

**Success Criteria**:
- Trial expiration triggers proper messaging and blocking
- Cancelled subscriptions maintain access until period end
- Plan upgrades take effect immediately
- Dashboard reflects current subscription status accurately

**Manual Verification Required**:
- Real Stripe webhooks process correctly in production
- Billing portal integration works end-to-end

---

## User State Categories

### Trial Users
- **New Trial**: 0-99 uploads, valid trial period
- **Trial at Limit**: 100/100 uploads, upgrade required
- **Expired Trial**: Past trial end date, upgrade required

### Paid Users
- **Optimizer Active**: 0-99 uploads, active subscription
- **Optimizer at Limit**: 100/100 uploads, upgrade suggested
- **Accelerator**: Unlimited access, active subscription

### Inactive Users
- **Cancelled**: Access until period end, then blocked
- **Expired**: Past billing date, renewal required

---

## Business Requirements

### Performance Standards
- Dashboard loads in <2 seconds
- Plan upgrades complete in <30 seconds
- Upload limit checks are instant

### User Experience Standards
- Clear messaging for all subscription states
- Consistent UI across all pages
- No confusing or contradictory information
- Smooth upgrade flows without errors

### Data Integrity Standards
- Upload limits enforced correctly across all routes
- Billing calculations accurate
- Plan benefits applied immediately
- Lifetime upload counts preserved during upgrades

---

## Testing Strategy

### Automated (Continuous)
```bash
npm run test:integration   # Critical webhook logic
npm run regression-check   # Full deployment confidence
npm run test:coverage      # Code coverage analysis
```

### Manual (Release Verification)
1. **End-to-End Payment Flow**: Complete trial signup → upload limit → Stripe payment → access restoration
2. **Cross-Browser Testing**: Verify critical flows in Chrome, Safari, Firefox
3. **Mobile Responsiveness**: Test upgrade flows on mobile devices
4. **Production Webhooks**: Verify real Stripe webhooks in staging environment

### Emergency Testing (Hotfixes)
- Run `npm run test:integration` (30 seconds)
- Verify specific flow affected by hotfix
- Deploy with confidence

---

## Known Issues (Historical)

### ✅ **RESOLVED**
- ✅ Optimizer plan showing $249 instead of $99
- ✅ Trial users showing as "Optimizer" instead of "Free Trial"  
- ✅ Upload count reset on subscription upgrade
- ✅ Missing Stripe metadata in webhooks

### 🔍 **MONITORING**
- Cross-route upload limit consistency (automated tests protect this)
- Upload count synchronization (protected by user store tests)

---

## Success Metrics

### Business Metrics
- Trial → Paid conversion rate >15%
- Support tickets about billing <2% of transactions
- Upload limit bypass attempts: 0

### Technical Metrics  
- Webhook processing success rate >99.9%
- Dashboard load time <2s
- Zero critical path regressions

---

## Emergency Procedures

### If Critical Path Breaks
1. **Immediate**: Run `npm run test:integration` to verify scope
2. **Assessment**: Check specific failed test for root cause
3. **Rollback**: If webhook logic affected, rollback edge function deployment
4. **Communication**: Notify users if payment processing is impacted

### If Tests Fail
1. **DO NOT DEPLOY** until tests pass
2. **Fix root cause** rather than updating tests
3. **Verify fix** with additional manual testing
4. **Update tests** only if business requirements changed

---

## Conclusion

This document focuses on **mission-critical flows** that drive revenue and user experience. The detailed testing steps have been replaced by automated verification, but these business requirements and acceptance criteria remain essential for manual verification during major releases.

**Status**: 🚀 **PRODUCTION READY** with automated protection