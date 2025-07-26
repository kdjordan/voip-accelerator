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

## Development Guidelines

### Security Best Practices
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

### Code Style
- Vue 3 Composition API with `<script setup>`
- TypeScript strict mode enabled
- ESLint + Prettier (single quotes, semicolons, 2-space indentation)
- Prefer absolute imports using `@/` alias

### Performance Patterns
- Use `markRaw()` for large datasets in AZ components
- Implement Web Workers for CPU-intensive operations
- Batch IndexedDB operations for US components
- Prevent concurrent operations with `operationInProgress` flags

### Component Patterns
- AZ components have more advanced features (bulk adjustments, effective dates)
- US components focus on simplicity and IndexedDB efficiency
- Feature parity differences are intentional

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

## Development Philosophy

**Ship First, Optimize Later** - This overrides any perfectionist approaches in cursor rules:
- Prioritize user-facing features over internal code cleanup
- Technical debt is acceptable if it doesn't impact users
- Performance over perfect architecture - proven patterns take precedence
- Pragmatic solutions over idealistic patterns

## Production Readiness Notes

- Project name in package.json should be updated from "pricing-tool" to "voip-accelerator"
- Stripe integration still needed for payment processing
- Current architecture is production-ready despite technical debt areas
- Focus on user-facing features over internal code cleanup for initial launch

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