# 🚨 CRITICAL PRODUCTION MIGRATION PLAN 🚨

**Date:** 2025-07-17  
**Migration Type:** STAGING → PRODUCTION  
**Status:** REQUIRES IMMEDIATE ATTENTION  
**Risk Level:** HIGH (Major schema & infrastructure changes)

## Executive Summary

Production environment is **SEVERELY OUTDATED** and missing critical systems implemented in staging:
- **Enhanced LERG System** (single source of truth for 450 NPAs)
- **Complete Stripe Billing Infrastructure** 
- **11 new/updated Edge Functions**
- **Critical data fixes** (Pacific NPA categorization)

**🔴 CRITICAL IMPACT:** Production users cannot access billing features, subscription management, or accurate NANP data.

---

## Environment Analysis

### Staging Environment (odnwqnmgftgjrdkotlro)
- **Region:** us-east-1  
- **Status:** CURRENT - All latest features implemented
- **Database Version:** 15.8.1.054
- **Users:** 3 (testing environment)

### Production Environment (mwcvlicipocoqcdypgsy)  
- **Region:** us-west-1
- **Status:** OUTDATED - Missing critical features
- **Database Version:** 15.8.1.085
- **Users:** 11 (live customers)

---

## 🎯 CRITICAL DIFFERENCES IDENTIFIED

### 1. **MISSING TABLES IN PRODUCTION**
| Table | Purpose | Impact |
|-------|---------|--------|
| `enhanced_lerg` | Single source of truth for 450 NPAs | No accurate NANP categorization |
| `usage_metrics` | Billing usage tracking | No subscription billing |
| `user_usage_stats` | Aggregated usage view | No usage reporting |

### 2. **MISSING COLUMNS IN PRODUCTION**
**Profiles Table Missing:**
- `email` - User email tracking
- `subscription_id` - Stripe subscription linking
- `current_period_start` - Billing period tracking
- `current_period_end` - Billing period tracking  
- `cancel_at` - Subscription cancellation dates
- `canceled_at` - Subscription cancellation tracking
- `last_payment_date` - Payment history

### 3. **MISSING EDGE FUNCTIONS IN PRODUCTION**
**Stripe/Billing Functions (0 of 3):**
- `create-checkout-session` - Stripe payment processing
- `create-portal-session` - Billing portal access
- `stripe-webhook` - Subscription lifecycle management

**Enhanced LERG Functions (0 of 8):**
- `get-enhanced-lerg-data` - New LERG data with geography
- `add-enhanced-lerg-record` - Manual NPA management
- `update-enhanced-lerg-record` - NPA updates
- `get-npa-location` - Location lookup service
- `check-subscription-status` - Subscription validation

**Updated Functions (6 existing need updates):**
- All existing LERG functions target old `lerg_codes` table
- Need updates to use new `enhanced_lerg` system

### 4. **LEGACY SYSTEM IN PRODUCTION**
- **`lerg_codes` table** - OLD system with 440 NPAs
- **Missing 10 NPAs** that exist in enhanced system (450 total)
- **Missing Pacific NPA fixes** (NPAs 670, 671, 684)

---

## 📋 MIGRATION PHASES

### **PHASE 1: PRE-MIGRATION PREPARATION** ⏱️ 2-3 Days

#### **Day 1: Data Backup & Environment Setup**
- [ ] **CRITICAL:** Full database backup of production
- [ ] **CRITICAL:** Full database backup of staging  
- [ ] Document all production user data
- [ ] Set up rollback procedures
- [ ] Test staging→production data migration in development
- [ ] Verify all environment variables are documented

#### **Day 2: Schema Preparation**
- [ ] **CRITICAL:** Export all production user data
- [ ] **CRITICAL:** Export all production `lerg_codes` data
- [ ] Prepare enhanced LERG migration scripts
- [ ] Test schema migrations on backup database
- [ ] Validate Pacific NPA fixes against production data

#### **Day 3: Function & Code Preparation**
- [ ] Deploy all new edge functions to staging for final testing
- [ ] Update client code to handle new enhanced LERG endpoints
- [ ] Test all Stripe webhook integrations
- [ ] Prepare deployment scripts for all edge functions

**✅ CHECKPOINT 1:** User approval required before proceeding

---

### **PHASE 2: CORE MIGRATION** ⏱️ 1-2 Days

