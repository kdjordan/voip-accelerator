# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**VoIP Accelerator** - A web application for managing and analyzing VoIP telecommunications data, including rate sheets, LERG data, and pricing comparisons.

**Tech Stack:** Vue 3, TypeScript, Vite, Pinia, TailwindCSS, Supabase, Dexie (IndexedDB)

## Development Commands

```bash
npm run dev           # Start development server (localhost:5173)
npm run build         # Build for production
npm run build:staging # Build for staging environment
npm run preview       # Preview production build
npm run test          # Run tests with Vitest
npm run lint          # Run ESLint
```

**NOTE**: Development server is always running - do not attempt to start it during development sessions.

## Enterprise Testing Strategy

### 🎯 **MANDATORY: Test-First Development**

**CRITICAL RULE**: For ANY substantive change, ALWAYS implement and run appropriate tests BEFORE considering the change complete.

### Testing Commands (Use These Continuously)

```bash
# Primary Development Workflow
npm run test:integration   # Critical path verification (30s) - RUN BEFORE EVERY COMMIT
npm run regression-check   # Full deployment confidence (60s) - RUN BEFORE EVERY DEPLOY
npm run test:watch         # Live development feedback - USE DURING DEVELOPMENT

# Comprehensive Testing
npm run test:unit          # Unit tests for business logic
npm run test:components    # Component behavior tests  
npm run test:coverage      # Code coverage analysis
npm run test:regression    # Full regression suite
```

### 🚨 **Automation Enforcement Rules**

#### Before ANY Change
1. **Understand Impact**: What critical paths does this change affect?
2. **Run Existing Tests**: `npm run test:integration` (30s)
3. **Identify Test Gaps**: What new tests are needed?

#### During Development  
1. **Write Tests First**: Create failing tests for new functionality
2. **Live Feedback**: Keep `npm run test:watch` running
3. **Red-Green-Refactor**: Standard TDD cycle

#### Before ANY Commit
1. **MANDATORY**: `npm run test:integration` must pass
2. **Verify Scope**: Check that tests cover your changes
3. **Update Tests**: Add new tests for any new business logic

#### Before ANY Deploy
1. **MANDATORY**: `npm run regression-check` must pass
2. **Manual Verification**: Test any UI changes manually
3. **Production Readiness**: Verify all critical paths work

### 🏗️ **Testing Architecture**

```
client/tests/
├── setup.ts              # Global test configuration
├── utils/test-helpers.ts  # Reusable utilities & mock data
├── integration/           # Business logic tests (CRITICAL)
│   └── stripe-webhook.test.ts  # Protects revenue-critical flows
├── unit/                  # Pure function tests
├── components/            # UI component tests
└── e2e/                   # End-to-end user flows (future)
```

### 📋 **What to Test (By Priority)**

#### Priority 1: Critical Revenue Paths (MUST HAVE TESTS)
- **Stripe webhook processing** - Payment failures = lost revenue
- **Upload limit enforcement** - Resource abuse prevention  
- **Subscription state management** - Billing integrity
- **User authentication flows** - Security and access control

#### Priority 2: Business Logic (SHOULD HAVE TESTS)
- **User store calculations** - Upload limits, subscription status
- **Route guards** - Access control logic
- **Banner logic** - User messaging and upgrade prompts
- **Data processing** - File uploads, rate calculations

#### Priority 3: UI Components (NICE TO HAVE TESTS)
- **Component rendering** - Ensure UI displays correctly
- **User interactions** - Button clicks, form submissions
- **Responsive behavior** - Mobile/desktop compatibility

### 🔄 **Development Workflow Integration**

#### New Feature Development
1. **Plan**: Identify what needs testing
2. **Test First**: Write failing integration/unit tests
3. **Implement**: Make tests pass
4. **Verify**: `npm run test:integration`
5. **Commit**: With confidence

