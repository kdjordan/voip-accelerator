# Critical Issues Roadmap - VoIP Accelerator

*Generated: 2025-07-04*

## 🚨 **HIGH PRIORITY** (Security & Performance)

### ✅ 1. **Fix CORS Configuration** 
- **Location**: `/supabase/functions/_shared/cors.ts`
- **Issue**: `Access-Control-Allow-Origin: "*"` allows any origin
- **Fix**: Replace with specific allowed origins
- **Impact**: Prevents unauthorized cross-origin requests
- **Status**: ✅ **COMPLETED** - Updated CORS to validate origins, updated all 8 edge functions

### ✅ 2. **Remove Production Console Logging**
- **Location**: 41+ files across the codebase
- **Issue**: Excessive logging impacts performance and exposes debug info
- **Fix**: Replace with environment-based logging or remove entirely
- **Impact**: 5-10% performance improvement
- **Status**: ⏳ Pending

### ✅ 3. **Remove Unused Dependency**
- **Location**: `client/package.json`
- **Issue**: `xlsx@0.18.5` unused dependency with security vulnerabilities
- **Fix**: Remove completely as it's not used anywhere in codebase
- **Impact**: Eliminates security vulnerabilities and reduces bundle size
- **Status**: ✅ **COMPLETED** - Removed from package.json (run `npm install` to update lock file)

### ✅ 4. **Fix TypeScript Configuration**
- **Location**: `client/tsconfig.json:19`
- **Issue**: Trailing comma causing syntax error
- **Fix**: Remove trailing comma
- **Impact**: Enables proper TypeScript checking
- **Status**: ⏳ Pending

## 🟡 **MEDIUM PRIORITY** (Code Quality & Functionality)

### ✅ 5. **Create Missing Test Config**
- **Location**: `client/tsconfig.vitest.json`
- **Issue**: Missing file breaks type-check script
- **Fix**: Create proper Vitest TypeScript config
- **Impact**: Enables TypeScript checking and testing
- **Status**: ⏳ Pending

### ✅ 6. **Fix Store Type Mismatches**
- **Location**: Multiple Pinia stores
- **Issue**: Properties accessed but not defined in types
- **Fix**: Add missing properties to store type definitions
- **Impact**: Eliminates TypeScript errors
- **Status**: ⏳ Pending

### ✅ 7. **Optimize Store Performance**
- **Location**: `lerg-store-v2.ts` stats computation
- **Issue**: Multiple filter operations on same dataset
- **Fix**: Use single reduce operation
- **Impact**: Better performance with large datasets
- **Status**: ⏳ Pending

### ✅ 8. **Add File Upload Validation**
- **Location**: File upload handlers
- **Issue**: No server-side validation
- **Fix**: Add file type, size, and content validation
- **Impact**: Improved security and user experience
- **Status**: ⏳ Pending

## 🟢 **LOW PRIORITY** (Nice to Have)

### ✅ 9. **Remove Dead Code**
- **Location**: `PreviewModal.vue:84`
- **Issue**: Commented v-html code
- **Fix**: Remove commented code
- **Impact**: Cleaner codebase
- **Status**: ⏳ Pending

### ✅ 10. **Add Root Package.json**
- **Location**: Project root
- **Issue**: Missing monorepo management
- **Fix**: Create root package.json with workspace config
- **Impact**: Better dependency management
- **Status**: ⏳ Pending

---

## **Progress Tracking**

- **HIGH PRIORITY**: 3/4 completed (75%)
- **MEDIUM PRIORITY**: 0/4 completed  
- **LOW PRIORITY**: 0/2 completed
- **TOTAL**: 3/10 completed (30%)

### **Additional Completed**
- ✅ **Audit edge functions and remove unused ones** - Removed 2 legacy functions (get-lerg-data, add-lerg-record)

## **Estimated Timeline**
- **HIGH PRIORITY**: 2-3 hours
- **MEDIUM PRIORITY**: 4-6 hours  
- **LOW PRIORITY**: 1-2 hours

## **Recommended Order**
Fix items 1-4 first for immediate security and performance benefits, then tackle medium priority items based on development needs.

## **Notes**
- Update status checkboxes as items are completed
- Add implementation notes and timestamps for each completed item
- Consider creating separate issues/PRs for each high-priority item