#### **Step 1: Database Schema Migration**
```bash
# Execute in order:
1. 20250628161522_create_enhanced_lerg_table.sql
2. 20250712_billing_system.sql  
3. 20250628161523_seed_enhanced_lerg_data.sql
4. YYYYMMDDHHMMSS_update_trial_period_to_fixed_date.sql
```

**Expected Results:**
- `enhanced_lerg` table created with 450 NPAs
- `usage_metrics` table created
- `profiles` table extended with billing columns
- Trial period logic updated

#### **Step 2: Data Migration**
```bash
# Migrate legacy LERG data to enhanced system
1. Run: 20250629_consolidate_and_cleanup_lerg.sql
2. Apply: fix-pacific-npas.sql (or fix-pacific.sql)
3. Verify: 450 NPAs in enhanced_lerg table
4. Verify: Pacific NPAs (670,671,684) categorized as 'pacific'
```

#### **Step 3: User Data Preservation**
```bash
# Preserve existing user data
1. Map existing profiles to new schema
2. Set appropriate trial_expires_at dates
3. Ensure no user data loss
4. Verify all user accounts accessible
```

**✅ CHECKPOINT 2:** Verify all data migrated successfully

---

### **PHASE 3: EDGE FUNCTION DEPLOYMENT** ⏱️ 1 Day

#### **Deploy New Functions (11 functions)**
```bash
# Stripe Functions (Critical for billing)
supabase functions deploy create-checkout-session --project-ref mwcvlicipocoqcdypgsy
supabase functions deploy create-portal-session --project-ref mwcvlicipocoqcdypgsy  
supabase functions deploy stripe-webhook --project-ref mwcvlicipocoqcdypgsy

# Enhanced LERG Functions (Critical for NANP data)
supabase functions deploy get-enhanced-lerg-data --project-ref mwcvlicipocoqcdypgsy
supabase functions deploy add-enhanced-lerg-record --project-ref mwcvlicipocoqcdypgsy
supabase functions deploy update-enhanced-lerg-record --project-ref mwcvlicipocoqcdypgsy
supabase functions deploy get-npa-location --project-ref mwcvlicipocoqcdypgsy

# Updated Functions  
supabase functions deploy check-subscription-status --project-ref mwcvlicipocoqcdypgsy
supabase functions deploy get-all-users --project-ref mwcvlicipocoqcdypgsy
supabase functions deploy delete-user-account --project-ref mwcvlicipocoqcdypgsy
supabase functions deploy ping-status --project-ref mwcvlicipocoqcdypgsy
```

**✅ CHECKPOINT 3:** Test all edge functions individually

---

### **PHASE 4: INTEGRATION TESTING** ⏱️ 1-2 Days

#### **Critical Test Cases**
1. **🔴 LERG Data Integrity**
   - [ ] Verify 450 NPAs exist in enhanced_lerg
   - [ ] Test Pacific NPAs (670,671,684) return 'pacific' category
   - [ ] Verify missing NPA 438 is present
   - [ ] Test all NANP categorization functions

2. **🔴 Billing System Integration**
   - [ ] Test Stripe checkout session creation
   - [ ] Test subscription webhook processing
   - [ ] Test billing portal access
   - [ ] Verify subscription status checks

3. **🔴 User Experience**
   - [ ] Test existing user login/access
   - [ ] Test new user signup flow
   - [ ] Test trial period functionality
   - [ ] Test admin functions

4. **🔴 Frontend Integration**
   - [ ] Test client calls to enhanced LERG functions
   - [ ] Test billing UI components
   - [ ] Test subscription management
   - [ ] Test rate sheet processing with new NANP data

**✅ CHECKPOINT 4:** All tests pass - user approval required

---

### **PHASE 5: CLEANUP & OPTIMIZATION** ⏱️ 1 Day

#### **Legacy System Cleanup**
- [ ] **CRITICAL:** Backup `lerg_codes` table one final time
- [ ] Drop `lerg_codes` table (after confirming enhanced_lerg works)
- [ ] Remove old edge functions that are no longer needed
- [ ] Update any remaining references to old LERG system

#### **Performance Optimization**
- [ ] Analyze enhanced_lerg table performance
- [ ] Optimize indexes if needed
- [ ] Test system performance under load
- [ ] Monitor edge function execution times

**✅ CHECKPOINT 5:** System optimized and ready for production

---

## 🔄 ROLLBACK STRATEGIES