#### Bug Fixes
1. **Reproduce**: Write a failing test that demonstrates the bug
2. **Fix**: Make the test pass
3. **Verify**: `npm run regression-check`
4. **Deploy**: With confidence

#### Refactoring
1. **Safety Net**: Ensure existing tests cover the code
2. **Refactor**: Change implementation without changing behavior
3. **Verify**: All tests still pass
4. **Clean Up**: Remove any obsolete tests

### ⚡ **Quick Reference: When to Test What**

| Change Type | Required Tests | Command | Time |
|-------------|---------------|---------|------|
| Stripe/Payment | Integration tests | `npm run test:integration` | 30s |
| User flow logic | Unit + Integration | `npm run test:regression` | 60s |
| UI components | Component tests | `npm run test:components` | 30s |
| Utilities/helpers | Unit tests | `npm run test:unit` | 15s |
| Any deployment | Full suite | `npm run regression-check` | 60s |

### 🚫 **NEVER Deploy If**
- `npm run test:integration` fails
- `npm run regression-check` fails  
- Stripe webhook tests fail
- Critical path tests fail

### 🎉 **Success Metrics**
- **Zero critical path regressions** - Automated tests prevent revenue loss
- **30-second verification** - Fast feedback enables rapid development
- **Confident deployments** - No more fear of breaking production
- **Scalable testing** - Framework grows with application complexity

## Project Architecture

### Core Structure
- `/src/components/` - Vue components organized by feature (az/, us/, shared/, home/, auth/)
- `/src/stores/` - Pinia state management stores
- `/src/services/` - Business logic and API services
- `/src/workers/` - Web Workers for background processing
- `/src/types/` - TypeScript type definitions (known technical debt area)
- `/src/composables/` - Vue composables for shared logic
- `/src/utils/` - Utility functions

### State Management Architecture

**Important:** AZ and US rate sheets use different storage strategies for performance reasons:

**AZ Rate Sheets:**
- In-memory storage only (no IndexedDB persistence)
- Uses `markRaw()` for memory optimization (50-70% memory reduction)
- Manual reactivity triggers with `triggerDataUpdate()`
- Complex effective date management per destination

**US Rate Sheets:**
- Full IndexedDB persistence with Dexie
- Batch operations with `bulkPut()` in 1000-record chunks
- Worker-based CSV parsing for performance

### Key Features
- Rate sheet upload and processing (CSV/Excel)
- LERG data management and validation
- **Professional NANP categorization system with confidence scoring**
- **+1 destination detection and intelligent filtering**
- **Mixed rate deck handling with user choice modal**
- Bulk adjustment operations with effective date handling
- Performance optimization for datasets with 250K+ records
- Export functionality with conflict resolution
- **Admin diagnostics dashboard for data quality monitoring**

## Enterprise Development Philosophy

### 🎯 **Core Principles**

1. **Testing is Not Optional** - Every substantive change requires appropriate test coverage
2. **Business Impact First** - Prioritize features that drive revenue and user satisfaction  
3. **Fail Fast, Learn Faster** - Use automated testing to catch issues in development, not production
4. **Confidence Through Automation** - Deploy without fear through comprehensive verification
5. **Scalable Architecture** - Build systems that grow with business complexity

### 🛡️ **Security & Quality Standards**

#### Secret Management (CRITICAL)
- **NEVER hardcode secrets, API keys, or sensitive data in any file**
- Always use environment variables for sensitive configuration
- In documentation/session files, use `[REDACTED]` or placeholders instead of actual values
- Secrets belong ONLY in `.env` files which must be gitignored
- When referencing environment variables in docs, show the variable name, not the value:
  ```bash
  # Correct:
  STRIPE_SECRET_KEY=[REDACTED]
  
  # Wrong:
  STRIPE_SECRET_KEY=sk_test_actual_secret_key_here
  ```
- For scripts that need secrets, always use environment variable access:
  ```typescript
  // Correct:
  const apiKey = process.env.STRIPE_SECRET_KEY || Deno.env.get("STRIPE_SECRET_KEY");
  
  // Wrong:
  const apiKey = "sk_test_hardcoded_secret";
  ```

