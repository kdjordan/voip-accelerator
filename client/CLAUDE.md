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

## 🎯 **Recent Major Feature Completion (June 2025)**

### +1 Destination Management System ✅ STRATEGIC PIVOT

**Business Context Clarification:**
- **US Rate Decks**: Need sophisticated +1 filtering to protect users from surprise Caribbean/territory billing
- **AZ International Decks**: Simple labeling fix - display +1 codes as "North America" instead of "United States"

**Current Implementation Status:**
- ✅ **US Protection System**: Professional NANP categorization with user choice modal (KEEP)
- 🔄 **AZ Simplification**: Remove complex detection, use simple "North America" labeling (PIVOT)
- ✅ **Admin NPA Management**: Robust categorization system for ongoing data quality (ENHANCE)

**Key Files (Active):**
- `/src/utils/nanp-categorization.ts` - Core categorization engine for US protection
- `/src/utils/plus-one-detector.ts` - US-focused +1 detection for billing protection
- `/src/components/shared/PlusOneHandlingModal.vue` - User choice interface for US uploads
- `/src/components/admin/NANPDiagnostics.vue` - Admin dashboard for NPA management

**Business Impact:** Protects US users from surprise billing while maintaining enterprise-grade categorization for admin operations.

**Next Priority**: Remove AZ over-engineering, focus on US protection + admin NPA management tools

## 🎯 **Current Development Priorities (Q3 2025)**

### **Priority 1: US Rate Deck Protection** (Business Critical)
**Problem**: Providers slip expensive Caribbean/territory codes into "US domestic" rate decks
**Solution**: Professional +1 detection distinguishing US+Canada (acceptable) vs Caribbean/territories (expensive)
**User Value**: "This deck contains Bahamas/Jamaica codes - these are expensive destinations, do you want them?"
**Status**: Core system complete, needs refinement and testing

### **Priority 2: Admin NPA Management** (Operational Excellence)  
**Problem**: Monthly LERG updates aren't always accurate, need manual override capability
**Solution**: Robust admin tools for real-time NPA categorization updates via Supabase
**Business Value**: Fix categorization issues immediately without code deployments
**Timeline**: 2-3 days development (high ROI)

### **Priority 3: AZ Simplification** (Engineering Efficiency)
**Problem**: Over-engineered +1 detection for international rate decks (unnecessary complexity)
**Solution**: Remove modal/filtering complexity, simple "North America" labeling instead of "United States"
**Outcome**: Focus engineering effort where business value is highest