### **Immediate Rollback (0-4 hours)**
```bash
# If migration fails early
1. Restore complete database backup
2. Restore edge function versions
3. Verify all user access restored
4. Document failure points
```

### **Schema Rollback (4-24 hours)**
```bash
# If schema issues discovered
1. Restore enhanced_lerg → lerg_codes
2. Restore profiles table to original schema
3. Remove new edge functions
4. Test legacy system functionality
```

### **Data Rollback (24-48 hours)**
```bash
# If data integrity issues found
1. Restore individual table backups
2. Reconcile user data changes
3. Verify billing data integrity
4. Test all user workflows
```

---

## 📊 RISK ASSESSMENT

### **HIGH RISKS**
1. **User Data Loss** - Existing users lose access
2. **Billing Disruption** - Subscription payments fail
3. **NANP Data Corruption** - Incorrect rate categorization
4. **Extended Downtime** - Long migration process

### **MITIGATION STRATEGIES**
1. **Comprehensive Backups** - Multiple backup points
2. **Staged Migration** - Phase-by-phase approach
3. **Rollback Procedures** - Quick recovery options
4. **User Communication** - Advance notice of maintenance

---

## 🎯 SUCCESS CRITERIA

### **Functional Requirements**
- [ ] All 11 users can access their accounts
- [ ] Enhanced LERG system returns 450 NPAs
- [ ] Pacific NPAs correctly categorized
- [ ] Stripe billing functions operational
- [ ] All edge functions respond correctly

### **Performance Requirements**
- [ ] LERG lookups < 200ms response time
- [ ] Stripe checkout < 5 seconds
- [ ] No increase in overall system latency
- [ ] All functions have <2% error rate

### **Data Integrity Requirements**
- [ ] Zero user data loss
- [ ] Zero billing data corruption
- [ ] All NPAs correctly categorized
- [ ] Historical data preserved

---

## 👥 TEAM ASSIGNMENTS

### **Database Migration Lead**
- Execute schema migrations
- Verify data integrity
- Manage rollback procedures

### **Edge Function Deployment Lead**
- Deploy all 11 edge functions
- Test function integrations
- Monitor function performance

### **QA Testing Lead**
- Execute all test cases
- Verify user workflows
- Document any issues

### **Communications Lead**
- Notify users of maintenance
- Provide status updates
- Coordinate with stakeholders

---

## 🚨 EMERGENCY CONTACTS

### **Primary Contacts**
- **Technical Lead:** [User]
- **Database Admin:** [TBD]
- **Stripe Integration:** [TBD]

### **Escalation Path**
1. **Technical Issues** → Technical Lead
2. **Billing Issues** → Stripe Integration Lead
3. **User Issues** → Communications Lead
4. **Critical Failures** → ALL HANDS

---

## 📝 FINAL NOTES

### **Pre-Migration Checklist**
- [ ] All team members briefed
- [ ] Backup procedures tested
- [ ] Rollback procedures tested
- [ ] User communication sent
- [ ] Monitoring systems prepared

### **Post-Migration Monitoring**
- [ ] Monitor error rates for 48 hours
- [ ] Check user feedback channels
- [ ] Monitor billing webhook processing
- [ ] Verify NANP categorization accuracy

### **Success Metrics**
- [ ] **Zero user data loss**
- [ ] **Zero billing disruption**
- [ ] **100% NANP data accuracy**
- [ ] **<4 hour total migration time**

---

## 🏁 MIGRATION TIMELINE

| Phase | Duration | Status |
|-------|----------|--------|
| **Phase 1: Preparation** | 2-3 days | ⏸️ Pending |
| **Phase 2: Core Migration** | 1-2 days | ⏸️ Pending |
| **Phase 3: Function Deployment** | 1 day | ⏸️ Pending |
| **Phase 4: Integration Testing** | 1-2 days | ⏸️ Pending |
| **Phase 5: Cleanup** | 1 day | ⏸️ Pending |
| **Total Estimated Time** | **6-9 days** | ⏸️ Pending |

---

**⚠️ CRITICAL REMINDER:** This migration involves 11 live users and a complete infrastructure overhaul. NO shortcuts. Test everything. Have multiple backups. Be prepared to rollback at any point.

**✅ READY TO PROCEED:** Once all preparation phases are complete and user approval is obtained.

---

*Generated by Claude Code on 2025-07-17 | Senior Developer Migration Analysis*