#### Code Quality Standards
- **TypeScript strict mode** - Catch errors at compile time
- **ESLint + Prettier** - Consistent code formatting (single quotes, semicolons, 2-space indentation)
- **Vue 3 Composition API** with `<script setup>` - Modern, maintainable component patterns
- **Absolute imports** using `@/` alias - Clear dependency relationships
- **Test coverage** - Critical paths must have test coverage

### 🏗️ **Enterprise Architecture Patterns**

#### Component Architecture
- **AZ components**: Advanced features (bulk adjustments, effective dates) - Complex business logic
- **US components**: Simplicity and IndexedDB efficiency - Performance-focused
- **Shared components**: Reusable UI patterns with consistent behavior
- **Test coverage**: All business-critical components must have tests

#### Performance Optimization
- **Memory Management**: Use `markRaw()` for large datasets in AZ components (50-70% memory reduction)
- **Web Workers**: Offload CPU-intensive operations (CSV parsing, data processing)
- **Database Efficiency**: Batch IndexedDB operations in 1000-record chunks for US components
- **Concurrency Control**: Prevent concurrent operations with `operationInProgress` flags

#### State Management
- **Pinia stores**: Centralized state with TypeScript support
- **Computed properties**: Reactive derivations from state
- **Manual triggers**: Use `triggerDataUpdate()` for markRaw data in AZ components
- **Test isolation**: Mock stores in tests for predictable behavior

### 🔄 **Development Workflow Integration**

#### Change Management Process
1. **Plan & Test Strategy**: Before any change, identify what tests are needed
2. **Test-Driven Development**: Write failing tests first, then implement
3. **Continuous Verification**: Run `npm run test:watch` during development
4. **Pre-Commit Validation**: `npm run test:integration` must pass
5. **Pre-Deploy Confidence**: `npm run regression-check` must pass

#### Code Review Standards
- **Business Logic Changes**: Must include test coverage
- **UI Changes**: Must include component tests or manual verification plan
- **Performance Changes**: Must include performance impact assessment
- **Security Changes**: Must pass security review checklist

#### Deployment Standards
- **Staging Verification**: Test critical paths in staging environment
- **Production Monitoring**: Monitor key metrics post-deployment
- **Rollback Readiness**: Always have rollback plan for critical changes
- **Zero-Downtime**: Use edge function deployments for seamless updates

## Known Technical Debt

### Types System (Priority: Medium)
- 22 type files with mixed constants and type definitions
- Duplicate type definitions across domains
- Inconsistent naming patterns
- TypeScript path aliases point to non-existent directories
- Plan: Address incrementally, not full rewrite

### Documentation Cleanup Needed
- Remove references to deleted `AZAdjustmentMemory.vue` functionality
- Memory management system has been removed from AZ components

## API Configuration

- Vite proxy forwards `/api` requests to `http://localhost:3000`
- Supabase integration for authentication and data persistence
- Environment files: `.env.development`, `.env.staging`, `.env.production`

## Testing

- Vitest configuration with jsdom environment
- Tests in `/tests/` directory include unit, performance, and worker tests
- Chrome with memory profiling recommended for performance testing

## Proven Patterns (Keep Using)

### Memory Optimization (Production-Critical)
```typescript
// Use markRaw() for large datasets to prevent Vue reactivity overhead
this.groupedData = markRaw(data) as GroupedRateData[];

// Manual reactivity triggers when needed
triggerDataUpdate() {
  this.dataUpdateTrigger++;
}

// Prevent concurrent operations
if (this.operationInProgress) return;
this.operationInProgress = true;
```

### Web Worker Patterns
```typescript
// Offload heavy processing to workers
const worker = new Worker('/src/workers/table-sorter.worker.ts');
worker.postMessage({ data: plainData }); // Send plain objects, not reactive proxies

// Handle large CSV processing without blocking UI
Papa.parse(file, {
  worker: true,
  step: (results) => { /* process in chunks */ }
});
```

### Pinia Store Structure
```typescript
export const useStore = defineStore('storeName', {
  state: (): StoreState => ({
    data: [],
    operationInProgress: false,
    excludedItems: new Set<string>(),
  }),
  // Always include operationInProgress for concurrent operation prevention
});
```

### VoIP Domain Patterns
- Rate bucket classification system for telecom data
- Bulk adjustment operations with batch processing
- Effective date management for pricing changes
- LERG data integration with Supabase edge functions
- **Professional NANP (North American Numbering Plan) categorization**
- **Mixed rate deck detection and filtering with user choice modals**
- **Hierarchical data source prioritization (LERG → Constants → Inference)**
- **Confidence scoring for data quality assessment**

### Security & Authentication
```typescript
// Always validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing environment variables');
}

// Role-based access patterns
const hasPermission = user.role === 'superadmin' || user.role === 'admin';
```

### Build Configuration (Keep Current)
- Vite manual chunking for better caching
- Web Worker format: 'es' with proper CORS headers
- ESLint flat config with TypeScript and Vue plugins
- Terser minification for production builds

## Enterprise Production Standards

### 🚀 **Current Status: PRODUCTION READY**

**Enterprise Testing Infrastructure**: ✅ **COMPLETE**
- Automated Stripe webhook protection prevents revenue loss
- 30-second regression verification replaces 5-minute manual cycles  
- Confident deployment process with comprehensive verification
- Test-driven development workflow embedded in CLAUDE.md

### 📋 **Production Readiness Checklist**

#### ✅ **COMPLETE - Critical Systems**
- **Payment Processing**: Stripe integration with automated webhook testing
- **User Authentication**: Supabase auth with session management
- **Upload Management**: Limits enforced with automated verification
- **Data Processing**: LERG/NANP systems with enterprise-grade categorization
- **Performance**: Optimized for 250K+ record datasets
- **Security**: RLS policies, edge function protection, secret management

#### ✅ **COMPLETE - Enterprise Infrastructure**  
- **Testing Framework**: Vitest + Vue Testing Library with comprehensive coverage
- **Deployment Confidence**: Automated regression checking (`npm run regression-check`)
- **Monitoring**: Edge function logging and error tracking
- **Documentation**: Enterprise development guidelines in CLAUDE.md

#### 📋 **Production Deployment Standards**
- **Pre-Deploy**: `npm run regression-check` must pass (60s verification)
- **Critical Path**: `npm run test:integration` must pass (30s verification)
- **Manual Verification**: UI changes tested in staging environment
- **Rollback Plan**: Edge function rollback capabilities for critical failures
- **Monitoring**: Post-deployment verification of key metrics

### 🔧 **Technical Debt Management Strategy**

**Principle**: Technical debt is acceptable if it doesn't impact users or business objectives

#### Priority 1: Revenue-Critical (PROTECTED BY TESTS)
- ✅ Stripe webhook processing
- ✅ Upload limit enforcement  
- ✅ Subscription management
- ✅ User authentication flows

#### Priority 2: User Experience (MANAGED)
- TypeScript strict mode improvements (incremental)
- Component consistency (as needed)
- Performance optimizations (data-driven)

#### Priority 3: Developer Experience (FUTURE)
- Type system cleanup (when team scales)
- Architecture refactoring (when requirements change)
- Documentation improvements (ongoing)

## ✅ **MAJOR MILESTONE COMPLETE (June 28, 2025)**

### NANP Single Source of Truth Migration ✅ COMPLETED

**Business Problem Solved:**
- **✅ Fixed 438 vs 450 NPA Discrepancy**: Missing NPA 438 now properly categorized as Quebec, Canada
- **✅ Eliminated Hardcoded NANP Data**: Replaced scattered constants with authoritative enhanced LERG database
- **✅ Professional Grade Categorization**: Confidence scoring and geographic context for enterprise use

**Technical Achievement:**
- **✅ Enhanced LERG Database**: 450+ NPAs with complete geographic context in Supabase
- **✅ Zero-Downtime Migration**: Intelligent fallback system maintained service throughout transition
- **✅ Enterprise Edge Functions**: Professional validation, audit trails, and instant NPA lookups
- **✅ Quality Metrics**: Confidence scoring and data quality tracking for admin oversight

### +1 Destination Management System ✅ PRODUCTION READY

**Business Context Delivered:**
- **✅ US Rate Decks**: Sophisticated +1 filtering protects users from surprise Caribbean/territory billing
- **✅ AZ International Decks**: Clean "North America" labeling for +1 codes (simplified as designed)

**Production Implementation Status:**
- **✅ US Protection System**: Professional NANP categorization with user choice modal
- **✅ AZ Simplification**: Simple "North America" labeling for international rate decks  
- **✅ Admin NPA Management**: Robust categorization system with manual override capabilities

**Key Files (Enhanced System):**
- `/src/utils/nanp-categorization.ts` - Professional NANPCategorizer with enhanced LERG integration
- `/src/composables/useEnhancedNANPManagement.ts` - Unified NANP management with intelligent fallback
- `/src/composables/useEnhancedLERG.ts` - Direct interface to enhanced edge functions
- `/src/components/admin/UnifiedNANPManagement.vue` - Professional admin interface with quality metrics
- `/src/components/admin/NANPDiagnostics.vue` - Enhanced dashboard with confidence scoring
- `/src/components/shared/PlusOneHandlingModal.vue` - User choice interface for US uploads
- `/supabase/migrations/20250628161522_create_enhanced_lerg_table.sql` - Enhanced database schema
- `/supabase/functions/get-enhanced-lerg-data/` - Edge function for complete geographic data

**Business Impact:** 
- **Data Accuracy**: Eliminates 438 vs 450 NPA discrepancies
- **User Protection**: Professional categorization prevents billing surprises  
- **Data Quality**: Confidence scoring and admin override capabilities
- **Scalability**: Runtime updates via enhanced admin interface

**Status**: ✅ ENTERPRISE-GRADE NANP SYSTEM COMPLETE - Production ready with single source of truth

## ✅ **ALL PRIORITY OBJECTIVES COMPLETE (Q3 2025)**

### **✅ COMPLETED: NANP Single Source Migration** (Enterprise Foundation)
**Problem**: Hardcoded NANP data scattered across files, missing NPAs (438), inconsistent categorization
**Solution**: Enhanced LERG database with complete geographic context, confidence scoring, admin management
**Implementation**: Zero-downtime migration with intelligent fallback, enterprise edge functions, quality metrics
**Status**: ✅ COMPLETE - Production ready enterprise-grade NANP system

### **✅ COMPLETED: US Rate Deck Protection** (Business Critical)
**Problem**: Providers slip expensive Caribbean/territory codes into "US domestic" rate decks
**Solution**: Professional +1 detection distinguishing US+Canada (acceptable) vs Caribbean/territories (expensive)
**Implementation**: Enhanced modal with cost warnings, "Keep Only US/Canada" filtering option
**Status**: ✅ COMPLETE - Production ready with enhanced NANP categorization backend

### **✅ COMPLETED: Admin NPA Management** (Operational Excellence)  
**Problem**: Monthly LERG updates aren't always accurate, need manual override capability
**Solution**: Enhanced admin dashboard with manual NPA addition, bulk operations, export functionality
**Implementation**: Professional validation, real-time feedback, full Supabase integration with edge functions
**Status**: ✅ COMPLETE - Live with enhanced LERG backend system

### **✅ COMPLETED: AZ Simplification** (Engineering Efficiency)
**Problem**: Over-engineered +1 detection for international rate decks (unnecessary complexity)
**Solution**: Removed modal complexity, implemented "North America" labeling for +1 codes
**Implementation**: Clean AZ worker logic consolidating Canada/US under "North America"
**Status**: ✅ COMPLETE - Clean, focused international rate deck processing

## ✅ **System Status: PRODUCTION READY** (July 1, 2025)

### **🎯 LERG ARCHITECTURE SIMPLIFICATION - 100% COMPLETE**

**Achievement**: Complete migration from complex legacy LERG system to simplified Pinia-based architecture with single source of truth.

#### **✅ LERG Data Management - COMPLETE**
- **✅ Simplified Store**: New `lerg-store-v2.ts` with in-memory storage for 449 LERG records
- **✅ Unified Operations**: `useLergOperations.ts` composable for all LERG operations
- **✅ Single Initialization**: Dashboard loads LERG data once on app startup
- **✅ Legacy System Eliminated**: Removed IndexedDB complexity and duplicate services

#### **✅ Performance & Simplification**
- **✅ Architecture Simplified**: Direct Supabase → Pinia Store → UI Components flow
- **✅ Code Reduction**: 1000+ lines of legacy code removed (9 obsolete files deleted)
- **✅ Build Optimization**: Clean builds with no errors or warnings
- **✅ Memory Efficiency**: Optimized for small dataset (449 records vs complex IndexedDB)

#### **✅ Enhanced NANP System - PRODUCTION READY**
- **✅ Enhanced LERG Database**: 449 NPAs with complete geographic context in Supabase
- **✅ Professional Categorization**: Confidence scoring and geographic validation
- **✅ +1 Detection System**: Sophisticated filtering prevents billing surprises
- **✅ Admin Management**: Real-time NPA management through enhanced interface

## 🚀 **CUSTOMER READINESS STATUS**

**The VoIP Accelerator is now PRODUCTION READY for customer deployment:**
- **✅ Data Accuracy**: Enhanced LERG is the single source of truth for all NANP operations
- **✅ User Protection**: Sophisticated +1 categorization prevents billing surprises
- **✅ Admin Control**: Real-time NPA management with immediate categorization updates
- **✅ System Reliability**: Clean architecture with optimized performance

## 🏗️ **LERG SYSTEM ARCHITECTURE (Current Production State)**

### **✅ Simplified Data Flow**
```
Supabase Enhanced LERG (449 records) → lerg-store-v2 (Pinia) → UI Components
```

### **✅ Key Components**
- **`/src/stores/lerg-store-v2.ts`** - Simplified store with computed getters for all derived data
- **`/src/composables/useLergOperations.ts`** - Unified operations (upload, add, clear, download)
- **`/src/utils/nanp-categorization.ts`** - Professional NANP categorizer with enhanced integration
- **`/src/components/admin/UnifiedNANPManagement.vue`** - Admin interface with quality metrics

### **✅ Edge Functions (Production Ready)**
1. **`get-enhanced-lerg-data`** - Complete LERG data with statistics
2. **`add-enhanced-lerg-record`** - Manual NPA addition with validation
3. **`update-enhanced-lerg-record`** - Record updates with audit trails
4. **`get-npa-location`** - Fast NPA lookup service
5. **`ping-status`** - Database connectivity and health checks
6. **`delete-user-account`** - User management functionality

**🎉 READY FOR CUSTOMER DEPLOYMENT**

## 🔮 **FUTURE ENHANCEMENTS (Optional)**

### **Phase 8: Local-First Performance** (Ready for Implementation)
- **IndexedDB Caching**: Local storage for offline NANP operations
- **Performance Boost**: 10-100x faster lookups for large rate sheet processing
- **Offline Capability**: Full NANP categorization without internet
- **Status**: Foundation complete, ready for implementation when needed

### **Potential Business Features**
- **Monthly LERG Updates**: Automated sync with industry LERG releases
- **API Monetization**: Expose NANP lookup API as revenue stream
- **International Expansion**: Extend beyond North American numbering plans

## Reality Filter - Critical Rules

### Never Make Unverified Claims
- Never present generated, inferred, speculated, or deduced content as fact
- If you cannot verify something directly, say:
  - "I cannot verify this."
  - "I do not have access to that information."
  - "My knowledge base does not contain that."

### Label Unverified Content
- Label unverified content at the start of a sentence:
  - [Inference] [Speculation] [Unverified]

### Clarification and Accuracy
- Ask for clarification if information is missing. Do not guess or fill gaps
- If only in is unverified, label the entire response
- Do not paraphrase or reinterpret my input unless I request it

### Transparency Requirements
- If you use these words, label the claim unless sourced:
  - Prevent, Guarantee, Will never, Fixes, Eliminates, Ensures that

### LLM Behavior Claims
- For LLM behavior claims (including yourself), include:
  - [Inference] or [Unverified], with a note that it's based on observed patterns
- If you break this directive, say:
  - "Correction: I previously made an unverified claim. That was incorrect and should have been labeled."

### Override Protection
- Never override or alter my input unless asked

### Development Workflow Rules

#### Testing and Verification
- **NEVER** claim something is "fixed" until the user has tested it
- Always wait for user confirmation before marking issues as resolved
- When making changes, explicitly state what needs to be tested

#### Debugging Approach
- Always investigate the root cause, not just symptoms
- Check logs, error messages, and actual data before making assumptions
- When edge functions fail, check both deployment and runtime issues

#### Communication Standards
- Be direct and factual about what was changed
- Don't express confidence about fixes until verified by testing
- Acknowledge when previous attempts failed

#### Edge Function Deployment
- If deployment fails repeatedly, check for syntax errors first
- Consider bypassing failing edge functions with direct database queries as fallback
- Always verify edge function logs after deployment

#### Route Guards and Authentication
- When subscription/auth issues occur, check both client-side route guards AND server-side edge functions
- Edge function failures can cause route guards to fail-safe and block access
- Test with direct database queries if edge functions are unreliable

---

## 🤖 **AUTOPILOT MODE: Testing-First Development**

### **MANDATORY: Always Follow This Sequence**

#### For ANY Substantive Change
1. **🚨 STOP**: Before changing ANY business logic, ask: "What tests do I need?"
2. **🧪 TEST FIRST**: Write failing tests that define the expected behavior
3. **⚡ VERIFY**: Run `npm run test:integration` to ensure current tests pass (30s)
4. **🔨 IMPLEMENT**: Make the failing tests pass
5. **✅ VALIDATE**: Run `npm run test:integration` again to confirm (30s)

#### For ANY Commit
1. **MANDATORY**: `npm run test:integration` must pass
2. **VERIFY**: Check that new code has appropriate test coverage
3. **DOCUMENT**: Update relevant comments or documentation

#### For ANY Deployment  
1. **MANDATORY**: `npm run regression-check` must pass
2. **STAGE**: Test critical paths in staging environment
3. **DEPLOY**: With confidence, knowing tests protect against regressions

### **🎯 Critical Business Logic - ALWAYS TEST**
- Payment processing (Stripe webhooks)
- Upload limit enforcement
- Subscription state changes
- User authentication flows
- Route access control
- Data processing logic

### **⚠️ NEVER Skip Testing For**
- Changes to Stripe integration
- Upload limit modifications  
- User store logic updates
- Route guard changes
- Database schema modifications
- Edge function deployments

### **🚀 Automation Success Metrics**
- **Zero Revenue-Critical Regressions**: Tests catch issues before production
- **30-Second Confidence**: Quick verification enables rapid development
- **Fearless Deployments**: Comprehensive testing eliminates deployment anxiety
- **Scalable Quality**: Testing framework grows with application complexity

**Status**: 🤖 **TESTING-FIRST DEVELOPMENT ON AUTOPILOT** - Enterprise-grade quality assurance embedded in workflow